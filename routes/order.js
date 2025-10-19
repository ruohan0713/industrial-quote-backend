// routes/order.js - 订单路由
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

// 创建订单
router.post('/', authenticate, orderController.createOrder);

// 获取我的订单
router.get('/my/list', authenticate, orderController.getMyOrders);

// 获取收到的订单（工厂）
router.get('/received/list', authenticate, orderController.getReceivedOrders);

// 获取订单详情
router.get('/:id', authenticate, orderController.getOrderById);

// 更新订单
router.put('/:id', authenticate, orderController.updateOrder);

// 更新配送状态
router.put('/:id/delivery', authenticate, orderController.updateDeliveryStatus);

// 删除订单
router.delete('/:id', authenticate, orderController.deleteOrder);

module.exports = router;

