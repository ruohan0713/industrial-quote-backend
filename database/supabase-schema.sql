-- Supabase 数据库表结构
-- 在 Supabase SQL Editor 中执行此脚本

-- ==================== 1. 用户表 ====================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  openid VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  nickname VARCHAR(100),
  avatar_url TEXT,
  points INTEGER DEFAULT 0,
  is_certified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户表索引
CREATE INDEX idx_users_openid ON users(openid);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ==================== 2. 企业认证表 ====================
CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(200) NOT NULL,
  business_license VARCHAR(50) NOT NULL,
  legal_person VARCHAR(50) NOT NULL,
  contact_person VARCHAR(50) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  company_address TEXT NOT NULL,
  license_image_url TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'approved',
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 认证表索引
CREATE INDEX idx_certifications_user_id ON certifications(user_id);
CREATE INDEX idx_certifications_status ON certifications(status);

-- ==================== 3. 工厂信息表 ====================
CREATE TABLE IF NOT EXISTS factories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  factory_name VARCHAR(200) NOT NULL,
  factory_address TEXT,
  description TEXT,
  main_products TEXT,
  production_capacity TEXT,
  certifications TEXT,
  contact_person VARCHAR(50),
  contact_phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 工厂表索引
CREATE INDEX idx_factories_user_id ON factories(user_id);

-- ==================== 4. 报价单表 ====================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  factory_name VARCHAR(200) NOT NULL,
  product_category VARCHAR(100) NOT NULL,
  keywords TEXT,
  address TEXT NOT NULL,
  validity INTEGER DEFAULT 30,
  delivery_method VARCHAR(20) DEFAULT 'fixed',
  products JSONB NOT NULL,
  points_rule JSONB,
  points_earn_rule JSONB,
  status VARCHAR(20) DEFAULT 'active',
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expired_at TIMESTAMP WITH TIME ZONE
);

-- 报价单表索引
CREATE INDEX idx_quotes_creator_id ON quotes(creator_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX idx_quotes_expired_at ON quotes(expired_at);
CREATE INDEX idx_quotes_product_category ON quotes(product_category);

-- ==================== 5. 订单表 ====================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(200) NOT NULL,
  contact_name VARCHAR(50) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  delivery_address TEXT NOT NULL,
  products JSONB NOT NULL,
  total_amount DECIMAL(12,2),
  points_used INTEGER DEFAULT 0,
  points_discount DECIMAL(10,2) DEFAULT 0,
  remark TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 订单表索引
CREATE INDEX idx_orders_quote_id ON orders(quote_id);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- ==================== 6. 试样申请表 ====================
CREATE TABLE IF NOT EXISTS samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(200) NOT NULL,
  contact_name VARCHAR(50) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  recipient_name VARCHAR(50) NOT NULL,
  delivery_address TEXT NOT NULL,
  products JSONB NOT NULL,
  points_used INTEGER DEFAULT 0,
  remark TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 试样表索引
CREATE INDEX idx_samples_quote_id ON samples(quote_id);
CREATE INDEX idx_samples_requester_id ON samples(requester_id);
CREATE INDEX idx_samples_provider_id ON samples(provider_id);
CREATE INDEX idx_samples_status ON samples(status);
CREATE INDEX idx_samples_created_at ON samples(created_at DESC);

-- ==================== 7. 积分记录表 ====================
CREATE TABLE IF NOT EXISTS points_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  points INTEGER NOT NULL,
  description TEXT,
  related_id UUID,
  related_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 积分记录表索引
CREATE INDEX idx_points_records_user_id ON points_records(user_id);
CREATE INDEX idx_points_records_created_at ON points_records(created_at DESC);

-- ==================== 8. 通知表 ====================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  related_id UUID,
  related_type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 通知表索引
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ==================== 9. 合同表 ====================
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  data_id UUID NOT NULL,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contract_number VARCHAR(50) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 合同表索引
CREATE INDEX idx_contracts_type ON contracts(type);
CREATE INDEX idx_contracts_quote_id ON contracts(quote_id);
CREATE INDEX idx_contracts_buyer_id ON contracts(buyer_id);
CREATE INDEX idx_contracts_seller_id ON contracts(seller_id);
CREATE INDEX idx_contracts_created_at ON contracts(created_at DESC);

-- ==================== 10. 解锁记录表 ====================
CREATE TABLE IF NOT EXISTS unlock_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  unlock_type VARCHAR(20) NOT NULL,
  unlock_method VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 解锁记录表索引
CREATE INDEX idx_unlock_records_user_id ON unlock_records(user_id);
CREATE INDEX idx_unlock_records_quote_id ON unlock_records(quote_id);
CREATE INDEX idx_unlock_records_created_at ON unlock_records(created_at DESC);

-- ==================== 11. 支付订单表 ====================
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  description VARCHAR(200),
  payment_type VARCHAR(50),
  related_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  prepay_id VARCHAR(100),
  transaction_id VARCHAR(100),
  attach TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- 支付订单表索引
CREATE INDEX idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX idx_payment_orders_order_no ON payment_orders(order_no);
CREATE INDEX idx_payment_orders_status ON payment_orders(status);
CREATE INDEX idx_payment_orders_created_at ON payment_orders(created_at DESC);

-- ==================== 触发器：自动更新 updated_at ====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有需要的表添加触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certifications_updated_at BEFORE UPDATE ON certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_factories_updated_at BEFORE UPDATE ON factories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_samples_updated_at BEFORE UPDATE ON samples FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== RLS (Row Level Security) 策略 ====================
-- 启用RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE factories ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlock_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- 用户表策略：用户只能查看和更新自己的数据
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);

-- 报价单策略：所有人可以查看，只有创建者可以修改和删除
CREATE POLICY "Anyone can view active quotes" ON quotes FOR SELECT USING (status = 'active');
CREATE POLICY "Users can manage their own quotes" ON quotes FOR ALL USING (auth.uid() = creator_id);

-- 订单策略：买家和卖家都可以查看
CREATE POLICY "Users can view their orders" ON orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Buyers can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- 试样策略：申请者和提供者都可以查看
CREATE POLICY "Users can view their samples" ON samples FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = provider_id);
CREATE POLICY "Users can create sample requests" ON samples FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- 积分记录策略：用户只能查看自己的积分记录
CREATE POLICY "Users can view their points records" ON points_records FOR SELECT USING (auth.uid() = user_id);

-- 通知策略：用户只能查看自己的通知
CREATE POLICY "Users can view their notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- 支付订单策略：用户只能查看自己的支付订单
CREATE POLICY "Users can view their payment orders" ON payment_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create payment orders" ON payment_orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==================== 初始化测试数据（可选）====================
-- 取消注释以插入测试数据

-- INSERT INTO users (id, openid, nickname, points, is_certified) VALUES
-- ('00000000-0000-0000-0000-000000000001', 'test_openid_1', '测试工厂A', 100, true),
-- ('00000000-0000-0000-0000-000000000002', 'test_openid_2', '测试采购商B', 50, true);


