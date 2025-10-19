// controllers/contractController.js - 合同控制器
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// 生成采购合同
exports.generatePurchaseContract = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.body;
    
    // 获取订单信息
    const [orders] = await db.query(
      `SELECT o.*, q.factory_name, q.contact_name as factory_contact, q.contact_phone as factory_phone
       FROM orders o
       LEFT JOIN quotes q ON o.quote_id = q.id
       WHERE o.id = ?`,
      [orderId]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    const order = orders[0];
    
    // 获取订单产品
    const [products] = await db.query(
      'SELECT * FROM order_products WHERE order_id = ?',
      [orderId]
    );
    
    // 生成合同记录
    const contractId = uuidv4();
    await db.query(
      `INSERT INTO contracts 
      (id, type, user_id, order_id, sample_id, created_at)
      VALUES (?, 'purchase', ?, ?, NULL, NOW())`,
      [contractId, userId, orderId]
    );
    
    res.json({
      success: true,
      message: '合同生成成功',
      data: {
        contractId,
        order: { ...order, products }
      }
    });
  } catch (error) {
    console.error('生成采购合同错误:', error);
    res.status(500).json({
      success: false,
      message: '合同生成失败'
    });
  }
};

// 生成试样协议
exports.generateSampleContract = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sampleId } = req.body;
    
    // 获取试样信息
    const [samples] = await db.query(
      `SELECT s.*, q.factory_name, q.contact_name as factory_contact, q.contact_phone as factory_phone
       FROM samples s
       LEFT JOIN quotes q ON s.quote_id = q.id
       WHERE s.id = ?`,
      [sampleId]
    );
    
    if (samples.length === 0) {
      return res.status(404).json({
        success: false,
        message: '试样申请不存在'
      });
    }
    
    const sample = samples[0];
    
    // 获取试样产品
    const [products] = await db.query(
      'SELECT * FROM sample_products WHERE sample_id = ?',
      [sampleId]
    );
    
    // 生成合同记录
    const contractId = uuidv4();
    await db.query(
      `INSERT INTO contracts 
      (id, type, user_id, order_id, sample_id, created_at)
      VALUES (?, 'sample', ?, NULL, ?, NOW())`,
      [contractId, userId, sampleId]
    );
    
    res.json({
      success: true,
      message: '协议生成成功',
      data: {
        contractId,
        sample: { ...sample, products }
      }
    });
  } catch (error) {
    console.error('生成试样协议错误:', error);
    res.status(500).json({
      success: false,
      message: '协议生成失败'
    });
  }
};

// 获取合同详情
exports.getContractById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const [contracts] = await db.query(
      'SELECT * FROM contracts WHERE id = ?',
      [id]
    );
    
    if (contracts.length === 0) {
      return res.status(404).json({
        success: false,
        message: '合同不存在'
      });
    }
    
    const contract = contracts[0];
    
    // 验证权限
    if (contract.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权查看此合同'
      });
    }
    
    res.json({
      success: true,
      data: contract
    });
  } catch (error) {
    console.error('获取合同详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取合同详情失败'
    });
  }
};

// 获取我的合同列表
exports.getMyContracts = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [contracts] = await db.query(
      'SELECT * FROM contracts WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    res.json({
      success: true,
      data: contracts
    });
  } catch (error) {
    console.error('获取我的合同列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取合同列表失败'
    });
  }
};

