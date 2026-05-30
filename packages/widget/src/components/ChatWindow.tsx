/**
 * 聊天窗口主组件
 * 包含：顶部标题栏、消息列表区域、快捷回复按钮、底部输入框
 * 支持 light/dark 主题切换
 */
import { h } from "preact";
import { useState, useRef, useEffect } from "preact/hooks";
import { useChat } from "../hooks/useChat.js";
import { MessageBubble } from "./MessageBubble.js";
import { QuickReplies } from "./QuickReplies.js";

interface ChatWindowProps {
  wsUrl: string;
  theme: string;
  onClose: () => void;
}

export function ChatWindow({ wsUrl, theme, onClose }: ChatWindowProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isTyping, sendMessage } = useChat(wsUrl);

  // 新消息到达时自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /** 发送消息并清空输入框 */
  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    sendMessage(text);
    setInput("");
  };

  /** Enter 发送，Shift+Enter 换行 */
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 主题色配置
  const isDark = theme === "dark";
  const bg = isDark ? "#1f2937" : "#ffffff";
  const headerBg = isDark ? "#111827" : "#2563eb";
  const inputBg = isDark ? "#374151" : "#f3f4f6";
  const textColor = isDark ? "#f9fafb" : "#111827";

  return h(
    "div",
    {
      style: `
        width: 380px; height: 560px; border-radius: 16px; overflow: hidden;
        display: flex; flex-direction: column; background: ${bg};
        box-shadow: 0 20px 60px rgba(0,0,0,0.2); color: ${textColor};
      `,
    },
    // Header
    h(
      "div",
      {
        style: `
          padding: 16px; background: ${headerBg}; color: white;
          display: flex; align-items: center; justify-content: space-between;
        `,
      },
      h(
        "div",
        { style: "display: flex; align-items: center; gap: 10px;" },
        h("div", {
          style: "width: 10px; height: 10px; border-radius: 50%; background: #34d399;",
        }),
        h("span", { style: "font-weight: 600; font-size: 15px;" }, "智能客服助手")
      ),
      h(
        "button",
        {
          onClick: onClose,
          style: "background: none; border: none; color: white; cursor: pointer; font-size: 20px; padding: 4px;",
        },
        "×"
      )
    ),
    // Messages
    h(
      "div",
      {
        style: `
          flex: 1; overflow-y: auto; padding: 16px;
          display: flex; flex-direction: column; gap: 12px;
        `,
      },
      messages.length === 0 &&
        h(
          "div",
          { style: "text-align: center; color: #9ca3af; padding: 40px 20px;" },
          h("p", { style: "font-size: 14px; margin: 0;" }, "您好！我是智能客服助手。"),
          h(
            "p",
            { style: "font-size: 13px; margin: 8px 0 0;" },
            "有关机箱、电源、散热器或智能产品的问题，都可以问我。"
          )
        ),
      messages.map((msg) => h(MessageBubble, { key: msg.id, message: msg, isDark })),
      isTyping &&
        h(
          "div",
          { style: "display: flex; gap: 4px; padding: 8px 12px;" },
          h("span", { style: "width:6px;height:6px;border-radius:50%;background:#9ca3af;animation:bounce 1.4s infinite;" }),
          h("span", { style: "width:6px;height:6px;border-radius:50%;background:#9ca3af;animation:bounce 1.4s 0.2s infinite;" }),
          h("span", { style: "width:6px;height:6px;border-radius:50%;background:#9ca3af;animation:bounce 1.4s 0.4s infinite;" })
        ),
      h("div", { ref: messagesEndRef })
    ),
    // Quick replies
    messages.length === 0 &&
      h(QuickReplies, {
        replies: [
          "产品兼容性查询",
          "屏幕不亮怎么办",
          "电源瓦数怎么选",
          "保修政策",
        ],
        onSelect: sendMessage,
      }),
    // Input
    h(
      "div",
      {
        style: `padding: 12px 16px; border-top: 1px solid ${isDark ? "#374151" : "#e5e7eb"};`,
      },
      h(
        "div",
        { style: "display: flex; gap: 8px; align-items: center;" },
        h("input", {
          type: "text",
          value: input,
          onInput: (e: Event) => setInput((e.target as HTMLInputElement).value),
          onKeyDown: handleKeyDown,
          placeholder: "请描述您的问题...",
          style: `
            flex: 1; padding: 10px 14px; border-radius: 20px; border: none;
            background: ${inputBg}; font-size: 14px; outline: none; color: ${textColor};
          `,
        }),
        h(
          "button",
          {
            onClick: handleSend,
            disabled: !input.trim(),
            style: `
              width: 36px; height: 36px; border-radius: 50%; border: none;
              background: ${input.trim() ? "#2563eb" : "#d1d5db"}; color: white;
              cursor: ${input.trim() ? "pointer" : "default"}; display: flex;
              align-items: center; justify-content: center;
            `,
          },
          h(
            "svg",
            { width: "16", height: "16", viewBox: "0 0 24 24", fill: "currentColor" },
            h("path", { d: "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" })
          )
        )
      )
    )
  );
}
