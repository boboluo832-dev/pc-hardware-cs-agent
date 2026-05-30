/**
 * 服务器入口文件
 * 负责初始化所有模块并启动 HTTP/WebSocket 服务
 */
import "dotenv/config";  // 加载 .env 环境变量
import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { config } from "./config/index.js";
import { registerAllTools } from "./tools/index.js";
import { initDatabase } from "./knowledge/init-db.js";
import { registerRoutes } from "./api/routes.js";
import { registerAdminRoutes } from "./api/admin.js";

async function main() {
  const app = Fastify({ logger: true });

  // 注册中间件插件
  await app.register(cors, { origin: config.cors.origin });
  await app.register(websocket);

  // 初始化数据库表结构（如果不存在则创建）
  initDatabase();
  // 注册所有 AI Tool（兼容性检查、知识库搜索、产品查询）
  registerAllTools();
  // 注册 HTTP 和 WebSocket 路由
  registerRoutes(app);
  // 注册管理后台路由（仅内部使用，客户不可见）
  registerAdminRoutes(app);

  await app.listen({ port: config.port, host: config.host });
  console.log(`Server running at http://${config.host}:${config.port}`);
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
