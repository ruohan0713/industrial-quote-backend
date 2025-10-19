// controllers/userController.js - 用户控制器
const db = require('../config/database');

// 获取用户信息
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [users] = await db.query(
      'SELECT id, openid, nick_name, avatar_url, is_certified, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: users[0].id,
        nickName: users[0].nick_name,
        avatarUrl: users[0].avatar_url,
        isCertified: users[0].is_certified === 1,
        createdAt: users[0].created_at
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
};

// 更新用户信息
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { nickName, avatarUrl } = req.body;
    
    const updates = [];
    const params = [];
    
    if (nickName) {
      updates.push('nick_name = ?');
      params.push(nickName);
    }
    
    if (avatarUrl) {
      updates.push('avatar_url = ?');
      params.push(avatarUrl);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的信息'
      });
    }
    
    params.push(userId);
    
    await db.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );
    
    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '更新失败'
    });
  }
};

// 更新头像
exports.updateAvatar = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { avatarUrl } = req.body;
    
    if (!avatarUrl) {
      return res.status(400).json({
        success: false,
        message: '缺少头像URL'
      });
    }
    
    await db.query(
      'UPDATE users SET avatar_url = ?, updated_at = NOW() WHERE id = ?',
      [avatarUrl, userId]
    );
    
    res.json({
      success: true,
      message: '头像更新成功'
    });
  } catch (error) {
    console.error('更新头像错误:', error);
    res.status(500).json({
      success: false,
      message: '更新头像失败'
    });
  }
};

// 获取用户统计
exports.getStatistics = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // 我的报价单数量
    const [myQuotes] = await db.query(
      'SELECT COUNT(*) as count FROM quotes WHERE creator_id = ?',
      [userId]
    );
    
    // 我的订单数量
    const [myOrders] = await db.query(
      'SELECT COUNT(*) as count FROM orders WHERE user_id = ?',
      [userId]
    );
    
    // 我的试样数量
    const [mySamples] = await db.query(
      'SELECT COUNT(*) as count FROM samples WHERE user_id = ?',
      [userId]
    );
    
    // 收到的订单数量（我发布的报价单收到的订单）
    const [receivedOrders] = await db.query(
      'SELECT COUNT(*) as count FROM orders o INNER JOIN quotes q ON o.quote_id = q.id WHERE q.creator_id = ?',
      [userId]
    );
    
    // 收到的试样数量
    const [receivedSamples] = await db.query(
      'SELECT COUNT(*) as count FROM samples s INNER JOIN quotes q ON s.quote_id = q.id WHERE q.creator_id = ?',
      [userId]
    );
    
    res.json({
      success: true,
      data: {
        myQuotes: myQuotes[0].count,
        myOrders: myOrders[0].count,
        mySamples: mySamples[0].count,
        receivedOrders: receivedOrders[0].count,
        receivedSamples: receivedSamples[0].count
      }
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    });
  }
};

