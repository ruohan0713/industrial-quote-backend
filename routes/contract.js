// routes/contract.js - 合同路由
const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { authenticate } = require('../middleware/auth');

// 生成采购合同
router.post('/purchase', authenticate, contractController.generatePurchaseContract);

// 生成试样协议
router.post('/sample', authenticate, contractController.generateSampleContract);

// 获取合同详情
router.get('/:id', authenticate, contractController.getContractById);

// 获取我的合同列表
router.get('/my/list', authenticate, contractController.getMyContracts);

module.exports = router;

