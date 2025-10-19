// middleware/auth.js - 认证中间件
const jwt = require('jsonwebtoken');

// 验证JWT Token
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '认证令牌无效或已过期'
    });
  }
};

// 验证企业认证状态
const requireCertification = (req, res, next) => {
  if (!req.user.isCertified) {
    return res.status(403).json({
      success: false,
      message: '需要完成企业认证才能执行此操作'
    });
  }
  next();
};

module.exports = {
  authenticate,
  requireCertification
};

