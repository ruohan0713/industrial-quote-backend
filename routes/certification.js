// routes/certification.js - 认证路由
const express = require('express');
const router = express.Router();
const certificationController = require('../controllers/certificationController');
const { authenticate } = require('../middleware/auth');

// 提交企业认证
router.post('/company', authenticate, certificationController.submitCompanyCertification);

// 获取认证状态
router.get('/status', authenticate, certificationController.getCertificationStatus);

// OCR识别身份证
router.post('/ocr/idcard', authenticate, certificationController.ocrIdCard);

// OCR识别营业执照
router.post('/ocr/business-license', authenticate, certificationController.ocrBusinessLicense);

// 查询企业信息
router.post('/verify/company', authenticate, certificationController.verifyCompanyInfo);

module.exports = router;

