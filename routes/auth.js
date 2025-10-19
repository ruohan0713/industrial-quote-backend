// routes/auth.js - 认证路由
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 微信登录
router.post('/wechat-login', authController.wechatLogin);

// 刷新token
router.post('/refresh-token', authController.refreshToken);

// 登出
router.post('/logout', authController.logout);

module.exports = router;

