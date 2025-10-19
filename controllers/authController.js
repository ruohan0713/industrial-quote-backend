// controllers/authController.js - 认证控制器
const axios = require('axios');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

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
    
    // 查询或创建用户
    let [users] = await db.query('SELECT * FROM users WHERE openid = ?', [openid]);
    let user;
    
    if (users.length === 0) {
      // 创建新用户
      const [result] = await db.query(
        'INSERT INTO users (openid, nick_name, avatar_url, created_at) VALUES (?, ?, ?, NOW())',
        [openid, userInfo?.nickName || '微信用户', userInfo?.avatarUrl || '']
      );
      
      user = {
        id: result.insertId,
        openid,
        nick_name: userInfo?.nickName || '微信用户',
        avatar_url: userInfo?.avatarUrl || '',
        is_certified: 0
      };
    } else {
      user = users[0];
      
      // 更新用户信息
      if (userInfo) {
        await db.query(
          'UPDATE users SET nick_name = ?, avatar_url = ?, last_login_at = NOW() WHERE id = ?',
          [userInfo.nickName, userInfo.avatarUrl, user.id]
        );
      }
    }
    
    // 生成JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        openid: user.openid,
        isCertified: user.is_certified === 1
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
          isCertified: user.is_certified === 1
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

