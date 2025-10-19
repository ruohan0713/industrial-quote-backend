// controllers/orderController.js - 订单控制器
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// 创建订单
exports.createOrder = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    const userId = req.user.userId;
    const { quoteId, companyName, contactName, contactPhone, recipientName, deliveryAddress, remark, products } = req.body;
    
    if (!quoteId || !companyName || !contactName || !contactPhone || !recipientName || !deliveryAddress || !products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请填写完整的订单信息'
      });
    }
    
    const orderId = uuidv4();
    
    // 插入订单主记录
    await conn.query(
      `INSERT INTO orders 
      (id, quote_id, user_id, company_name, contact_name, contact_phone, 
       recipient_name, delivery_address, remark, delivery_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [orderId, quoteId, userId, companyName, contactName, contactPhone, recipientName, deliveryAddress, remark || '']
    );
    
    // 插入订单产品
    for (const product of products) {
      await conn.query(
        `INSERT INTO order_products 
        (id, order_id, product_name, brand_model, factory_price, delivery_price, quantity, unit, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [uuidv4(), orderId, product.productName, product.brandModel,
         product.factoryPrice, product.deliveryPrice, product.quantity, product.unit]
      );
    }
    
    await conn.commit();
    
    res.json({
      success: true,
      message: '订单创建成功',
      data: { orderId }
    });
  } catch (error) {
    await conn.rollback();
    console.error('创建订单错误:', error);
    res.status(500).json({
      success: false,
      message: '订单创建失败',
      error: error.message
    });
  } finally {
    conn.release();
  }
};

// 获取我的订单
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [orders] = await db.query(
      `SELECT o.*, q.factory_name 
       FROM orders o
       LEFT JOIN quotes q ON o.quote_id = q.id
       WHERE o.user_id = ? 
       ORDER BY o.created_at DESC`,
      [userId]
    );
    
    // 获取订单产品
    for (let order of orders) {
      const [products] = await db.query(
        'SELECT * FROM order_products WHERE order_id = ?',
        [order.id]
      );
      order.products = products;
    }
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('获取我的订单错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单失败'
    });
  }
};

// 获取收到的订单（工厂）
exports.getReceivedOrders = async (req, res) => {
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
    
    const [orders] = await db.query(
      `SELECT o.*, u.nick_name as buyer_name 
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.quote_id IN (?)
       ORDER BY o.created_at DESC`,
      [quoteIds]
    );
    
    // 获取订单产品
    for (let order of orders) {
      const [products] = await db.query(
        'SELECT * FROM order_products WHERE order_id = ?',
        [order.id]
      );
      order.products = products;
    }
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('获取收到的订单错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单失败'
    });
  }
};

// 获取订单详情
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const [orders] = await db.query(
      `SELECT o.*, q.factory_name, q.user_id as factory_user_id
       FROM orders o
       LEFT JOIN quotes q ON o.quote_id = q.id
       WHERE o.id = ?`,
      [id]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    const order = orders[0];
    
    // 验证权限（买方或卖方）
    if (order.user_id !== userId && order.factory_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权查看此订单'
      });
    }
    
    // 获取订单产品
    const [products] = await db.query(
      'SELECT * FROM order_products WHERE order_id = ?',
      [id]
    );
    order.products = products;
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单详情失败'
    });
  }
};

// 更新订单
exports.updateOrder = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    const { id } = req.params;
    const userId = req.user.userId;
    const { companyName, contactName, contactPhone, recipientName, deliveryAddress, remark, products } = req.body;
    
    // 验证权限和状态
    const [orders] = await conn.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ? AND delivery_status = "pending"',
      [id, userId]
    );
    
    if (orders.length === 0) {
      return res.status(403).json({
        success: false,
        message: '订单不存在或已配送，无法修改'
      });
    }
    
    // 更新订单主记录
    await conn.query(
      `UPDATE orders SET 
       company_name = ?, contact_name = ?, contact_phone = ?,
       recipient_name = ?, delivery_address = ?, remark = ?, updated_at = NOW()
       WHERE id = ?`,
      [companyName, contactName, contactPhone, recipientName, deliveryAddress, remark || '', id]
    );
    
    // 删除旧产品
    await conn.query('DELETE FROM order_products WHERE order_id = ?', [id]);
    
    // 插入新产品
    for (const product of products) {
      await conn.query(
        `INSERT INTO order_products 
        (id, order_id, product_name, brand_model, factory_price, delivery_price, quantity, unit, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [uuidv4(), id, product.productName, product.brandModel,
         product.factoryPrice, product.deliveryPrice, product.quantity, product.unit]
      );
    }
    
    await conn.commit();
    
    res.json({
      success: true,
      message: '订单更新成功'
    });
  } catch (error) {
    await conn.rollback();
    console.error('更新订单错误:', error);
    res.status(500).json({
      success: false,
      message: '订单更新失败'
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
    const [orders] = await db.query(
      `SELECT o.*, q.user_id as factory_user_id
       FROM orders o
       LEFT JOIN quotes q ON o.quote_id = q.id
       WHERE o.id = ?`,
      [id]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    if (orders[0].factory_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '只有工厂可以更新配送状态'
      });
    }
    
    await db.query(
      'UPDATE orders SET delivery_status = ?, tracking_number = ?, updated_at = NOW() WHERE id = ?',
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

// 删除订单
exports.deleteOrder = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    const { id } = req.params;
    const userId = req.user.userId;
    
    // 验证权限
    const [orders] = await conn.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (orders.length === 0) {
      return res.status(403).json({
        success: false,
        message: '无权删除此订单'
      });
    }
    
    // 删除订单产品
    await conn.query('DELETE FROM order_products WHERE order_id = ?', [id]);
    
    // 删除订单
    await conn.query('DELETE FROM orders WHERE id = ?', [id]);
    
    await conn.commit();
    
    res.json({
      success: true,
      message: '订单删除成功'
    });
  } catch (error) {
    await conn.rollback();
    console.error('删除订单错误:', error);
    res.status(500).json({
      success: false,
      message: '订单删除失败'
    });
  } finally {
    conn.release();
  }
};

