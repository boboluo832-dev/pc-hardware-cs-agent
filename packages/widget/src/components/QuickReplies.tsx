/**
 * 快捷回复按钮组件
 * 在对话开始前显示常见问题按钮，点击后直接发送对应文本
 * 帮助用户快速进入咨询流程
 */
import { h } from "preact";

interface QuickRepliesProps {
  replies: string[];                    // 快捷回复文本列表
  onSelect: (text: string) => void;     // 点击后的回调（发送消息）
}

export function QuickReplies({ replies, onSelect }: QuickRepliesProps) {
  return h(
    "div",
    {
      style: "padding: 0 16px 8px; display: flex; flex-wrap: wrap; gap: 8px;",
    },
    replies.map((text) =>
      h(
        "button",
        {
          key: text,
          onClick: () => onSelect(text),
          style: `
            padding: 6px 12px; border-radius: 16px; font-size: 13px;
            border: 1px solid #d1d5db; background: white; color: #374151;
            cursor: pointer; transition: all 0.2s;
          `,
          onMouseEnter: (e: Event) => {
            const el = e.target as HTMLElement;
            el.style.background = "#2563eb";
            el.style.color = "white";
            el.style.borderColor = "#2563eb";
          },
          onMouseLeave: (e: Event) => {
            const el = e.target as HTMLElement;
            el.style.background = "white";
            el.style.color = "#374151";
            el.style.borderColor = "#d1d5db";
          },
        },
        text
      )
    )
  );
}
