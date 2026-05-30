/**
 * useChat Hook — 聊天核心逻辑
 * 管理 WebSocket 连接、消息收发、流式响应拼接
 * 提供 messages（消息列表）、isTyping（AI正在输入）、sendMessage（发送消息）
 */
import { useState, useEffect, useRef, useCallback } from "preact/hooks";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function useChat(wsUrl: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  // 流式响应缓冲区，逐步拼接 AI 回复片段
  const streamBufferRef = useRef("");

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // 保存服务端分配的会话 ID，后续消息携带以保持会话连续
      if (data.sessionId) {
        sessionIdRef.current = data.sessionId;
      }

      // 流式片段：逐步更新最后一条 assistant 消息的内容
      if (data.type === "stream") {
        streamBufferRef.current += data.content;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "assistant" && last.id === "streaming") {
            return [
              ...prev.slice(0, -1),
              { ...last, content: streamBufferRef.current },
            ];
          }
          return [
            ...prev,
            { id: "streaming", role: "assistant", content: streamBufferRef.current },
          ];
        });
      }

      // 完成：用最终消息替换临时的 streaming 消息
      if (data.type === "done") {
        setIsTyping(false);
        streamBufferRef.current = "";
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== "streaming");
          return [...filtered, { id: data.message.id, role: "assistant", content: data.message.content }];
        });
      }

      // 错误处理：显示友好提示
      if (data.type === "error") {
        setIsTyping(false);
        streamBufferRef.current = "";
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== "streaming"),
          { id: `err-${Date.now()}`, role: "assistant", content: "抱歉，系统出现了问题，请稍后再试或联系人工客服。" },
        ]);
      }
    };

    // 断线自动重连（3秒后）
    ws.onclose = () => {
      setTimeout(() => {
        wsRef.current = new WebSocket(wsUrl);
      }, 3000);
    };

    return () => ws.close();
  }, [wsUrl]);

  /** 发送用户消息 */
  const sendMessage = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    // 立即将用户消息显示在界面上（乐观更新）
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // 通过 WebSocket 发送给服务端
    wsRef.current.send(
      JSON.stringify({
        type: "message",
        content: text,
        sessionId: sessionIdRef.current,
      })
    );
  }, []);

  return { messages, isTyping, sendMessage };
}
