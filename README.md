# MCP ITSM

> Unified IT Service Management over the **Model Context Protocol** — create, track, and resolve tickets across ServiceNow, Jira, Zendesk, Ivanti Neurons, and Cherwell from any MCP-compatible LLM client.

[![MCP Spec](https://img.shields.io/badge/MCP%20Spec-2025--11--25-blue?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMSAxNEg5VjhIMTF2OHptNCAwaC0yVjhoMnY4eiIvPjwvc3ZnPg==)](https://modelcontextprotocol.io/specification/2025-11-25)
[![SDK](https://img.shields.io/badge/%40modelcontextprotocol%2Fsdk-1.28.0-4f46e5)](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0-brightgreen?logo=node.js)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Smithery](https://smithery.ai/badge/@madosh/mcp-itsm)](https://smithery.ai/server/@madosh/mcp-itsm)
<a href="https://glama.ai/mcp/servers/hud80wep9g"><img width="120" height="20" src="https://glama.ai/mcp/servers/hud80wep9g/badge" alt="Glama" /></a>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [MCP Tools](#mcp-tools)
- [MCP Resources](#mcp-resources)
- [MCP Prompts](#mcp-prompts)
- [Configuration](#configuration)
- [Monitoring Dashboard](#monitoring-dashboard)
- [API Reference](#api-reference)
- [Smithery Deployment](#smithery-deployment)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

MCP ITSM exposes a standardised set of **MCP tools, resources, and prompts** so that any LLM client (Claude, Cursor, custom agents) can manage IT tickets without knowing the underlying ITSM system's API.

**What it is:**

| Layer | What's here |
|---|---|
| `index.js` | MCP server — 7 tools, 4 resources, 3 prompts over stdio |
| `backend/` | Express REST API that bridges HTTP clients to the MCP server via the official SDK `Client` |
| `frontend/` | React 18 web app — Ticket Manager UI + live Monitoring Dashboard |

**Why it matters:**  
Instead of writing separate integrations for ServiceNow, Jira, Zendesk, Ivanti, and Cherwell, an LLM calls `create_ticket` once and the correct system receives it. Every tool carries **safety annotations** (`readOnlyHint`, `destructiveHint`) so the model knows what it can call without risk.

---

## Architecture

```mermaid
graph TB
    subgraph "MCP Clients"
        Claude["Claude / Cursor / Agent"]
        Inspector["MCP Inspector"]
        UI["React Frontend :3000"]
    end

    subgraph "Transport"
        Stdio["StdioServerTransport\n(Smithery / Inspector)"]
        Bridge["Express API :5000\nSDK Client + StdioClientTransport"]
    end

    subgraph "MCP Server  —  index.js  v3.0.0"
        McpSrv["McpServer\nspec 2025-11-25"]
        Tools["7 Tools\nZod · annotated"]
        Resources["4 Resources\nKB articles · Tickets"]
        Prompts["3 Prompts\nIncident · Status · KB-assist"]
        Store["In-Memory Store\nTickets & KB articles"]
    end

    subgraph "Backend Services"
        Auth["JWT Auth"]
        Metrics["Metrics Store"]
        Mongo[("MongoDB")]
    end

    Claude -->|stdio| Stdio
    Inspector -->|stdio| Stdio
    UI -->|HTTP + JWT| Bridge

    Stdio --> McpSrv
    Bridge -->|"MCP SDK Client\n(proper handshake)"| McpSrv

    McpSrv --> Tools
    McpSrv --> Resources
    McpSrv --> Prompts
    Tools <--> Store
    Resources --> Store

    Bridge --> Auth
    Bridge --> Metrics
    Auth --> Mongo
```

**Request flow — browser tool call:**

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React UI :3000
    participant API as Express API :5000
    participant C as MCP SDK Client
    participant MCP as McpServer index.js

    U->>UI: Submit form
    UI->>API: POST /api/mcp/tools/call (JWT)
    API->>C: client.callTool(name, args)
    Note over C: StdioClientTransport
    C->>MCP: tools/call (MCP protocol)
    Note over MCP: Zod validates input
    MCP->>MCP: tool handler + in-memory store
    MCP-->>C: CallToolResult
    C-->>API: result
    API->>API: recordCall() → metrics
    API-->>UI: { success, data, _meta }
    UI->>U: Show result
```

---

## Quick Start

### Prerequisites

- **Node.js ≥ 18**
- **MongoDB** (local or Atlas — required by the backend)
- Optional: [Smithery CLI](https://smithery.ai/docs/concepts/cli) for cloud deployment

### 1 — Install dependencies

```bash
# Root (MCP server)
npm install

# Backend API
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### 2 — Configure environment

```bash
cp .env.example .env          # root — API key for Smithery / MCP auth
cp backend/.env.example backend/.env   # backend — Mongo URI, JWT secret, ITSM creds
```

Minimum required for local dev (edit `backend/.env`):

```env
MONGODB_URI=mongodb://localhost:27017/mcp-itsm
JWT_SECRET=change-me-in-production
```

### 3 — Start all services

Open three terminals:

```bash
# Terminal 1 — MCP server (stdio)
npm start

# Terminal 2 — Backend API
cd backend && npm start        # http://localhost:5000

# Terminal 3 — Frontend
cd frontend && npm start       # http://localhost:3000
```

```mermaid
flowchart LR
    T1["Terminal 1\nnpm start\nMCP server on stdio"]
    T2["Terminal 2\ncd backend\nnpm start  :5000"]
    T3["Terminal 3\ncd frontend\nnpm start  :3000"]
    UI["localhost:3000\nTicket Manager\nMonitor Dashboard"]

    T1 -->|"SDK Client\nStdioClientTransport"| T2
    T2 -->|"HTTP + JWT"| T3
    T3 --> UI
```

### Access points

| URL | What |
|---|---|
| `http://localhost:3000` | React web app |
| `http://localhost:3000/mcp-tickets` | MCP Ticket Manager |
| `http://localhost:3000/mcp-monitor` | Live Monitoring Dashboard |
| `http://localhost:5000/health` | Backend health check |
| `http://localhost:5000/api/mcp/health` | MCP server connectivity |
| `http://localhost:5000/api/mcp/metrics` | Tool-call metrics (auth required) |

---

## Project Structure

```
mcp-itsm/
├── index.js                  # MCP server (McpServer, Zod, stdio)
├── tools.json                # Static tool catalogue for Smithery browser
├── smithery.yaml             # Smithery deployment config
├── package.json              # Root deps: @modelcontextprotocol/sdk, zod
├── .env.example              # Root env template
│
├── backend/
│   ├── package.json          # Express, Mongoose, JWT, MCP SDK Client
│   ├── .env.example          # Backend env template
│   └── src/
│       ├── index.js          # Express app bootstrap
│       ├── config/config.js  # Env-driven configuration
│       ├── routes/
│       │   ├── mcp.routes.js      # MCP bridge + metrics endpoints
│       │   ├── auth.routes.js
│       │   ├── context.routes.js
│       │   ├── integration.routes.js
│       │   └── user.routes.js
│       ├── middleware/
│       │   ├── auth.middleware.js
│       │   └── validation.middleware.js
│       ├── models/
│       ├── validators/
│       └── utils/logger.js
│
├── frontend/
│   ├── package.json          # React 18, Bootstrap, react-router-dom
│   └── src/
│       ├── App.js
│       ├── pages/
│       │   ├── MCPTicketManager.js     # Ticket CRUD UI
│       │   ├── MCPMonitorDashboard.js  # Live monitoring (polls every 10s)
│       │   ├── Dashboard.js
│       │   ├── LLMChatClient.js
│       │   └── ...
│       ├── services/
│       │   ├── mcpService.js   # HTTP client for MCP tool calls
│       │   └── api.js          # Axios instance with JWT interceptor
│       └── components/
│           ├── Header.js
│           └── ...
│
└── docs/
    ├── api-documentation.md
    ├── mcp_relationship.md
    └── llm_enabled_tickets.md
```

---

## MCP Tools

All 7 tools are registered via `McpServer.tool()` with **Zod input schemas** and **safety annotations**. LLM clients use the annotations to decide whether to call a tool without user confirmation.

| Tool | Title | Read-only | Idempotent | Required params |
|---|---|:---:|:---:|---|
| `create_ticket` | Create Ticket | — | — | `title`, `description` |
| `get_ticket` | Get Ticket | ✓ | ✓ | `ticket_id` |
| `update_ticket` | Update Ticket | — | — | `ticket_id` |
| `list_tickets` | List Tickets | ✓ | ✓ | — |
| `assign_ticket` | Assign Ticket | — | ✓ | `ticket_id`, `user_id` |
| `add_comment` | Add Comment | — | — | `ticket_id`, `comment` |
| `search_knowledge_base` | Search KB | ✓ | ✓ | `query` |

**Supported systems** (via the optional `system` parameter): `servicenow` · `jira` · `zendesk` · `ivanti_neurons` · `cherwell` (default: `jira`)

```mermaid
graph LR
    subgraph RO["Read-only  —  safe to call freely"]
        GT["get_ticket\nreadOnly · idempotent"]
        LT["list_tickets\nreadOnly · idempotent"]
        SK["search_knowledge_base\nreadOnly · idempotent"]
    end
    subgraph WR["Write  —  require user intent"]
        CT["create_ticket\nwrite"]
        UT["update_ticket\nwrite"]
        AT["assign_ticket\nwrite · idempotent"]
        AC["add_comment\nwrite"]
    end
    style RO fill:#f0fdf4,stroke:#86efac
    style WR fill:#fff1f2,stroke:#fecdd3
```

### Example — create a ticket

```json
// Tool call
{
  "name": "create_ticket",
  "arguments": {
    "title": "VPN not connecting after Windows update",
    "description": "Since the KB5034441 update, VPN client fails to authenticate on first attempt.",
    "priority": "high",
    "system": "jira"
  }
}

// Response
{
  "success": true,
  "ticket": {
    "id": "JIRA-1000",
    "title": "VPN not connecting after Windows update",
    "system": "jira",
    "status": "open",
    "priority": "high",
    "url": "https://example.com/jira/tickets/JIRA-1000"
  }
}
```

---

## MCP Resources

Resources expose live data that LLM clients can read without a tool call.

| URI | Name | Description |
|---|---|---|
| `kb://articles` | kb-articles | All knowledge base articles (JSON) |
| `kb://articles/{id}` | kb-article | Single KB article by ID (e.g. `KB-001`) |
| `itsm://tickets/open` | open-tickets | All currently open tickets (live) |
| `itsm://tickets/{ticketId}` | ticket | Single ticket by ID (e.g. `JIRA-1000`) |

```mermaid
graph LR
    McpSrv["McpServer"]
    McpSrv -->|"static\nkb://articles"| KBAll["kb-articles\nAll KB articles as JSON"]
    McpSrv -->|"template\nkb://articles/{id}"| KBOne["kb-article\nSingle article by ID"]
    McpSrv -->|"static\nitsm://tickets/open"| TOpen["open-tickets\nLive filtered view"]
    McpSrv -->|"template\nitsm://tickets/{id}"| TOne["ticket\nSingle ticket by ID"]
    style McpSrv fill:#f0fdf4,stroke:#86efac
```

---

## MCP Prompts

Prompts are guided message templates that clients present to users before a tool call sequence.

| Name | Description | Arguments |
|---|---|---|
| `create-incident-ticket` | P1/P2 incident ticket template | `title` (req), `system`, `affected_service` |
| `ticket-status-report` | Structured queue summary | `filter_status` |
| `kb-search-assist` | Search KB before creating a ticket | `issue_description` (req) |

```mermaid
sequenceDiagram
    participant U as User
    participant C as MCP Client
    participant MCP as McpServer

    U->>C: "My printer won't install"
    C->>MCP: prompts/get  kb-search-assist
    MCP-->>C: message template
    C->>MCP: tools/call  search_knowledge_base
    MCP-->>C: KB-005 Printer setup guide
    C->>U: Show article — no ticket needed
    Note over C,U: Only escalates to create_ticket if no article resolves it
```

---

## Configuration

### Root `.env` (MCP server + Smithery)

```env
# API key used when running via Smithery (injected as API_KEY env var)
API_KEY=your-smithery-api-key
```

### Backend `backend/.env`

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/mcp-itsm

# Auth
JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRES_IN=1d

# ITSM integrations (all optional — only needed for live system calls)
SERVICENOW_BASE_URL=https://your-instance.service-now.com
SERVICENOW_USERNAME=admin
SERVICENOW_PASSWORD=

JIRA_BASE_URL=https://your-org.atlassian.net
JIRA_EMAIL=you@example.com
JIRA_API_TOKEN=

ZENDESK_BASE_URL=https://your-org.zendesk.com
ZENDESK_USERNAME=you@example.com
ZENDESK_TOKEN=

IVANTI_BASE_URL=https://your-instance.ivanti.com
IVANTI_CLIENT_ID=
IVANTI_CLIENT_SECRET=

CHERWELL_BASE_URL=https://your-instance.cherwell.com
CHERWELL_CLIENT_ID=
CHERWELL_USERNAME=
CHERWELL_PASSWORD=

# Logging
LOG_LEVEL=info
```

---

## Monitoring Dashboard

The frontend includes a live monitoring dashboard at `/mcp-monitor` that polls the backend every **10 seconds**.

**What it shows:**

- Server connected / disconnected status with uptime
- Total calls, success rate, failed call count
- Per-tool call statistics with average latency badges
- Available tools with annotation labels (read-only, write, idempotent)
- Registered resources and prompts
- Live activity log of the last 20 tool calls

The data is sourced from the in-memory metrics store in `backend/src/routes/mcp.routes.js` and reset on backend restart.

```mermaid
flowchart TD
    DB["React Dashboard\n/mcp-monitor\npoll every 10 s"]
    DB -->|"GET /api/mcp/health"| H["connected · uptimeSeconds"]
    DB -->|"GET /api/mcp/metrics"| M["totalCalls · successRate\ntoolStats · recentCalls"]
    DB -->|"GET /api/mcp/tools/list"| T["tool names + annotations"]
    DB -->|"GET /api/mcp/resources/list"| R["resource URIs"]
    DB -->|"GET /api/mcp/prompts/list"| P["prompt names"]
```

---

## API Reference

All `/api/mcp/*` endpoints require a valid JWT in the `Authorization: Bearer <token>` header.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/mcp/health` | MCP server connectivity + backend uptime |
| `GET` | `/api/mcp/metrics` | Tool-call metrics (counts, latency, recent calls) |
| `GET` | `/api/mcp/tools/list` | List all registered tools with schemas + annotations |
| `POST` | `/api/mcp/tools/call` | Call a tool — body: `{ name, arguments }` |
| `GET` | `/api/mcp/resources/list` | List registered MCP resources |
| `GET` | `/api/mcp/prompts/list` | List registered MCP prompts |

### Tool call example (curl)

```bash
# Authenticate first
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' | jq -r '.token')

# Call a tool
curl -X POST http://localhost:5000/api/mcp/tools/call \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "search_knowledge_base",
    "arguments": { "query": "vpn", "limit": 3 }
  }'
```

---

## Smithery Deployment

The server is published at **[@madosh/mcp-itsm](https://smithery.ai/server/@madosh/mcp-itsm)** on Smithery.

```mermaid
flowchart LR
    Dev["Developer\nnpm publish via\nsmithery publish"]
    Smithery["Smithery Cloud\nDocker container\nenv API_KEY injected"]
    MCPSrv["McpServer v3.0.0\nnpm start → stdio"]
    Client["Claude / Cursor\nany MCP client"]

    Dev -->|"smithery.yaml\ntools.json"| Smithery
    Smithery -->|"spawn"| MCPSrv
    Client -->|"MCP protocol\nstdio"| Smithery
    Smithery <-->|"proxy"| MCPSrv
```

### Install via Smithery CLI

```bash
npx -y @smithery/cli install @madosh/mcp-itsm --client claude
```

### Manual Smithery deploy

```bash
npm install -g @smithery/cli
smithery login
smithery publish
```

The `smithery.yaml` configuration:

```yaml
startCommand:
  type: stdio
  configSchema:
    type: object
    required: [apiKey]
    properties:
      apiKey:
        type: string
  commandFunction: |-
    (config) => ({ command: 'npm', args: ['start'], env: { API_KEY: config.apiKey } })
tools:
  path: ./tools.json
```

### Use with Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-itsm": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-itsm/index.js"],
      "env": { "API_KEY": "your-key" }
    }
  }
}
```

### Debug with MCP Inspector

```bash
npm run debug-mcp
# Opens MCP Inspector at http://localhost:5173
```

---

## Development

### Available scripts

```bash
# Root
npm start              # Start MCP server on stdio
npm run debug-mcp      # Start with MCP Inspector attached

# Backend
cd backend
npm start              # Production
npm run dev            # Development (nodemon hot-reload)
npm test               # Jest test suite

# Frontend
cd frontend
npm start              # Dev server on :3000
npm run build          # Production build
```

### Tech stack

| Layer | Technologies |
|---|---|
| MCP Server | Node.js 18+, `@modelcontextprotocol/sdk` 1.28.0, Zod 3.23 |
| Backend | Express 4, Mongoose 7, JWT, Helmet, Winston |
| Frontend | React 18, React Router 6, Bootstrap 5 |
| MCP Spec | [2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25) |
| Deployment | Smithery (stdio), Docker |

### Running with Docker

```bash
docker build -t mcp-itsm .
docker run -e API_KEY=your-key mcp-itsm
```

---

## Contributing

Contributions are welcome. Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes (`git commit -m 'feat: add my feature'`)
4. Push to the branch (`git push origin feat/my-feature`)
5. Open a Pull Request

### Roadmap

- [ ] OAuth 2.1 / OIDC authorization for external clients
- [ ] Elicitation — server-initiated mid-call user prompts
- [ ] Experimental Tasks — durable async ticket workflows
- [ ] Live ITSM system adapters (ServiceNow, Jira, Zendesk)
- [ ] `outputSchema` / `structuredContent` on all tools

```mermaid
graph LR
    subgraph Done["Shipped in v3.0.0"]
        D1["SDK 1.28.0 + Zod"]
        D2["McpServer API"]
        D3["Tool annotations"]
        D4["Resources + Prompts"]
        D5["SDK Client transport"]
        D6["Metrics + Dashboard"]
    end
    subgraph Next["Next"]
        N1["OAuth 2.1 / OIDC"]
        N2["Elicitation"]
        N3["Tasks API"]
        N4["Live ITSM adapters"]
    end
    style Done fill:#f0fdf4,stroke:#86efac
    style Next fill:#eff6ff,stroke:#bfdbfe
```

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

## Resources

- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP Spec 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)
- [Smithery Documentation](https://smithery.ai/docs)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
