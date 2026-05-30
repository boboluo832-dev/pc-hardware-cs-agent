/**
 * 会话存储模块
 * 使用内存 Map 管理所有活跃会话，支持创建、查询、更新和过期清理
 */
import type { Session, SessionContext } from "../types.js";
import { nanoid } from "nanoid";

// 内存中的会话存储（生产环境可替换为 Redis）
const sessions = new Map<string, Session>();

/** 创建新会话并存入内存 */
export function createSession(): Session {
  const session: Session = {
    id: nanoid(),
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    messages: [],
    context: { collectedSlots: {} },
  };
  sessions.set(session.id, session);
  return session;
}

/** 根据 ID 获取已有会话 */
export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}

/** 更新会话上下文（如用户提供了产品型号、购买日期等信息） */
export function updateSessionContext(
  id: string,
  updates: Partial<SessionContext>
): void {
  const session = sessions.get(id);
  if (session) {
    session.context = { ...session.context, ...updates };
    session.lastActiveAt = Date.now();
  }
}

/** 清理超时未活跃的会话，默认 30 分钟过期 */
export function cleanExpiredSessions(maxAgeMs = 30 * 60 * 1000): void {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.lastActiveAt > maxAgeMs) {
      sessions.delete(id);
    }
  }
}
