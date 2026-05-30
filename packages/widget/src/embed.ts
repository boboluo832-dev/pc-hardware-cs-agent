/**
 * Widget 嵌入入口
 * 使用 Web Component (Custom Element) + Shadow DOM 实现样式隔离
 * 宿主页面只需添加一行标签即可嵌入聊天窗口：
 * <cs-agent-widget data-ws-url="ws://..." data-theme="light" data-position="bottom-right"></cs-agent-widget>
 */
import { render, h } from "preact";
import { App } from "./App.js";

class CSAgentWidget extends HTMLElement {
  private shadow: ShadowRoot;

  constructor() {
    super();
    // Shadow DOM 隔离样式，避免与宿主页面 CSS 冲突
    this.shadow = this.attachShadow({ mode: "open" });
  }

  /** 元素挂载到 DOM 时触发，读取配置属性并渲染 Preact 应用 */
  connectedCallback() {
    const wsUrl = this.getAttribute("data-ws-url") || "ws://localhost:3000/ws";
    const theme = this.getAttribute("data-theme") || "light";
    const position = this.getAttribute("data-position") || "bottom-right";

    const container = document.createElement("div");
    this.shadow.appendChild(container);

    render(h(App, { wsUrl, theme, position }), container);
  }
}

// 注册自定义元素（防止重复注册）
if (!customElements.get("cs-agent-widget")) {
  customElements.define("cs-agent-widget", CSAgentWidget);
}
