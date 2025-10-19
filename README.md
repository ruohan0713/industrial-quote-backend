# 工贸报价小程序 - 后端服务

[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-blue.svg)](https://expressjs.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-brightgreen.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

工贸报价小程序的后端API服务，提供报价管理、订单处理、试样申请、合同生成等功能。

---

## 📑 目录

- [快速开始](#快速开始)
- [环境要求](#环境要求)
- [本地开发](#本地开发)
- [Docker部署](#docker部署)
- [API文档](#api文档)
- [项目结构](#项目结构)
- [数据库](#数据库)
- [常见问题](#常见问题)

---

## 🚀 快速开始

### 方式1: Docker部署（推荐）

```bash
# 1. 克隆代码
git clone https://github.com/your-repo/quote-platform.git
cd quote-platform/backend

# 2. 配置环境变量
cp env.example.txt .env
nano .env  # 填写配置

# 3. 启动服务
./deploy.sh start

# 4. 验证服务
curl http://localhost:3000/health
```

### 方式2: 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp env.example.txt .env
nano .env  # 填写配置

# 3. 启动开发服务器
npm run dev

# 4. 访问服务
# API地址: http://localhost:3000/api
# 健康检查: http://localhost:3000/health
```

---

## 💻 环境要求

### 最低要求

- **Node.js**: 16.x 或更高版本
- **npm**: 8.x 或更高版本
- **内存**: 512MB+
- **磁盘**: 1GB+

### 推荐配置

- **Node.js**: 18.x LTS
- **npm**: 9.x
- **内存**: 2GB+
- **磁盘**: 10GB+

### 外部服务

- **Supabase**: PostgreSQL数据库（免费套餐即可）
- **微信小程序**: AppID和AppSecret

---

## 🛠 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
NODE_ENV=development
PORT=3000

# Supabase配置
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# JWT密钥
JWT_SECRET=your-jwt-secret

# 微信小程序配置
WECHAT_APPID=your-appid
WECHAT_SECRET=your-secret
```

### 3. 初始化数据库

```bash
# 在Supabase Dashboard中执行
# 文件: database/supabase-schema.sql
```

### 4. 启动开发服务器

```bash
npm run dev
```

### 5. 测试API

```bash
# 健康检查
curl http://localhost:3000/health

# 获取报价列表
curl http://localhost:3000/api/quote
```

---

## 🐳 Docker部署

### 前提条件

- 已安装Docker和Docker Compose
- 已创建Supabase项目
- 已配置环境变量

### 快速部署

```bash
# 1. 构建并启动
./deploy.sh start

# 2. 查看状态
./deploy.sh status

# 3. 查看日志
./deploy.sh logs

# 4. 停止服务
./deploy.sh stop
```

### 部署脚本命令

```bash
./deploy.sh start   # 启动服务
./deploy.sh stop    # 停止服务
./deploy.sh restart # 重启服务
./deploy.sh logs    # 查看日志
./deploy.sh status  # 查看状态
./deploy.sh update  # 更新服务
./deploy.sh backup  # 备份数据
```

### Docker Compose配置

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
```

---

## 📚 API文档

### 基础信息

- **Base URL**: `http://localhost:3000/api`
- **认证方式**: JWT Token (Bearer)
- **Content-Type**: `application/json`

### 认证接口

#### POST /api/auth/login
微信登录

**请求体**:
```json
{
  "code": "微信登录code",
  "userInfo": {
    "nickName": "用户昵称",
    "avatarUrl": "头像URL"
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "token": "JWT Token",
    "userInfo": {
      "id": 1,
      "nickName": "用户昵称",
      "avatarUrl": "头像URL",
      "isCertified": false
    }
  }
}
```

### 报价接口

#### GET /api/quote
获取报价列表

**查询参数**:
- `page`: 页码（默认1）
- `limit`: 每页数量（默认10）
- `keyword`: 搜索关键词

**响应**:
```json
{
  "success": true,
  "data": {
    "quotes": [...],
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

#### POST /api/quote
创建报价单（需要认证）

**请求头**:
```
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "factoryName": "工厂名称",
  "contactName": "联系人",
  "contactPhone": "联系电话",
  "businessScope": "经营范围",
  "products": [
    {
      "productName": "产品名称",
      "brandModel": "品牌型号",
      "factoryPrice": 10.5,
      "deliveryPrice": 12.0,
      "unit": "件"
    }
  ]
}
```

### 订单接口

#### POST /api/order
创建订单（需要认证）

#### GET /api/order/my
获取我的订单（需要认证）

#### GET /api/order/received
获取我收到的订单（需要认证）

### 试样接口

#### POST /api/sample
申请试样（需要认证）

#### GET /api/sample/my
获取我的试样记录（需要认证）

#### GET /api/sample/received
获取我收到的试样申请（需要认证）

### 合同接口

#### GET /api/contract/preview
预览合同

**查询参数**:
- `type`: 合同类型（order/sample）
- `dataId`: 数据ID

---

## 📁 项目结构

```
backend/
├── config/                 # 配置文件
│   ├── database.js        # MySQL配置
│   └── supabase.js        # Supabase配置
├── controllers/           # 控制器
│   ├── authController.js
│   ├── quoteController.js
│   ├── orderController.js
│   ├── sampleController.js
│   └── ...
├── routes/                # 路由
│   ├── auth.js
│   ├── quote.js
│   ├── order.js
│   └── ...
├── middleware/            # 中间件
│   └── auth.js           # 认证中间件
├── database/              # 数据库
│   ├── schema.sql        # MySQL schema
│   └── supabase-schema.sql  # Supabase schema
├── uploads/               # 上传文件目录
├── logs/                  # 日志目录
├── nginx/                 # Nginx配置
│   └── nginx.conf
├── .env                   # 环境变量（需创建）
├── .dockerignore          # Docker忽略文件
├── Dockerfile             # Docker镜像配置
├── docker-compose.yml     # Docker Compose配置
├── deploy.sh              # 部署脚本
├── package.json           # 依赖配置
├── server.js              # 主服务器文件
└── README.md              # 本文件
```

---

## 🗄 数据库

### Supabase（推荐）

#### 优点
- ✅ 免费套餐（500MB数据库 + 1GB文件存储）
- ✅ 自动备份
- ✅ 全球CDN
- ✅ Row Level Security
- ✅ 无需自己维护

#### 使用方法

1. **创建项目**
   - 访问 https://supabase.com
   - 创建新项目
   - 记录URL和API密钥

2. **执行SQL**
   - 进入SQL Editor
   - 复制 `database/supabase-schema.sql`
   - 执行创建所有表

3. **配置环境变量**
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   ```

### MySQL

#### 优点
- ✅ 完全控制
- ✅ 可以本地部署
- ✅ 更灵活的配置

#### 使用方法

1. **安装MySQL**
   ```bash
   # Ubuntu
   sudo apt-get install mysql-server
   
   # macOS
   brew install mysql
   ```

2. **创建数据库**
   ```sql
   CREATE DATABASE quote_platform;
   ```

3. **执行SQL**
   ```bash
   mysql -u root -p quote_platform < database/schema.sql
   ```

4. **配置环境变量**
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your-password
   DB_NAME=quote_platform
   ```

---

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| NODE_ENV | 环境模式 | 否 | development |
| PORT | 服务端口 | 否 | 3000 |
| SUPABASE_URL | Supabase项目URL | 是 | - |
| SUPABASE_ANON_KEY | Supabase匿名密钥 | 是 | - |
| SUPABASE_SERVICE_KEY | Supabase服务密钥 | 否 | - |
| JWT_SECRET | JWT签名密钥 | 是 | - |
| JWT_EXPIRES_IN | Token过期时间 | 否 | 7d |
| WECHAT_APPID | 微信小程序AppID | 是 | - |
| WECHAT_SECRET | 微信小程序Secret | 是 | - |
| UPLOAD_MAX_SIZE | 最大上传大小 | 否 | 10485760 |

### 生成JWT密钥

```bash
# 方法1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 方法2: OpenSSL
openssl rand -hex 32

# 方法3: 在线生成
# https://randomkeygen.com/
```

---

## 🧪 测试

### 运行测试

```bash
npm test
```

### API测试

使用Postman或curl测试API：

```bash
# 健康检查
curl http://localhost:3000/health

# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"code":"test-code"}'

# 获取报价列表
curl http://localhost:3000/api/quote
```

---

## 📊 监控

### 日志查看

```bash
# Docker日志
docker-compose logs -f backend

# 本地日志
tail -f logs/app.log
```

### 性能监控

```bash
# 查看容器资源
docker stats

# 查看进程
pm2 status  # 如果使用PM2
```

---

## 🔐 安全

### 生产环境清单

- [ ] 使用强密码（JWT_SECRET、数据库密码）
- [ ] 启用HTTPS（SSL证书）
- [ ] 配置防火墙
- [ ] 定期备份数据
- [ ] 更新依赖包
- [ ] 配置环境变量（不提交到Git）
- [ ] 启用API限流
- [ ] 配置CORS白名单

### 安全建议

```javascript
// server.js中配置CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

// 配置限流
const rateLimit = require('express-rate-limit');
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 最多100个请求
}));
```

---

## 🚀 部署

### 完整部署文档

请查看 [完整部署指南-Docker版.md](./完整部署指南-Docker版.md)

### 快速部署清单

1. [ ] 服务器准备（2GB+ 内存）
2. [ ] 安装Docker和Docker Compose
3. [ ] 创建Supabase项目
4. [ ] 执行数据库SQL
5. [ ] 配置.env文件
6. [ ] 启动服务：`./deploy.sh start`
7. [ ] 配置Nginx反向代理
8. [ ] 配置SSL证书
9. [ ] 配置域名解析
10. [ ] 测试API接口

---

## ❓ 常见问题

### Q: Docker容器无法启动？

**A**: 检查端口是否被占用

```bash
# 查看端口占用
sudo netstat -tlnp | grep 3000

# 修改端口
# 编辑docker-compose.yml，改为 "3001:3000"
```

### Q: 无法连接到Supabase？

**A**: 检查网络和配置

```bash
# 测试连接
curl https://your-project.supabase.co

# 检查环境变量
cat .env | grep SUPABASE
```

### Q: 微信登录失败？

**A**: 检查AppID和Secret

```bash
# 验证配置
echo $WECHAT_APPID
echo $WECHAT_SECRET

# 测试微信API
curl "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=$WECHAT_APPID&secret=$WECHAT_SECRET"
```

### Q: 文件上传失败？

**A**: 检查目录权限

```bash
# 检查权限
ls -la uploads/

# 修改权限
chmod 755 uploads/
chown -R node:node uploads/
```

---

## 📝 更新日志

### v1.0.0 (2025-10-19)

- ✅ 初始版本发布
- ✅ Docker部署支持
- ✅ Supabase集成
- ✅ 完整的API接口
- ✅ 认证和授权
- ✅ 报价、订单、试样管理
- ✅ 合同生成功能

---

## 📄 许可证

MIT License

---

## 🤝 贡献

欢迎提交Issue和Pull Request！

---

## 📧 联系方式

- GitHub: https://github.com/your-repo
- Email: your-email@example.com

---

**项目状态**: ✅ 生产就绪  
**最后更新**: 2025-10-19  
**版本**: v1.0.0

