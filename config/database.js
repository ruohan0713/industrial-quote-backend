// config/database.js - 数据库配置
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'quote_platform',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// 测试数据库连接
pool.getConnection()
  .then(connection => {
    console.log('✓ 数据库连接成功');
    connection.release();
  })
  .catch(err => {
    console.error('✗ 数据库连接失败:', err.message);
  });

module.exports = pool;
