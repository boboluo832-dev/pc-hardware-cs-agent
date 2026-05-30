/**
 * Agent 编排器（Orchestrator）
 * 核心对话循环：接收用户消息 → 调用 Claude API → 处理 tool_use → 返回最终回复
 * 支持多轮 tool 调用（Claude 可能连续调用多个工具后再生成最终回复）
 */
import Anthropic from "@anthropic-ai/sdk";
import type { Message, Session } from "../types.js";
import { nanoid } from "nanoid";
import { config } from "../config/index.js";
import { getEnabledTools, executeTool } from "../tools/registry.js";
import { buildSystemPrompt } from "../prompts/system.js";

// 初始化 Claude API 客户端
const client = new Anthropic({ apiKey: config.claude.apiKey });

/** 流式回调接口，用于实时推送响应内容到前端 */
export interface StreamCallbacks {
  onText: (text: string) => void;       // 收到文本片段时触发
  onDone: (message: Message) => void;   // 完整回复生成完毕时触发
  onError: (error: Error) => void;      // 出错时触发
}

/**
 * 处理用户消息的主函数
 * 实现了 Claude tool_use 循环：模型可能多次调用工具，直到生成最终文本回复
 */
export async function handleUserMessage(
  session: Session,
  userText: string,
  callbacks: StreamCallbacks
): Promise<void> {
  // 将用户消息加入会话历史
  session.messages.push({
    id: nanoid(),
    role: "user",
    content: userText,
    timestamp: Date.now(),
  });
  session.lastActiveAt = Date.now();

  // 构建 system prompt（包含角色定义 + 当前会话上下文）
  const systemPrompt = buildSystemPrompt(session.context);
  // 获取所有已启用的工具定义
  const tools = getEnabledTools();

  // 将会话历史转换为 Claude API 所需的消息格式
  const apiMessages: Anthropic.MessageParam[] = session.messages.map((m: { role: string; content: string }) => ({
    role: (m.role === "system" ? "user" : m.role) as "user" | "assistant",
    content: m.content,
  }));

  let fullResponse = "";

  try {
    let continueLoop = true;

    // tool_use 循环：Claude 可能需要调用多个工具后才给出最终回复
    while (continueLoop) {
      const response = await client.messages.create({
        model: config.claude.model,
        max_tokens: config.claude.maxTokens,
        // cache_control: ephemeral 启用 prompt caching，降低重复调用成本
        system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
        tools,
        messages: apiMessages,
      });

      if (response.stop_reason === "tool_use") {
        // Claude 请求调用工具 —— 提取 tool_use 和 text 块
        const toolBlocks = response.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
        );
        const textBlocks = response.content.filter(
          (b): b is Anthropic.TextBlock => b.type === "text"
        );

        // 如果模型在调用工具前输出了文本，先推送给前端
        if (textBlocks.length > 0) {
          const text = textBlocks.map((b) => b.text).join("");
          fullResponse += text;
          callbacks.onText(text);
        }

        // 将 assistant 的完整响应（含 tool_use 块）加入消息历史
        apiMessages.push({ role: "assistant", content: response.content });

        // 逐个执行工具并收集结果
        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const block of toolBlocks) {
          const result = await executeTool(
            block.name,
            block.input as Record<string, unknown>
          );
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        }

        // 将工具执行结果作为 user 消息回传给 Claude（API 协议要求）
        apiMessages.push({ role: "user", content: toolResults });
      } else {
        // stop_reason 为 end_turn —— 模型生成了最终回复，退出循环
        const textBlocks = response.content.filter(
          (b): b is Anthropic.TextBlock => b.type === "text"
        );
        const text = textBlocks.map((b) => b.text).join("");
        fullResponse += text;
        callbacks.onText(text);
        continueLoop = false;
      }
    }

    // 将完整的 AI 回复存入会话历史
    const assistantMessage: Message = {
      id: nanoid(),
      role: "assistant",
      content: fullResponse,
      timestamp: Date.now(),
    };
    session.messages.push(assistantMessage);
    callbacks.onDone(assistantMessage);
  } catch (err) {
    callbacks.onError(
      err instanceof Error ? err : new Error(String(err))
    );
  }
}
