/**
 * 产品查询工具
 * 根据 SKU 或产品名称查询详细参数
 * 支持指定返回字段（fields），不传则返回全部规格
 */
import { getDb } from "./compatibility-check.js";

/**
 * 查询产品信息
 * 先精确匹配 SKU，再模糊匹配名称
 */
export async function lookupProduct(
  input: Record<string, unknown>
): Promise<string> {
  const { sku, fields } = input as { sku: string; fields?: string[] };

  const db = getDb();

  // 优先精确匹配 SKU，其次模糊匹配产品名称
  const product = db
    .prepare("SELECT * FROM products WHERE sku = ? OR name LIKE ?")
    .get(sku, `%${sku}%`) as Record<string, unknown> | undefined;

  if (!product) {
    return JSON.stringify({
      found: false,
      message: `未找到产品 "${sku}"。请确认型号是否正确，或提供更完整的产品名称。`,
    });
  }

  const specs = JSON.parse((product.specs as string) || "{}");
  const result: Record<string, unknown> = {
    sku: product.sku,
    name: product.name,
    category: product.category,
  };

  // 如果指定了 fields，只返回请求的字段；否则返回全部规格
  if (fields && fields.length > 0) {
    result.specs = {};
    for (const field of fields) {
      if (field in specs) {
        (result.specs as Record<string, unknown>)[field] = specs[field];
      }
    }
  } else {
    result.specs = specs;
  }

  return JSON.stringify({ found: true, product: result });
}
