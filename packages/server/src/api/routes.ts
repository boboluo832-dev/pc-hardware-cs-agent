/**
 * API 路由模块
 * 提供两种通信方式：
 * 1. POST /api/chat — HTTP 请求/响应模式（适合简单集成）
 * 2. WebSocket /ws — 实时流式输出（前端 Widget 使用）
 */
import type { FastifyInstance } from "fastify";
import { createSession, getSession } from "../session/store.js";
import { handleUserMessage } from "../agent/orchestrator.js";

/** 聊天请求体结构 */
interface ChatRequestBody {
  sessionId?: string;  // 可选，传入已有会话 ID 以继续对话
  message: string;     // 用户发送的消息内容
}

export function registerRoutes(app: FastifyInstance): void {
  // 健康检查接口
  app.get("/health", async () => ({ status: "ok" }));

  // HTTP 聊天接口 —— 等待 AI 完整回复后一次性返回
  app.post<{ Body: ChatRequestBody }>("/api/chat", async (request, reply) => {
    const { sessionId, message } = request.body;

    // 尝试恢复已有会话，不存在则创建新会话
    let session = sessionId ? getSession(sessionId) : undefined;
    if (!session) {
      session = createSession();
    }

    return new Promise((resolve) => {
      handleUserMessage(session!, message, {
        onText: () => {},
        onDone: (msg) => {
          resolve({ sessionId: session!.id, message: msg });
        },
        onError: (err) => {
          reply.status(500);
          resolve({ error: err.message });
        },
      });
    });
  });

  // WebSocket 聊天接口 —— 支持流式逐步推送 AI 回复
  app.register(async (fastify) => {
    fastify.get("/ws", { websocket: true }, (socket, _req) => {
      let session = createSession();

      socket.on("message", (raw: Buffer | string) => {
        try {
          const data = JSON.parse(raw.toString());

          if (data.type === "message" && data.content) {
            // 如果客户端传了 sessionId，尝试恢复已有会话
            if (data.sessionId) {
              const existing = getSession(data.sessionId);
              if (existing) session = existing;
            }

            handleUserMessage(session, data.content, {
              // 流式推送：每收到一段文本就发送给前端
              onText: (text) => {
                socket.send(
                  JSON.stringify({ type: "stream", content: text, sessionId: session.id })
                );
              },
              // 完整回复生成完毕
              onDone: (msg) => {
                socket.send(
                  JSON.stringify({ type: "done", message: msg, sessionId: session.id })
                );
              },
              // 错误处理
              onError: (err) => {
                socket.send(
                  JSON.stringify({ type: "error", message: err.message })
                );
              },
            });
          }
        } catch {
          socket.send(JSON.stringify({ type: "error", message: "无效的消息格式" }));
        }
      });
    });
  });
}
