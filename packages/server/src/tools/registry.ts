/**
 * Tool 注册中心
 * 管理所有可供 Claude 调用的工具，支持动态注册、启用/禁用和执行
 * 新增工具只需实现 ToolDefinition 接口并调用 registerTool() 即可
 */
import Anthropic from "@anthropic-ai/sdk";

/** 工具定义接口 */
export interface ToolDefinition {
  name: string;                                              // 工具名称（Claude 通过此名称调用）
  description: string;                                       // 工具描述（帮助 Claude 判断何时使用）
  input_schema: Anthropic.Tool["input_schema"];              // JSON Schema 格式的参数定义
  handler: (input: Record<string, unknown>) => Promise<string>;  // 实际执行逻辑
  enabled: boolean;                                          // 是否启用（可用于灰度上线）
}

// 工具注册表，以工具名为 key
const tools = new Map<string, ToolDefinition>();

/** 注册一个新工具到注册表 */
export function registerTool(tool: ToolDefinition): void {
  tools.set(tool.name, tool);
}

/** 获取所有已启用工具的 Claude API 格式定义（传给 messages.create 的 tools 参数） */
export function getEnabledTools(): Anthropic.Tool[] {
  return Array.from(tools.values())
    .filter((t) => t.enabled)
    .map(({ name, description, input_schema }) => ({
      name,
      description,
      input_schema,
    }));
}

/** 执行指定工具并返回结果字符串（供 tool_result 回传给 Claude） */
export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  const tool = tools.get(name);
  if (!tool) return `错误：未找到工具 "${name}"`;
  if (!tool.enabled) return `错误：工具 "${name}" 当前未启用`;
  try {
    return await tool.handler(input);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `工具执行出错：${msg}`;
  }
}
