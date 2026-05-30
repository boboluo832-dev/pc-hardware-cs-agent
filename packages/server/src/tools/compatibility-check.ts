/**
 * 兼容性检查工具
 * 根据产品规格数据判断两个硬件之间是否兼容
 * 支持：机箱↔主板/显卡/散热器/电源、散热器↔CPU插槽、电源↔接口
 */
import Database from "better-sqlite3";
import { config } from "../config/index.js";

// 数据库单例（懒加载）
let db: Database.Database | null = null;

/** 获取数据库连接（单例模式，避免重复打开） */
export function getDb(): Database.Database {
  if (!db) {
    db = new Database(config.db.path);
    db.pragma("journal_mode = WAL");
  }
  return db;
}

/**
 * 兼容性检查主函数
 * 根据 check_type 选择对应的检查逻辑，返回兼容/不兼容结论及原因
 */
export async function checkCompatibility(
  input: Record<string, unknown>
): Promise<string> {
  const { product_sku, target_spec, check_type } = input as {
    product_sku: string;
    target_spec: string;
    check_type: string;
  };

  const database = getDb();

  // 通过 SKU 精确匹配或名称模糊匹配查找产品
  const product = database
    .prepare("SELECT * FROM products WHERE sku = ? OR name LIKE ?")
    .get(product_sku, `%${product_sku}%`) as Record<string, unknown> | undefined;

  if (!product) {
    return JSON.stringify({
      found: false,
      message: `未找到产品 "${product_sku}"，请确认型号是否正确。`,
    });
  }

  // 解析产品规格 JSON
  const specs = JSON.parse((product.specs as string) || "{}");

  // 各类兼容性检查逻辑映射表
  const checks: Record<string, () => { compatible: boolean; reason: string; suggestions?: string[] }> = {
    // 机箱 ↔ 主板规格（ATX/M-ATX/ITX）
    case_motherboard: () => {
      const supported: string[] = specs.supported_motherboards || [];
      const compatible = supported.some(
        (s: string) => s.toLowerCase() === target_spec.toLowerCase()
      );
      return {
        compatible,
        reason: compatible
          ? `${product.name} 支持 ${target_spec} 主板规格。`
          : `${product.name} 不支持 ${target_spec} 主板。支持的规格：${supported.join("、")}。`,
        suggestions: compatible ? undefined : [`请选择支持 ${target_spec} 的机箱型号。`],
      };
    },
    // 机箱 ↔ 显卡长度（mm）
    case_gpu: () => {
      const maxLen = specs.max_gpu_length || 0;
      const gpuLen = parseInt(target_spec);
      const compatible = !isNaN(gpuLen) && maxLen >= gpuLen;
      return {
        compatible,
        reason: compatible
          ? `${product.name} 最大支持 ${maxLen}mm 显卡，您的显卡 ${gpuLen}mm 可以安装。`
          : `${product.name} 最大支持 ${maxLen}mm 显卡，您的显卡 ${target_spec} 可能无法安装。`,
      };
    },
    // 机箱 ↔ 散热器高度（mm）
    case_cooler: () => {
      const maxHeight = specs.max_cooler_height || 0;
      const coolerHeight = parseInt(target_spec);
      const compatible = !isNaN(coolerHeight) && maxHeight >= coolerHeight;
      return {
        compatible,
        reason: compatible
          ? `${product.name} 最大支持 ${maxHeight}mm 高度散热器，您的散热器 ${coolerHeight}mm 可以安装。`
          : `${product.name} 最大支持 ${maxHeight}mm 散热器高度，${target_spec} 超出限制。`,
      };
    },
    // 机箱 ↔ 电源规格（ATX/SFX）
    case_psu: () => {
      const supported: string[] = specs.supported_psu_types || [];
      const compatible = supported.some(
        (s: string) => s.toLowerCase() === target_spec.toLowerCase()
      );
      return {
        compatible,
        reason: compatible
          ? `${product.name} 支持 ${target_spec} 规格电源。`
          : `${product.name} 不支持 ${target_spec} 电源。支持：${supported.join("、")}。`,
      };
    },
    // 散热器 ↔ CPU 插槽（LGA1700/AM5 等）
    cooler_socket: () => {
      const supported: string[] = specs.supported_sockets || [];
      const compatible = supported.some(
        (s: string) => s.toLowerCase() === target_spec.toLowerCase()
      );
      return {
        compatible,
        reason: compatible
          ? `${product.name} 支持 ${target_spec} 插槽。`
          : `${product.name} 不支持 ${target_spec}。支持的插槽：${supported.join("、")}。`,
      };
    },
    // 电源 ↔ 接口类型（12VHPWR/PCIe 等）
    psu_connector: () => {
      const connectors: string[] = specs.connectors || [];
      const compatible = connectors.some(
        (c: string) => c.toLowerCase().includes(target_spec.toLowerCase())
      );
      return {
        compatible,
        reason: compatible
          ? `${product.name} 提供 ${target_spec} 接口。`
          : `${product.name} 不包含 ${target_spec} 接口。可用接口：${connectors.join("、")}。`,
      };
    },
  };

  const checker = checks[check_type];
  if (!checker) {
    return JSON.stringify({ error: `不支持的检查类型：${check_type}` });
  }

  return JSON.stringify(checker());
}
