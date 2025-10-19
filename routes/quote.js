// routes/quote.js - 报价单路由
const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');
const { authenticate, requireCertification } = require('../middleware/auth');

// 创建报价单
router.post('/', authenticate, requireCertification, quoteController.createQuote);

// 获取报价单列表
router.get('/', quoteController.getQuotes);

// 搜索报价单
router.get('/search', quoteController.searchQuotes);

// 获取单个报价单详情
router.get('/:id', quoteController.getQuoteById);

// 更新报价单
router.put('/:id', authenticate, requireCertification, quoteController.updateQuote);

// 删除报价单
router.delete('/:id', authenticate, quoteController.deleteQuote);

// 获取我的报价单
router.get('/my/list', authenticate, quoteController.getMyQuotes);

// 增加浏览量
router.post('/:id/view', quoteController.increaseViewCount);

module.exports = router;

