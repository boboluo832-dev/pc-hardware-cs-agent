/**
 * 工具注册入口
 * 在服务启动时调用 registerAllTools() 将所有工具注册到注册中心
 * 新增工具时：1. 创建工具文件  2. 在此处 import 并调用 registerTool()
 */
import { registerTool } from "./registry.js";
import { checkCompatibility } from "./compatibility-check.js";
import { searchKnowledgeBase } from "./knowledge-search.js";
import { lookupProduct } from "./product-lookup.js";

export function registerAllTools(): void {
  // 工具1：硬件兼容性检查
  registerTool({
    name: "check_compatibility",
    description:
      "检查两个 PC 硬件之间的兼容性。支持：机箱与主板/显卡/散热器/电源的尺寸兼容，散热器与 CPU 插槽兼容，电源接口兼容等。",
    input_schema: {
      type: "object" as const,
      properties: {
        product_sku: {
          type: "string",
          description: "本公司产品的 SKU 或型号",
        },
        target_spec: {
          type: "string",
          description:
            "要检查兼容性的目标规格，如主板规格(ATX/M-ATX)、显卡长度(mm)、CPU 插槽(LGA1700)等",
        },
        check_type: {
          type: "string",
          enum: [
            "case_motherboard",   // 机箱↔主板
            "case_gpu",           // 机箱↔显卡长度
            "case_cooler",        // 机箱↔散热器高度
            "case_psu",           // 机箱↔电源规格
            "cooler_socket",      // 散热器↔CPU插槽
            "psu_connector",      // 电源↔接口类型
          ],
          description: "兼容性检查类型",
        },
      },
      required: ["product_sku", "target_spec", "check_type"],
    },
    handler: checkCompatibility,
    enabled: true,
  });

  // 工具2：知识库搜索（FAQ/故障排查/售后政策）
  registerTool({
    name: "search_knowledge_base",
    description:
      "搜索知识库获取故障排查指南、FAQ、售后政策、安装教程等信息。用于回答用户关于产品使用问题、售后流程、常见故障的咨询。",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "搜索关键词或问题描述",
        },
        category: {
          type: "string",
          enum: [
            "troubleshooting",  // 故障排查
            "faq",              // 常见问题
            "policy",           // 售后政策
            "installation",     // 安装教程
            "smart_screen",     // 智能屏幕专区
          ],
          description: "知识库分类",
        },
        product_line: {
          type: "string",
          enum: ["case", "psu", "cooler", "smart_screen", "general"],
          description: "产品线",
        },
      },
      required: ["query"],
    },
    handler: searchKnowledgeBase,
    enabled: true,
  });

  // 工具3：产品参数查询
  registerTool({
    name: "lookup_product",
    description:
      "根据产品型号或 SKU 查询产品详细参数，包括尺寸、接口、支持规格、功率等信息。",
    input_schema: {
      type: "object" as const,
      properties: {
        sku: {
          type: "string",
          description: "产品 SKU 或型号名称",
        },
        fields: {
          type: "array",
          items: { type: "string" },
          description: "需要查询的字段列表，不传则返回全部参数",
        },
      },
      required: ["sku"],
    },
    handler: lookupProduct,
    enabled: true,
  });
}
