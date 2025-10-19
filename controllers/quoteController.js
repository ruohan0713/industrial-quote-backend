// controllers/quoteController.js - 报价单控制器
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// 创建报价单
exports.createQuote = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    const userId = req.user.userId;
    const { factoryName, contactName, contactPhone, contactEmail, businessScope, customNotice, products } = req.body;
    
    // 验证必填字段
    if (!factoryName || !contactName || !contactPhone || !businessScope || !products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请填写完整的报价信息'
      });
    }
    
    const quoteId = uuidv4();
    
    // 插入报价单主记录
    await conn.query(
      `INSERT INTO quotes 
      (id, user_id, factory_name, contact_name, contact_phone, contact_email, 
       business_scope, custom_notice, status, view_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved', 0, NOW(), NOW())`,
      [quoteId, userId, factoryName, contactName, contactPhone, contactEmail || '', businessScope, customNotice || '']
    );
    
    // 插入产品列表
    for (const product of products) {
      await conn.query(
        `INSERT INTO quote_products 
        (id, quote_id, product_name, brand_model, factory_price, delivery_price, min_order, unit, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [uuidv4(), quoteId, product.productName, product.brandModel, 
         product.factoryPrice, product.deliveryPrice, product.minOrder, product.unit]
      );
    }
    
    await conn.commit();
    
    res.json({
      success: true,
      message: '报价单发布成功',
      data: { quoteId }
    });
  } catch (error) {
    await conn.rollback();
    console.error('创建报价单错误:', error);
    res.status(500).json({
      success: false,
      message: '报价单发布失败',
      error: error.message
    });
  } finally {
    conn.release();
  }
};

// 获取报价单列表
exports.getQuotes = async (req, res) => {
  try {
    const { page = 1, limit = 10, keyword = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT q.*, u.nick_name as creator_name, u.avatar_url as creator_avatar
      FROM quotes q
      LEFT JOIN users u ON q.user_id = u.id
      WHERE q.status = 'approved'
    `;
    
    if (keyword) {
      query += ` AND (q.factory_name LIKE ? OR q.business_scope LIKE ?)`;
    }
    
    query += ` ORDER BY q.created_at DESC LIMIT ? OFFSET ?`;
    
    const params = keyword 
      ? [`%${keyword}%`, `%${keyword}%`, parseInt(limit), parseInt(offset)]
      : [parseInt(limit), parseInt(offset)];
    
    const [quotes] = await db.query(query, params);
    
    // 获取每个报价单的产品
    for (let quote of quotes) {
      const [products] = await db.query(
        'SELECT * FROM quote_products WHERE quote_id = ?',
        [quote.id]
      );
      quote.products = products;
    }
    
    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM quotes WHERE status = "approved"';
    if (keyword) {
      countQuery += ` AND (factory_name LIKE ? OR business_scope LIKE ?)`;
    }
    const [countResult] = await db.query(
      countQuery,
      keyword ? [`%${keyword}%`, `%${keyword}%`] : []
    );
    
    res.json({
      success: true,
      data: {
        quotes,
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取报价单列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取报价单列表失败'
    });
  }
};

// 搜索报价单
exports.searchQuotes = async (req, res) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '请输入搜索关键词'
      });
    }
    
    const [quotes] = await db.query(
      `SELECT q.*, u.nick_name as creator_name 
       FROM quotes q
       LEFT JOIN users u ON q.user_id = u.id
       WHERE q.status = 'approved' 
       AND (q.factory_name LIKE ? OR q.business_scope LIKE ?)
       ORDER BY q.created_at DESC
       LIMIT 50`,
      [`%${keyword}%`, `%${keyword}%`]
    );
    
    // 获取产品
    for (let quote of quotes) {
      const [products] = await db.query(
        'SELECT * FROM quote_products WHERE quote_id = ?',
        [quote.id]
      );
      quote.products = products;
    }
    
    res.json({
      success: true,
      data: quotes
    });
  } catch (error) {
    console.error('搜索报价单错误:', error);
    res.status(500).json({
      success: false,
      message: '搜索失败'
    });
  }
};

// 获取单个报价单详情
exports.getQuoteById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [quotes] = await db.query(
      `SELECT q.*, u.nick_name as creator_name, u.avatar_url as creator_avatar
       FROM quotes q
       LEFT JOIN users u ON q.user_id = u.id
       WHERE q.id = ?`,
      [id]
    );
    
    if (quotes.length === 0) {
      return res.status(404).json({
        success: false,
        message: '报价单不存在'
      });
    }
    
    const quote = quotes[0];
    
    // 获取产品列表
    const [products] = await db.query(
      'SELECT * FROM quote_products WHERE quote_id = ?',
      [id]
    );
    quote.products = products;
    
    res.json({
      success: true,
      data: quote
    });
  } catch (error) {
    console.error('获取报价单详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取报价单详情失败'
    });
  }
};

// 更新报价单
exports.updateQuote = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    const { id } = req.params;
    const userId = req.user.userId;
    const { factoryName, contactName, contactPhone, contactEmail, businessScope, customNotice, products } = req.body;
    
    // 验证权限
    const [quotes] = await conn.query('SELECT * FROM quotes WHERE id = ? AND user_id = ?', [id, userId]);
    if (quotes.length === 0) {
      return res.status(403).json({
        success: false,
        message: '无权修改此报价单'
      });
    }
    
    // 更新报价单主记录
    await conn.query(
      `UPDATE quotes SET 
       factory_name = ?, contact_name = ?, contact_phone = ?, contact_email = ?,
       business_scope = ?, custom_notice = ?, updated_at = NOW()
       WHERE id = ?`,
      [factoryName, contactName, contactPhone, contactEmail || '', businessScope, customNotice || '', id]
    );
    
    // 删除旧产品
    await conn.query('DELETE FROM quote_products WHERE quote_id = ?', [id]);
    
    // 插入新产品
    for (const product of products) {
      await conn.query(
        `INSERT INTO quote_products 
        (id, quote_id, product_name, brand_model, factory_price, delivery_price, min_order, unit, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [uuidv4(), id, product.productName, product.brandModel,
         product.factoryPrice, product.deliveryPrice, product.minOrder, product.unit]
      );
    }
    
    await conn.commit();
    
    res.json({
      success: true,
      message: '报价单更新成功'
    });
  } catch (error) {
    await conn.rollback();
    console.error('更新报价单错误:', error);
    res.status(500).json({
      success: false,
      message: '报价单更新失败'
    });
  } finally {
    conn.release();
  }
};

// 删除报价单
exports.deleteQuote = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    const { id } = req.params;
    const userId = req.user.userId;
    
    // 验证权限
    const [quotes] = await conn.query('SELECT * FROM quotes WHERE id = ? AND user_id = ?', [id, userId]);
    if (quotes.length === 0) {
      return res.status(403).json({
        success: false,
        message: '无权删除此报价单'
      });
    }
    
    // 删除产品
    await conn.query('DELETE FROM quote_products WHERE quote_id = ?', [id]);
    
    // 删除报价单
    await conn.query('DELETE FROM quotes WHERE id = ?', [id]);
    
    await conn.commit();
    
    res.json({
      success: true,
      message: '报价单删除成功'
    });
  } catch (error) {
    await conn.rollback();
    console.error('删除报价单错误:', error);
    res.status(500).json({
      success: false,
      message: '报价单删除失败'
    });
  } finally {
    conn.release();
  }
};

// 获取我的报价单
exports.getMyQuotes = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const [quotes] = await db.query(
      `SELECT * FROM quotes 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    );
    
    // 获取产品
    for (let quote of quotes) {
      const [products] = await db.query(
        'SELECT * FROM quote_products WHERE quote_id = ?',
        [quote.id]
      );
      quote.products = products;
    }
    
    // 获取总数
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM quotes WHERE user_id = ?',
      [userId]
    );
    
    res.json({
      success: true,
      data: {
        quotes,
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取我的报价单错误:', error);
    res.status(500).json({
      success: false,
      message: '获取我的报价单失败'
    });
  }
};

// 增加浏览量
exports.increaseViewCount = async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query(
      'UPDATE quotes SET view_count = view_count + 1 WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: '浏览量已更新'
    });
  } catch (error) {
    console.error('增加浏览量错误:', error);
    res.status(500).json({
      success: false,
      message: '更新浏览量失败'
    });
  }
};

