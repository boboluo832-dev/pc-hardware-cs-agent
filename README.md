# PC Hardware CS Agent

基于 Claude Tool Use 的 PC 硬件智能客服系统，支持产品参数查询、硬件兼容性检测、知识库问答，提供 WebSocket 流式响应和可嵌入式 Chat Widget。

## Features

- **AI 驱动的客服对话** — 基于 Claude Tool Use 循环引擎，支持多轮工具调用后生成自然语言回复
- **硬件兼容性检测** — 覆盖机箱↔主板/显卡/散热器/电源、散热器↔CPU插槽、电源↔接口 6 种检查类型
- **产品参数查询** — SKU 精确匹配 + 名称模糊搜索，支持按字段过滤返回
- **知识库搜索** — 关键词分词匹配，支持按分类和产品线过滤
- **WebSocket 流式响应** — 逐片段推送 AI 回复，用户即时可见
- **可嵌入式 Chat Widget** — Web Component + Shadow DOM 样式隔离，一行标签嵌入任意网站
- **管理后台** — 产品和知识库的完整 CRUD，数据实时生效无需重启

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm Workspaces + Turborepo |
| Language | TypeScript (ES2022) |
| Server | Fastify 5 (HTTP + WebSocket) |
| AI Engine | Anthropic Claude SDK (Tool Use) |
| Database | SQLite (better-sqlite3, WAL mode) |
| Frontend | Preact 10 + Web Component + Shadow DOM |
| Build | Vite 6 (Library Mode IIFE) + tsc |
| Test | Vitest 3 |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  <cs-agent-widget> (Web Component, Shadow DOM)          │
│  Preact + useChat Hook + WebSocket streaming            │
└──────────────────────┬──────────────────────────────────┘
                       │ WebSocket /ws
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Fastify Server                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Agent Orchestrator (Tool Use Loop)                │  │
│  │  → Claude API → tool_use? → execute → loop       │  │
│  └───────────────────────┬───────────────────────────┘  │
│                          ▼                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Tool Registry (Plugin-based)                      │  │
│  │  ├─ lookup_product                                │  │
│  │  ├─ check_compatibility                           │  │
│  │  └─ search_knowledge_base                         │  │
│  └───────────────────────┬───────────────────────────┘  │
│                          ▼                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │ SQLite (WAL mode)                                 │  │
│  │  ├─ products (specs as JSON)                      │  │
│  │  └─ knowledge_base (FAQ, troubleshooting, policy) │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 9.15
- [Anthropic API Key](https://console.anthropic.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/boboluo832-dev/pc-hardware-cs-agent.git
cd pc-hardware-cs-agent

# Install dependencies
pnpm install

# Configure environment variables
cp .env.example packages/server/.env
# Edit packages/server/.env and add your ANTHROPIC_API_KEY
```

### Seed Database

```bash
pnpm db:seed
```

This populates the SQLite database with sample products (cases, PSUs, coolers, smart-screen products) and knowledge base entries (troubleshooting guides, FAQ, warranty policies).

### Development

```bash
# Start all packages in dev mode (server + widget)
pnpm dev
```

- Server: http://localhost:3000
- Admin Dashboard: http://localhost:3000/admin
- Widget Dev: http://localhost:5173

### Build

```bash
pnpm build
```

### Test

```bash
pnpm test
```

## Project Structure

```
pc-hardware-cs-agent/
├── packages/
│   ├── shared/              # @cs-agent/shared — shared type definitions
│   │   └── src/index.ts     # Message, Session, ChatRequest/Response types
│   ├── server/              # @cs-agent/server — backend API + AI agent
│   │   ├── src/
│   │   │   ├── agent/       # Orchestrator (Tool Use loop engine)
│   │   │   ├── api/         # HTTP + WebSocket routes, Admin dashboard
│   │   │   ├── config/      # Environment configuration
│   │   │   ├── knowledge/   # Database initialization
│   │   │   ├── prompts/     # Dynamic system prompt builder
│   │   │   ├── session/     # In-memory session store
│   │   │   └── tools/       # Tool registry + 3 tool implementations
│   │   ├── scripts/         # DB seed script
│   │   └── data/            # SQLite database file
│   └── widget/              # @cs-agent/widget — embeddable chat UI
│       └── src/
│           ├── embed.ts     # Web Component entry (Custom Element)
│           ├── App.tsx      # Root component
│           ├── hooks/       # useChat (WebSocket + streaming)
│           └── components/  # ChatWindow, MessageBubble, QuickReplies
├── turbo.json               # Turborepo task pipeline
├── pnpm-workspace.yaml      # Workspace packages declaration
└── tsconfig.base.json       # Shared TypeScript config
```

## Usage

### Embed the Widget

After building, include the widget script in any HTML page:

```html
<script src="https://your-cdn.com/cs-agent-widget.iife.js"></script>
<cs-agent-widget
  data-ws-url="wss://your-server.com/ws"
  data-theme="light"
  data-position="bottom-right">
</cs-agent-widget>
```

### HTTP API

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "幻影X1机箱能装RTX 4090吗？"}'
```

### WebSocket

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');
ws.send(JSON.stringify({ type: 'message', content: '你好' }));
ws.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.type === 'stream') console.log(data.content);
  if (data.type === 'done') console.log('Complete:', data.message);
};
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Claude API key (required) | — |
| `PORT` | Server port | `3000` |
| `HOST` | Bind address | `0.0.0.0` |
| `DB_PATH` | SQLite database file path | `./data/knowledge.db` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` |

## Adding a New Tool

The plugin-based Tool Registry makes it easy to extend:

```typescript
// packages/server/src/tools/my-tool.ts
import { registerTool } from './registry.js';

registerTool({
  name: 'my_tool',
  description: 'Description for Claude to understand when to use this tool',
  enabled: true,
  input_schema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' }
    },
    required: ['query']
  },
  handler: async (input) => {
    // Your logic here
    return JSON.stringify({ result: 'data' });
  }
});
```

Then import it in `packages/server/src/tools/index.ts`. The orchestrator will automatically pick it up.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Anthropic Claude](https://www.anthropic.com/) — LLM backbone with Tool Use capability
- [Fastify](https://fastify.dev/) — High-performance Node.js web framework
- [Preact](https://preactjs.com/) — Lightweight React alternative
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — Synchronous SQLite3 for Node.js
- [Turborepo](https://turbo.build/) — Monorepo build system
