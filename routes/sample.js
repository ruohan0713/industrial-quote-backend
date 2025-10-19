// routes/sample.js - 试样路由
const express = require('express');
const router = express.Router();
const sampleController = require('../controllers/sampleController');
const { authenticate } = require('../middleware/auth');

// 创建试样申请
router.post('/', authenticate, sampleController.createSample);

// 获取我的试样申请
router.get('/my/list', authenticate, sampleController.getMySamples);

// 获取收到的试样申请（工厂）
router.get('/received/list', authenticate, sampleController.getReceivedSamples);

// 获取试样详情
router.get('/:id', authenticate, sampleController.getSampleById);

// 更新试样
router.put('/:id', authenticate, sampleController.updateSample);

// 更新配送状态
router.put('/:id/delivery', authenticate, sampleController.updateDeliveryStatus);

// 删除试样
router.delete('/:id', authenticate, sampleController.deleteSample);

module.exports = router;

