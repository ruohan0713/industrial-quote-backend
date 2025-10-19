// controllers/sampleController.js - 试样控制器
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// 创建试样申请（与订单控制器类似，但字段略有不同）
exports.createSample = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    const userId = req.user.userId;
    const { quoteId, companyName, contactName, contactPhone, recipientName, deliveryAddress, remark, products } = req.body;
    
    if (!quoteId || !companyName || !contactName || !contactPhone || !recipientName || !deliveryAddress || !products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请填写完整的试样信息'
      });
    }
    
    const sampleId = uuidv4();
    
    // 插入试样主记录
    await conn.query(
      `INSERT INTO samples 
      (id, quote_id, user_id, company_name, contact_name, contact_phone, 
       recipient_name, delivery_address, remark, delivery_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [sampleId, quoteId, userId, companyName, contactName, contactPhone, recipientName, deliveryAddress, remark || '']
    );
    
    // 插入试样产品
    for (const product of products) {
      await conn.query(
        `INSERT INTO sample_products 
        (id, sample_id, product_name, brand_model, factory_price, quantity, unit, purpose, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [uuidv4(), sampleId, product.productName, product.brandModel,
         product.factoryPrice, product.quantity, product.unit, product.purpose || '']
      );
    }
    
    await conn.commit();
    
    res.json({
      success: true,
      message: '试样申请创建成功',
      data: { sampleId }
    });
  } catch (error) {
    await conn.rollback();
    console.error('创建试样申请错误:', error);
    res.status(500).json({
      success: false,
      message: '试样申请创建失败',
      error: error.message
    });
  } finally {
    conn.release();
  }
};

// 获取我的试样申请
exports.getMySamples = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [samples] = await db.query(
      `SELECT s.*, q.factory_name 
       FROM samples s
       LEFT JOIN quotes q ON s.quote_id = q.id
       WHERE s.user_id = ? 
       ORDER BY s.created_at DESC`,
      [userId]
    );
    
    // 获取试样产品
    for (let sample of samples) {
      const [products] = await db.query(
        'SELECT * FROM sample_products WHERE sample_id = ?',
        [sample.id]
      );
      sample.products = products;
    }
    
    res.json({
      success: true,
      data: samples
    });
  } catch (error) {
    console.error('获取我的试样申请错误:', error);
    res.status(500).json({
      success: false,
      message: '获取试样申请失败'
    });
  }
};

// 获取收到的试样申请（工厂）
exports.getReceivedSamples = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // 查找我发布的报价单
    const [myQuotes] = await db.query('SELECT id FROM quotes WHERE user_id = ?', [userId]);
    
    if (myQuotes.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    const quoteIds = myQuotes.map(q => q.id);
    
    const [samples] = await db.query(
      `SELECT s.*, u.nick_name as requester_name 
       FROM samples s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.quote_id IN (?)
       ORDER BY s.created_at DESC`,
      [quoteIds]
    );
    
    // 获取试样产品
    for (let sample of samples) {
      const [products] = await db.query(
        'SELECT * FROM sample_products WHERE sample_id = ?',
        [sample.id]
      );
      sample.products = products;
    }
    
    res.json({
      success: true,
      data: samples
    });
  } catch (error) {
    console.error('获取收到的试样申请错误:', error);
    res.status(500).json({
      success: false,
      message: '获取试样申请失败'
    });
  }
};

// 获取试样详情
exports.getSampleById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const [samples] = await db.query(
      `SELECT s.*, q.factory_name, q.user_id as factory_user_id
       FROM samples s
       LEFT JOIN quotes q ON s.quote_id = q.id
       WHERE s.id = ?`,
      [id]
    );
    
    if (samples.length === 0) {
      return res.status(404).json({
        success: false,
        message: '试样申请不存在'
      });
    }
    
    const sample = samples[0];
    
    // 验证权限
    if (sample.user_id !== userId && sample.factory_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权查看此试样申请'
      });
    }
    
    // 获取试样产品
    const [products] = await db.query(
      'SELECT * FROM sample_products WHERE sample_id = ?',
      [id]
    );
    sample.products = products;
    
    res.json({
      success: true,
      data: sample
    });
  } catch (error) {
    console.error('获取试样详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取试样详情失败'
    });
  }
};

// 更新试样
exports.updateSample = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    const { id } = req.params;
    const userId = req.user.userId;
    const { companyName, contactName, contactPhone, recipientName, deliveryAddress, remark, products } = req.body;
    
    // 验证权限和状态
    const [samples] = await conn.query(
      'SELECT * FROM samples WHERE id = ? AND user_id = ? AND delivery_status = "pending"',
      [id, userId]
    );
    
    if (samples.length === 0) {
      return res.status(403).json({
        success: false,
        message: '试样申请不存在或已配送，无法修改'
      });
    }
    
    // 更新试样主记录
    await conn.query(
      `UPDATE samples SET 
       company_name = ?, contact_name = ?, contact_phone = ?,
       recipient_name = ?, delivery_address = ?, remark = ?, updated_at = NOW()
       WHERE id = ?`,
      [companyName, contactName, contactPhone, recipientName, deliveryAddress, remark || '', id]
    );
    
    // 删除旧产品
    await conn.query('DELETE FROM sample_products WHERE sample_id = ?', [id]);
    
    // 插入新产品
    for (const product of products) {
      await conn.query(
        `INSERT INTO sample_products 
        (id, sample_id, product_name, brand_model, factory_price, quantity, unit, purpose, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [uuidv4(), id, product.productName, product.brandModel,
         product.factoryPrice, product.quantity, product.unit, product.purpose || '']
      );
    }
    
    await conn.commit();
    
    res.json({
      success: true,
      message: '试样申请更新成功'
    });
  } catch (error) {
    await conn.rollback();
    console.error('更新试样申请错误:', error);
    res.status(500).json({
      success: false,
      message: '试样申请更新失败'
    });
  } finally {
    conn.release();
  }
};

// 更新配送状态
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { deliveryStatus, trackingNumber } = req.body;
    
    // 验证是否是工厂用户
    const [samples] = await db.query(
      `SELECT s.*, q.user_id as factory_user_id
       FROM samples s
       LEFT JOIN quotes q ON s.quote_id = q.id
       WHERE s.id = ?`,
      [id]
    );
    
    if (samples.length === 0) {
      return res.status(404).json({
        success: false,
        message: '试样申请不存在'
      });
    }
    
    if (samples[0].factory_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '只有工厂可以更新配送状态'
      });
    }
    
    await db.query(
      'UPDATE samples SET delivery_status = ?, tracking_number = ?, updated_at = NOW() WHERE id = ?',
      [deliveryStatus, trackingNumber || '', id]
    );
    
    res.json({
      success: true,
      message: '配送状态更新成功'
    });
  } catch (error) {
    console.error('更新配送状态错误:', error);
    res.status(500).json({
      success: false,
      message: '更新配送状态失败'
    });
  }
};

// 删除试样
exports.deleteSample = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    const { id } = req.params;
    const userId = req.user.userId;
    
    // 验证权限
    const [samples] = await conn.query(
      'SELECT * FROM samples WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (samples.length === 0) {
      return res.status(403).json({
        success: false,
        message: '无权删除此试样申请'
      });
    }
    
    // 删除试样产品
    await conn.query('DELETE FROM sample_products WHERE sample_id = ?', [id]);
    
    // 删除试样
    await conn.query('DELETE FROM samples WHERE id = ?', [id]);
    
    await conn.commit();
    
    res.json({
      success: true,
      message: '试样申请删除成功'
    });
  } catch (error) {
    await conn.rollback();
    console.error('删除试样申请错误:', error);
    res.status(500).json({
      success: false,
      message: '试样申请删除失败'
    });
  } finally {
    conn.release();
  }
};

