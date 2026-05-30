/**
 * Vite 构建配置
 * 以 library 模式打包 Widget，输出单个 IIFE 文件
 * 宿主页面通过 <script src="cs-agent-widget.iife.js"> 引入即可
 */
import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact()],
  build: {
    lib: {
      entry: "src/embed.ts",           // 入口文件
      name: "CSAgentWidget",           // 全局变量名
      fileName: "cs-agent-widget",     // 输出文件名
      formats: ["iife"],               // IIFE 格式，适合 <script> 标签直接引入
    },
    cssCodeSplit: false,               // CSS 内联到 JS 中，无需额外加载样式文件
  },
});
