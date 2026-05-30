/**
 * Widget 根组件
 * 控制聊天窗口的展开/收起状态
 * 收起时显示浮动气泡按钮，展开时显示完整聊天窗口
 */
import { h } from "preact";
import { useState } from "preact/hooks";
import { ChatWindow } from "./components/ChatWindow.js";

interface AppProps {
  wsUrl: string;    // WebSocket 服务地址
  theme: string;    // 主题：light / dark
  position: string; // 位置：bottom-right / bottom-left
}

export function App({ wsUrl, theme, position }: AppProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 位置样式映射
  const positionStyles: Record<string, string> = {
    "bottom-right": "bottom: 20px; right: 20px;",
    "bottom-left": "bottom: 20px; left: 20px;",
  };

  return h(
    "div",
    {
      style: `position: fixed; ${positionStyles[position] || positionStyles["bottom-right"]} z-index: 99999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;`,
    },
    // 展开状态：显示聊天窗口；收起状态：显示浮动气泡按钮
    isOpen
      ? h(ChatWindow, {
          wsUrl,
          theme,
          onClose: () => setIsOpen(false),
        })
      : h(
          "button",
          {
            onClick: () => setIsOpen(true),
            style: `
              width: 56px; height: 56px; border-radius: 50%; border: none;
              background: #2563eb; color: white; cursor: pointer;
              display: flex; align-items: center; justify-content: center;
              box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
              transition: transform 0.2s;
            `,
            onMouseEnter: (e: Event) => ((e.target as HTMLElement).style.transform = "scale(1.1)"),
            onMouseLeave: (e: Event) => ((e.target as HTMLElement).style.transform = "scale(1)"),
          },
          // 聊天图标 SVG
          h(
            "svg",
            { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2" },
            h("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" })
          )
        )
  );
}
