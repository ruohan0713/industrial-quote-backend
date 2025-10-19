// config/supabase.js - Supabase配置
const { createClient } = require('@supabase/supabase-js');

// 从环境变量获取Supabase配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️  警告: 缺少 Supabase 配置环境变量');
  console.error('请在 .env 文件中设置:');
  console.error('  SUPABASE_URL=your-project-url');
  console.error('  SUPABASE_ANON_KEY=your-anon-key');
  console.error('  SUPABASE_SERVICE_KEY=your-service-key (可选)');
}

// 创建Supabase客户端（用于一般操作）
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  }
});

// 创建Supabase管理员客户端（用于管理操作）
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase;

// 测试连接
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table not found
      throw error;
    }
    
    console.log('✓ Supabase 连接成功');
    return true;
  } catch (err) {
    console.error('✗ Supabase 连接失败:', err.message);
    return false;
  }
}

// 初始化时测试连接
testConnection();

module.exports = {
  supabase,
  supabaseAdmin,
  testConnection
};


