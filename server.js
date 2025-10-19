// server.js - 主服务器文件
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 导入路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const certificationRoutes = require('./routes/certification');
const quoteRoutes = require('./routes/quote');
const orderRoutes = require('./routes/order');
const sampleRoutes = require('./routes/sample');
const contractRoutes = require('./routes/contract');
const uploadRoutes = require('./routes/upload');
const paymentRoutes = require('./routes/payment');

// 注册路由
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/certification', certificationRoutes);
app.use('/api/quote', quoteRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/sample', sampleRoutes);
app.use('/api/contract', contractRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payment', paymentRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
     res.json({ 
       status: 'ok', 
       message: '服务运行正常',
       timestamp: new Date().toISOString(),
       environment: process.env.NODE_ENV || 'development'
     });
   });

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`工贸报价小程序后端服务已启动`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`端口: ${PORT}`);
  console.log(`时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`========================================`);
});

module.exports = app;


