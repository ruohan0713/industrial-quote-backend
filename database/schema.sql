-- 工贸报价小程序数据库结构

-- 创建数据库
CREATE DATABASE IF NOT EXISTS quote_platform DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE quote_platform;

-- ==================== 用户表 ====================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
  openid VARCHAR(100) UNIQUE NOT NULL COMMENT '微信openid',
  nick_name VARCHAR(100) DEFAULT '微信用户' COMMENT '昵称',
  avatar_url VARCHAR(500) DEFAULT '' COMMENT '头像URL',
  is_certified TINYINT(1) DEFAULT 0 COMMENT '是否已认证：0-未认证，1-已认证',
  created_at DATETIME NOT NULL COMMENT '创建时间',
  last_login_at DATETIME DEFAULT NULL COMMENT '最后登录时间',
  INDEX idx_openid (openid),
  INDEX idx_certified (is_certified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ==================== 认证表 ====================
CREATE TABLE IF NOT EXISTS certifications (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '认证ID',
  user_id INT NOT NULL COMMENT '用户ID',
  type ENUM('personal', 'company') NOT NULL COMMENT '认证类型：personal-个人，company-企业',
  status ENUM('none', 'pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '认证状态',
  
  -- 个人认证字段
  real_name VARCHAR(50) DEFAULT NULL COMMENT '真实姓名',
  id_card_no VARCHAR(20) DEFAULT NULL COMMENT '身份证号',
  id_card_front VARCHAR(500) DEFAULT NULL COMMENT '身份证正面',
  id_card_back VARCHAR(500) DEFAULT NULL COMMENT '身份证反面',
  
  -- 企业认证字段
  company_name VARCHAR(200) DEFAULT NULL COMMENT '企业名称',
  legal_person VARCHAR(50) DEFAULT NULL COMMENT '法人姓名',
  registered_address VARCHAR(500) DEFAULT NULL COMMENT '注册地址',
  business_license VARCHAR(500) DEFAULT NULL COMMENT '营业执照',
  legal_id_front VARCHAR(500) DEFAULT NULL COMMENT '法人身份证正面',
  legal_id_back VARCHAR(500) DEFAULT NULL COMMENT '法人身份证反面',
  
  reject_reason TEXT DEFAULT NULL COMMENT '拒绝原因',
  created_at DATETIME NOT NULL COMMENT '创建时间',
  updated_at DATETIME NOT NULL COMMENT '更新时间',
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='认证表';

-- ==================== 报价单表 ====================
CREATE TABLE IF NOT EXISTS quotes (
  id VARCHAR(36) PRIMARY KEY COMMENT '报价单ID（UUID）',
  user_id INT NOT NULL COMMENT '创建用户ID',
  factory_name VARCHAR(200) NOT NULL COMMENT '工厂名称',
  contact_name VARCHAR(50) NOT NULL COMMENT '联系人',
  contact_phone VARCHAR(20) NOT NULL COMMENT '联系电话',
  contact_email VARCHAR(100) DEFAULT '' COMMENT '联系邮箱',
  business_scope TEXT NOT NULL COMMENT '经营范围',
  custom_notice TEXT DEFAULT '' COMMENT '特别说明',
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved' COMMENT '状态',
  view_count INT DEFAULT 0 COMMENT '浏览量',
  created_at DATETIME NOT NULL COMMENT '创建时间',
  updated_at DATETIME NOT NULL COMMENT '更新时间',
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  FULLTEXT INDEX ft_factory_name (factory_name, business_scope)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='报价单表';

-- ==================== 报价产品表 ====================
CREATE TABLE IF NOT EXISTS quote_products (
  id VARCHAR(36) PRIMARY KEY COMMENT '产品ID（UUID）',
  quote_id VARCHAR(36) NOT NULL COMMENT '报价单ID',
  product_name VARCHAR(200) NOT NULL COMMENT '产品名称',
  brand_model VARCHAR(200) NOT NULL COMMENT '品牌型号',
  factory_price DECIMAL(10, 2) NOT NULL COMMENT '出厂价',
  delivery_price DECIMAL(10, 2) NOT NULL COMMENT '含配送价',
  min_order INT NOT NULL COMMENT '起订量',
  unit VARCHAR(20) NOT NULL COMMENT '单位',
  created_at DATETIME NOT NULL COMMENT '创建时间',
  
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  INDEX idx_quote_id (quote_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='报价产品表';

-- ==================== 订单表 ====================
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(36) PRIMARY KEY COMMENT '订单ID（UUID）',
  quote_id VARCHAR(36) NOT NULL COMMENT '报价单ID',
  user_id INT NOT NULL COMMENT '下单用户ID',
  company_name VARCHAR(200) NOT NULL COMMENT '公司名称',
  contact_name VARCHAR(50) NOT NULL COMMENT '联系人',
  contact_phone VARCHAR(20) NOT NULL COMMENT '联系电话',
  recipient_name VARCHAR(50) NOT NULL COMMENT '收货人',
  delivery_address VARCHAR(500) NOT NULL COMMENT '配送地址',
  remark TEXT DEFAULT '' COMMENT '备注',
  delivery_status ENUM('pending', 'shipped', 'completed') DEFAULT 'pending' COMMENT '配送状态',
  tracking_number VARCHAR(100) DEFAULT '' COMMENT '物流单号',
  created_at DATETIME NOT NULL COMMENT '创建时间',
  updated_at DATETIME NOT NULL COMMENT '更新时间',
  
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_quote_id (quote_id),
  INDEX idx_user_id (user_id),
  INDEX idx_delivery_status (delivery_status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- ==================== 订单产品表 ====================
CREATE TABLE IF NOT EXISTS order_products (
  id VARCHAR(36) PRIMARY KEY COMMENT '订单产品ID（UUID）',
  order_id VARCHAR(36) NOT NULL COMMENT '订单ID',
  product_name VARCHAR(200) NOT NULL COMMENT '产品名称',
  brand_model VARCHAR(200) NOT NULL COMMENT '品牌型号',
  factory_price DECIMAL(10, 2) NOT NULL COMMENT '出厂价',
  delivery_price DECIMAL(10, 2) NOT NULL COMMENT '含配送价',
  quantity INT NOT NULL COMMENT '数量',
  unit VARCHAR(20) NOT NULL COMMENT '单位',
  created_at DATETIME NOT NULL COMMENT '创建时间',
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单产品表';

-- ==================== 试样表 ====================
CREATE TABLE IF NOT EXISTS samples (
  id VARCHAR(36) PRIMARY KEY COMMENT '试样ID（UUID）',
  quote_id VARCHAR(36) NOT NULL COMMENT '报价单ID',
  user_id INT NOT NULL COMMENT '申请用户ID',
  company_name VARCHAR(200) NOT NULL COMMENT '公司名称',
  contact_name VARCHAR(50) NOT NULL COMMENT '联系人',
  contact_phone VARCHAR(20) NOT NULL COMMENT '联系电话',
  recipient_name VARCHAR(50) NOT NULL COMMENT '收货人',
  delivery_address VARCHAR(500) NOT NULL COMMENT '配送地址',
  remark TEXT DEFAULT '' COMMENT '备注',
  delivery_status ENUM('pending', 'shipped', 'completed') DEFAULT 'pending' COMMENT '配送状态',
  tracking_number VARCHAR(100) DEFAULT '' COMMENT '物流单号',
  created_at DATETIME NOT NULL COMMENT '创建时间',
  updated_at DATETIME NOT NULL COMMENT '更新时间',
  
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_quote_id (quote_id),
  INDEX idx_user_id (user_id),
  INDEX idx_delivery_status (delivery_status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='试样表';

-- ==================== 试样产品表 ====================
CREATE TABLE IF NOT EXISTS sample_products (
  id VARCHAR(36) PRIMARY KEY COMMENT '试样产品ID（UUID）',
  sample_id VARCHAR(36) NOT NULL COMMENT '试样ID',
  product_name VARCHAR(200) NOT NULL COMMENT '产品名称',
  brand_model VARCHAR(200) NOT NULL COMMENT '品牌型号',
  factory_price DECIMAL(10, 2) NOT NULL COMMENT '参考价格',
  quantity INT NOT NULL COMMENT '试样数量',
  unit VARCHAR(20) NOT NULL COMMENT '单位',
  purpose TEXT DEFAULT '' COMMENT '试样用途',
  created_at DATETIME NOT NULL COMMENT '创建时间',
  
  FOREIGN KEY (sample_id) REFERENCES samples(id) ON DELETE CASCADE,
  INDEX idx_sample_id (sample_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='试样产品表';

-- ==================== 合同表 ====================
CREATE TABLE IF NOT EXISTS contracts (
  id VARCHAR(36) PRIMARY KEY COMMENT '合同ID（UUID）',
  type ENUM('purchase', 'sample') NOT NULL COMMENT '合同类型',
  user_id INT NOT NULL COMMENT '用户ID',
  order_id VARCHAR(36) DEFAULT NULL COMMENT '订单ID',
  sample_id VARCHAR(36) DEFAULT NULL COMMENT '试样ID',
  created_at DATETIME NOT NULL COMMENT '创建时间',
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (sample_id) REFERENCES samples(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_order_id (order_id),
  INDEX idx_sample_id (sample_id),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='合同表';

-- ==================== 浏览记录表 ====================
CREATE TABLE IF NOT EXISTS view_records (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
  user_id INT NOT NULL COMMENT '用户ID',
  quote_id VARCHAR(36) NOT NULL COMMENT '报价单ID',
  created_at DATETIME NOT NULL COMMENT '浏览时间',
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_quote_id (quote_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='浏览记录表';

