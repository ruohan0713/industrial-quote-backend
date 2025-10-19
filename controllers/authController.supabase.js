// controllers/authController.supabase.js - 认证控制器（Supabase版本）
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

// 微信登录
exports.wechatLogin = async (req, res) => {
  try {
    const { code, userInfo } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: '缺少code参数'
      });
    }
    
    // 调用微信接口获取openid和session_key
    const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${process.env.WECHAT_APPID}&secret=${process.env.WECHAT_SECRET}&js_code=${code}&grant_type=authorization_code`;
    
    const wxResponse = await axios.get(wxUrl);
    
    if (wxResponse.data.errcode) {
      return res.status(400).json({
        success: false,
        message: '微信登录失败',
        error: wxResponse.data.errmsg
      });
    }
    
    const { openid, session_key } = wxResponse.data;
    
    // 查询用户
    const { data: existingUsers, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('openid', openid);
    
    if (queryError) {
      throw queryError;
    }
    
    let user;
    
    if (!existingUsers || existingUsers.length === 0) {
      // 创建新用户
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          openid,
          nick_name: userInfo?.nickName || '微信用户',
          avatar_url: userInfo?.avatarUrl || '',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      user = newUser;
    } else {
      user = existingUsers[0];
      
      // 更新用户信息
      if (userInfo) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            nick_name: userInfo.nickName,
            avatar_url: userInfo.avatarUrl,
            last_login_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (updateError) {
          console.error('更新用户信息失败:', updateError);
        }
      }
    }
    
    // 生成JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        openid: user.openid,
        isCertified: user.is_certified || false
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.json({
      success: true,
      data: {
        token,
        userInfo: {
          id: user.id,
          nickName: user.nick_name,
          avatarUrl: user.avatar_url,
          isCertified: user.is_certified || false
        }
      }
    });
  } catch (error) {
    console.error('微信登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
};

// 刷新token
exports.refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: '缺少token参数'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 生成新token
    const newToken = jwt.sign(
      {
        userId: decoded.userId,
        openid: decoded.openid,
        isCertified: decoded.isCertified
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.json({
      success: true,
      data: { token: newToken }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token无效或已过期'
    });
  }
};

// 登出
exports.logout = async (req, res) => {
  res.json({
    success: true,
    message: '登出成功'
  });
};

// 获取手机号
exports.getPhoneNumber = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.userId;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: '缺少code参数'
      });
    }
    
    // 调用微信接口获取手机号
    // 注意：这需要企业认证的小程序才能使用
    const accessTokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${process.env.WECHAT_APPID}&secret=${process.env.WECHAT_SECRET}`;
    const tokenResponse = await axios.get(accessTokenUrl);
    
    if (!tokenResponse.data.access_token) {
      throw new Error('获取access_token失败');
    }
    
    const phoneUrl = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${tokenResponse.data.access_token}`;
    const phoneResponse = await axios.post(phoneUrl, { code });
    
    if (phoneResponse.data.errcode !== 0) {
      throw new Error(phoneResponse.data.errmsg);
    }
    
    const phoneNumber = phoneResponse.data.phone_info.phoneNumber;
    
    // 更新用户手机号
    const { error } = await supabase
      .from('users')
      .update({ phone: phoneNumber })
      .eq('id', userId);
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      data: { phoneNumber }
    });
  } catch (error) {
    console.error('获取手机号错误:', error);
    res.status(500).json({
      success: false,
      message: '获取手机号失败',
      error: error.message
    });
  }
};

module.exports = exports;

