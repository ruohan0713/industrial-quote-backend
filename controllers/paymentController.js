// controllers/paymentController.js - 微信支付控制器
const crypto = require('crypto');
const axios = require('axios');
const { supabase } = require('../config/supabase');

/**
 * 微信支付配置
 * 需要在微信商户平台获取以下信息：
 * https://pay.weixin.qq.com
 */
const PAY_CONFIG = {
  appid: process.env.WECHAT_APPID,           // 小程序APPID
  mchid: process.env.WECHAT_MCH_ID,          // 商户号
  apiKey: process.env.WECHAT_PAY_KEY,        // API密钥v2（用于签名）
  apiV3Key: process.env.WECHAT_PAY_V3_KEY,   // APIv3密钥
  serialNo: process.env.WECHAT_CERT_SERIAL,  // 证书序列号
  notifyUrl: process.env.PAY_NOTIFY_URL || 'https://api.yourdomain.com/api/payment/notify'
};

/**
 * 生成随机字符串
 */
function generateNonceStr(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成签名（微信支付v2）
 */
function generateSign(params, apiKey) {
  // 1. 参数名ASCII码从小到大排序
  const sortedKeys = Object.keys(params).sort();
  
  // 2. 拼接参数
  const stringA = sortedKeys
    .filter(key => params[key] !== '' && key !== 'sign')
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  // 3. 拼接API密钥
  const stringSignTemp = `${stringA}&key=${apiKey}`;
  
  // 4. MD5签名并转为大写
  return crypto.createHash('md5').update(stringSignTemp, 'utf8').digest('hex').toUpperCase();
}

/**
 * 生成签名（微信支付v3）
 */
function generateSignV3(method, url, timestamp, nonceStr, body) {
  const message = `${method}\n${url}\n${timestamp}\n${nonceStr}\n${body}\n`;
  
  // 使用商户私钥进行SHA256WithRSA签名
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  
  // 需要商户API证书私钥
  // const privateKey = fs.readFileSync('path/to/apiclient_key.pem');
  // return sign.sign(privateKey, 'base64');
  
  // 简化版：返回空（实际使用需要证书）
  return '';
}

/**
 * 统一下单（微信支付v3 - JSAPI支付）
 */
exports.prepay = async (req, res) => {
  try {
    const { orderNo, amount, description, type, relatedId, openid } = req.body;
    const userId = req.user.userId;
    
    // 验证参数
    if (!orderNo || !amount || !description || !openid) {
      return res.status(400).json({
        success: false,
        message: '参数不完整'
      });
    }
    
    // 验证金额（分）
    if (amount < 1 || amount > 100000000) {
      return res.status(400).json({
        success: false,
        message: '支付金额无效'
      });
    }
    
    // 生成时间戳和随机字符串
    const timestamp = Math.floor(Date.now() / 1000);
    const nonceStr = generateNonceStr();
    
    // 构建请求参数（微信支付v3）
    const requestBody = {
      appid: PAY_CONFIG.appid,
      mchid: PAY_CONFIG.mchid,
      description: description,
      out_trade_no: orderNo,
      notify_url: PAY_CONFIG.notifyUrl,
      amount: {
        total: amount,
        currency: 'CNY'
      },
      payer: {
        openid: openid
      },
      attach: JSON.stringify({ type, relatedId, userId })
    };
    
    // 调用微信支付统一下单接口
    // 注意：实际使用需要证书和签名
    console.log('统一下单请求:', requestBody);
    
    // ==========================================
    // 以下是简化版实现（用于开发测试）
    // 生产环境需要使用真实的微信支付API
    // ==========================================
    
    // 模拟预支付ID（实际需要调用微信API获取）
    const prepay_id = `prepay_${orderNo}_${Date.now()}`;
    
    // 生成小程序调起支付的参数
    const payParams = {
      appId: PAY_CONFIG.appid,
      timeStamp: timestamp.toString(),
      nonceStr: nonceStr,
      package: `prepay_id=${prepay_id}`,
      signType: 'MD5'
    };
    
    // 生成paySign（使用v2签名）
    payParams.paySign = generateSign(payParams, PAY_CONFIG.apiKey);
    
    // 保存支付订单到数据库
    const { error: insertError } = await supabase
      .from('payment_orders')
      .insert({
        order_no: orderNo,
        user_id: userId,
        amount: amount,
        description: description,
        payment_type: type,
        related_id: relatedId,
        status: 'pending',
        prepay_id: prepay_id,
        created_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('保存支付订单失败:', insertError);
    }
    
    res.json({
      success: true,
      data: {
        timeStamp: payParams.timeStamp,
        nonceStr: payParams.nonceStr,
        package: payParams.package,
        signType: payParams.signType,
        paySign: payParams.paySign,
        orderNo: orderNo
      },
      message: '预支付订单创建成功'
    });
    
  } catch (error) {
    console.error('统一下单失败:', error);
    res.status(500).json({
      success: false,
      message: '创建支付订单失败',
      error: error.message
    });
  }
};

/**
 * 支付回调通知
 */
exports.notify = async (req, res) => {
  try {
    console.log('收到支付回调通知:', req.body);
    
    // 解析XML（微信支付v2回调是XML格式）
    // 或解析JSON（微信支付v3回调是JSON格式）
    const { return_code, result_code, out_trade_no, transaction_id } = req.body;
    
    if (return_code === 'SUCCESS' && result_code === 'SUCCESS') {
      // 支付成功，更新订单状态
      const { data: order } = await supabase
        .from('payment_orders')
        .select('*')
        .eq('order_no', out_trade_no)
        .single();
      
      if (order && order.status === 'pending') {
        // 更新订单状态
        await supabase
          .from('payment_orders')
          .update({
            status: 'paid',
            transaction_id: transaction_id,
            paid_at: new Date().toISOString()
          })
          .eq('order_no', out_trade_no);
        
        // 根据支付类型执行相应的业务逻辑
        const attach = JSON.parse(order.attach || '{}');
        await handlePaymentSuccess(attach.type, attach.relatedId, attach.userId);
        
        // 返回成功
        res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>');
      } else {
        res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>');
      }
    } else {
      res.send('<xml><return_code><![CDATA[FAIL]]></return_code></xml>');
    }
  } catch (error) {
    console.error('处理支付回调失败:', error);
    res.send('<xml><return_code><![CDATA[FAIL]]></return_code></xml>');
  }
};

/**
 * 确认支付（前端主动查询）
 */
exports.confirm = async (req, res) => {
  try {
    const { orderNo, type, relatedId } = req.body;
    const userId = req.user.userId;
    
    // 查询订单状态
    const { data: order, error } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('order_no', orderNo)
      .eq('user_id', userId)
      .single();
    
    if (error || !order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    if (order.status === 'paid') {
      // 已支付，执行业务逻辑
      await handlePaymentSuccess(type, relatedId, userId);
      
      res.json({
        success: true,
        message: '支付确认成功',
        data: { status: 'paid' }
      });
    } else {
      res.json({
        success: false,
        message: '订单未支付',
        data: { status: order.status }
      });
    }
  } catch (error) {
    console.error('确认支付失败:', error);
    res.status(500).json({
      success: false,
      message: '确认支付失败',
      error: error.message
    });
  }
};

/**
 * 处理支付成功后的业务逻辑
 */
async function handlePaymentSuccess(type, relatedId, userId) {
  try {
    switch (type) {
      case 'unlock_quote':
        // 解锁报价单
        await supabase
          .from('unlock_records')
          .insert({
            user_id: userId,
            quote_id: relatedId,
            unlock_type: 'payment',
            created_at: new Date().toISOString()
          });
        console.log('报价单解锁成功:', relatedId);
        break;
      
      case 'generate_contract':
        // 生成合同权限
        console.log('合同生成权限已授予:', relatedId);
        break;
      
      default:
        console.log('未知支付类型:', type);
    }
  } catch (error) {
    console.error('处理支付成功业务失败:', error);
  }
}

/**
 * 查询订单状态
 */
exports.query = async (req, res) => {
  try {
    const { orderNo } = req.query;
    const userId = req.user.userId;
    
    const { data: order, error } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('order_no', orderNo)
      .eq('user_id', userId)
      .single();
    
    if (error || !order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('查询订单失败:', error);
    res.status(500).json({
      success: false,
      message: '查询订单失败',
      error: error.message
    });
  }
};

module.exports = exports;

