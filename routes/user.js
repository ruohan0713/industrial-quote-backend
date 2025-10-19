// routes/user.js - 用户路由
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

// 获取用户信息
router.get('/profile', authenticate, userController.getProfile);

// 更新用户信息
router.put('/profile', authenticate, userController.updateProfile);

// 更新头像
router.put('/avatar', authenticate, userController.updateAvatar);

// 获取用户统计
router.get('/statistics', authenticate, userController.getStatistics);

module.exports = router;

