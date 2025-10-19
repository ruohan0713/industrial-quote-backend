// controllers/certificationController.js - 认证控制器
const db = require('../config/database');
const axios = require('axios');

// 提交企业认证
exports.submitCompanyCertification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { companyName, legalPerson, registeredAddress, businessLicense, legalIdFront, legalIdBack } = req.body;
    
    // 验证必填字段
    if (!companyName || !legalPerson || !registeredAddress || !businessLicense || !legalIdFront || !legalIdBack) {
      return res.status(400).json({
        success: false,
        message: '请填写完整的企业认证信息'
      });
    }
    
    // 检查是否已经认证或待审核
    const [existing] = await db.query(
      'SELECT * FROM certifications WHERE user_id = ? AND status IN ("pending", "approved")',
      [userId]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: existing[0].status === 'approved' ? '您已完成认证' : '您的认证正在审核中'
      });
    }
    
    // 这里应该调用第三方API进行自动审核
    // 1. OCR识别营业执照信息
    // 2. 调用企业信息查询API验证企业真实性
    // 3. OCR识别法人身份证
    // 实际生产环境需要对接真实API
    
    // 模拟自动审核（实际应该调用真实API）
    const autoVerifyResult = await simulateAutoVerification({
      companyName,
      legalPerson,
      registeredAddress,
      businessLicense
    });
    
    const status = autoVerifyResult.success ? 'approved' : 'pending';
    
    // 插入认证记录
    const [result] = await db.query(
      `INSERT INTO certifications 
      (user_id, type, company_name, legal_person, registered_address, 
       business_license, legal_id_front, legal_id_back, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [userId, 'company', companyName, legalPerson, registeredAddress, 
       businessLicense, legalIdFront, legalIdBack, status]
    );
    
    // 如果自动审核通过，更新用户认证状态
    if (status === 'approved') {
      await db.query('UPDATE users SET is_certified = 1 WHERE id = ?', [userId]);
    }
    
    res.json({
      success: true,
      message: status === 'approved' ? '认证成功' : '认证申请已提交，正在审核中',
      data: {
        certificationId: result.insertId,
        status: status
      }
    });
  } catch (error) {
    console.error('企业认证错误:', error);
    res.status(500).json({
      success: false,
      message: '认证提交失败',
      error: error.message
    });
  }
};

// 获取认证状态
exports.getCertificationStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [certifications] = await db.query(
      'SELECT * FROM certifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    
    if (certifications.length === 0) {
      return res.json({
        success: true,
        data: {
          status: 'none',
          type: null,
          data: null
        }
      });
    }
    
    const cert = certifications[0];
    
    res.json({
      success: true,
      data: {
        status: cert.status,
        type: cert.type,
        data: {
          companyName: cert.company_name,
          legalPerson: cert.legal_person,
          registeredAddress: cert.registered_address
        },
        createdAt: cert.created_at,
        updatedAt: cert.updated_at
      }
    });
  } catch (error) {
    console.error('获取认证状态错误:', error);
    res.status(500).json({
      success: false,
      message: '获取认证状态失败'
    });
  }
};

// OCR识别身份证
exports.ocrIdCard = async (req, res) => {
  try {
    const { imageUrl, side } = req.body; // side: 'front' or 'back'
    
    // 这里应该调用阿里云、腾讯云等OCR服务
    // 实际生产环境需要对接真实API
    const ocrResult = await simulateIdCardOCR(imageUrl, side);
    
    res.json({
      success: true,
      data: ocrResult
    });
  } catch (error) {
    console.error('身份证OCR错误:', error);
    res.status(500).json({
      success: false,
      message: 'OCR识别失败'
    });
  }
};

// OCR识别营业执照
exports.ocrBusinessLicense = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    // 这里应该调用阿里云、腾讯云等OCR服务
    const ocrResult = await simulateBusinessLicenseOCR(imageUrl);
    
    res.json({
      success: true,
      data: ocrResult
    });
  } catch (error) {
    console.error('营业执照OCR错误:', error);
    res.status(500).json({
      success: false,
      message: 'OCR识别失败'
    });
  }
};

// 查询企业信息
exports.verifyCompanyInfo = async (req, res) => {
  try {
    const { companyName } = req.body;
    
    // 这里应该调用企查查、天眼查等企业信息查询API
    const companyInfo = await simulateCompanyVerification(companyName);
    
    res.json({
      success: true,
      data: companyInfo
    });
  } catch (error) {
    console.error('企业信息查询错误:', error);
    res.status(500).json({
      success: false,
      message: '企业信息查询失败'
    });
  }
};

// ========== 模拟函数（生产环境需要替换为真实API调用） ==========

async function simulateAutoVerification(data) {
  // 模拟自动审核逻辑
  // 实际应该：
  // 1. OCR识别营业执照，提取企业信息
  // 2. 调用企业信息查询API，验证企业真实性
  // 3. 对比提交的信息与查询到的信息是否一致
  // 4. OCR识别法人身份证，验证法人信息
  
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        success: true,
        message: '自动审核通过'
      });
    }, 1000);
  });
}

async function simulateIdCardOCR(imageUrl, side) {
  // 模拟身份证OCR识别
  // 实际应该调用阿里云、腾讯云等服务
  return {
    name: '张三',
    idNumber: '110101199001011234',
    address: '北京市朝阳区',
    issuedBy: side === 'back' ? '北京市公安局' : undefined,
    validPeriod: side === 'back' ? '2020.01.01-2030.01.01' : undefined
  };
}

async function simulateBusinessLicenseOCR(imageUrl) {
  // 模拟营业执照OCR识别
  return {
    companyName: '示例科技有限公司',
    legalPerson: '张三',
    registeredCapital: '100万元',
    registeredAddress: '北京市朝阳区示例路123号',
    businessScope: '技术开发、技术服务',
    creditCode: '91110000MA01234567'
  };
}

async function simulateCompanyVerification(companyName) {
  // 模拟企业信息查询
  return {
    companyName: companyName,
    legalPerson: '张三',
    registeredCapital: '100万元',
    establishDate: '2020-01-01',
    status: '存续',
    creditCode: '91110000MA01234567',
    address: '北京市朝阳区示例路123号'
  };
}

