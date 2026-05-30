/**
 * 全局配置项，从环境变量读取，未设置时使用默认值
 */
export const config = {
  // 服务器监听端口
  port: Number(process.env.PORT) || 3000,
  // 服务器监听地址，0.0.0.0 表示接受所有网络接口的连接
  host: process.env.HOST || "0.0.0.0",

  // Claude AI 模型相关配置
  claude: {
    apiKey: process.env.ANTHROPIC_API_KEY || "",
    model: "claude-sonnet-4-6-20250514",  // 使用的模型版本
    maxTokens: 2048,                       // 单次回复最大 token 数
  },

  // SQLite 数据库文件路径
  db: {
    path: process.env.DB_PATH || "./data/knowledge.db",
  },

  // 跨域配置，"*" 表示允许所有来源
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
  },
};
