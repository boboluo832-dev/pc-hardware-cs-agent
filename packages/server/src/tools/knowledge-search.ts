/**
 * 知识库搜索工具
 * 通过关键词匹配搜索 FAQ、故障排查指南、售后政策等文档
 * 支持按分类（category）和产品线（product_line）过滤
 */
import { getDb } from "./compatibility-check.js";

/**
 * 搜索知识库
 * 将用户查询拆分为关键词，在标题和内容中进行模糊匹配
 * 返回最多 5 条最相关的结果
 */
export async function searchKnowledgeBase(
  input: Record<string, unknown>
): Promise<string> {
  const { query, category, product_line } = input as {
    query: string;
    category?: string;
    product_line?: string;
  };

  const db = getDb();

  // 动态构建 SQL 查询，根据传入的过滤条件拼接 WHERE 子句
  let sql = "SELECT title, content, category, product_line FROM knowledge_base WHERE 1=1";
  const params: unknown[] = [];

  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }
  if (product_line) {
    sql += " AND product_line = ?";
    params.push(product_line);
  }

  // 将查询文本按空格拆分为多个关键词，每个关键词都做模糊匹配
  sql += " AND (title LIKE ? OR content LIKE ?)";
  const keywords = query.split(/\s+/).map((k) => `%${k}%`);
  for (const kw of keywords) {
    params.push(kw, kw);
    if (keywords.indexOf(kw) < keywords.length - 1) {
      sql += " OR title LIKE ? OR content LIKE ?";
    }
  }

  sql += " LIMIT 5";

  const results = db.prepare(sql).all(...params) as Array<{
    title: string;
    content: string;
    category: string;
    product_line: string;
  }>;

  if (results.length === 0) {
    return JSON.stringify({
      found: false,
      message: "未找到相关知识库内容。建议转接人工客服获取更详细的帮助。",
    });
  }

  return JSON.stringify({
    found: true,
    results: results.map((r) => ({
      title: r.title,
      content: r.content,
      category: r.category,
    })),
  });
}
