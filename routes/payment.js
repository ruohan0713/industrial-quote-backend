// routes/payment.js - 支付路由
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

// 统一下单（生成预支付订单）
router.post('/prepay', authenticate, paymentController.prepay);

// 支付回调通知（微信服务器调用）
router.post('/notify', paymentController.notify);

// 确认支付（前端主动查询）
router.post('/confirm', authenticate, paymentController.confirm);

// 查询订单状态
router.get('/query', authenticate, paymentController.query);

module.exports = router;

