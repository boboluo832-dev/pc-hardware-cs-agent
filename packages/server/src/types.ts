/**
 * 单条聊天消息
 */
export interface Message {
  id: string;                              // 消息唯一标识
  role: "user" | "assistant" | "system";   // 消息角色：用户 / AI助手 / 系统
  content: string;                         // 消息文本内容
  timestamp: number;                       // 发送时间戳（毫秒）
}

/**
 * 用户会话，包含完整对话历史和上下文状态
 */
export interface Session {
  id: string;                   // 会话唯一标识
  createdAt: number;            // 创建时间
  lastActiveAt: number;         // 最后活跃时间（用于过期清理）
  messages: Message[];          // 对话消息列表
  context: SessionContext;      // 当前会话收集到的上下文信息
}

/**
 * 会话上下文 —— 在对话过程中逐步收集的用户信息（槽位）
 * Agent 会将这些信息注入 system prompt，帮助模型更精准地回答
 */
export interface SessionContext {
  productModel?: string;                    // 用户咨询的产品型号
  purchaseDate?: string;                    // 购买日期（用于判断保修期）
  issueCategory?: string;                   // 问题分类（兼容性/故障/售后等）
  collectedSlots: Record<string, string>;   // 其他已收集的信息键值对
}
