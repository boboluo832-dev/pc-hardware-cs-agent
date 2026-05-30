/**
 * 数据库初始化模块
 * 创建 SQLite 数据库文件和表结构（幂等操作，重复执行不会报错）
 */
import Database from "better-sqlite3";
import { config } from "../config/index.js";
import { mkdirSync, existsSync } from "fs";
import { dirname } from "path";

export function initDatabase(): void {
  // 确保数据库目录存在
  const dbDir = dirname(config.db.path);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(config.db.path);
  // WAL 模式提升并发读写性能
  db.pragma("journal_mode = WAL");

  db.exec(`
    -- 产品表：存储所有产品的 SKU、名称、分类和详细规格（JSON）
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('case', 'psu', 'cooler', 'smart_screen')),
      specs TEXT NOT NULL DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 知识库表：存储 FAQ、故障排查、售后政策等文档内容
    CREATE TABLE IF NOT EXISTS knowledge_base (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('troubleshooting', 'faq', 'policy', 'installation', 'smart_screen')),
      product_line TEXT NOT NULL CHECK(product_line IN ('case', 'psu', 'cooler', 'smart_screen', 'general')),
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 索引：加速按分类和 SKU 的查询
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_kb_category ON knowledge_base(category);
    CREATE INDEX IF NOT EXISTS idx_kb_product_line ON knowledge_base(product_line);
  `);

  db.close();
}
