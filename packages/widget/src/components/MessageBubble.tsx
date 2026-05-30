/**
 * 消息气泡组件
 * 用户消息靠右蓝色背景，AI 回复靠左灰色背景
 * 支持 dark 模式下的配色切换
 */
import { h } from "preact";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface MessageBubbleProps {
  message: Message;
  isDark: boolean;
}

export function MessageBubble({ message, isDark }: MessageBubbleProps) {
  const isUser = message.role === "user";

  // 用户消息：蓝底白字靠右；AI消息：灰底黑字靠左
  const bubbleStyle = isUser
    ? `background: #2563eb; color: white; border-radius: 16px 16px 4px 16px; margin-left: auto;`
    : `background: ${isDark ? "#374151" : "#f3f4f6"}; color: ${isDark ? "#f9fafb" : "#111827"}; border-radius: 16px 16px 16px 4px; margin-right: auto;`;

  return h(
    "div",
    {
      style: `
        max-width: 85%; padding: 10px 14px; font-size: 14px;
        line-height: 1.5; word-break: break-word; white-space: pre-wrap;
        ${bubbleStyle}
      `,
    },
    message.content
  );
}
