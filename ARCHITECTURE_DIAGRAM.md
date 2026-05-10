# MCP ITSM — Architecture Diagrams

> Last updated: May 2026 · Spec 2025-11-25 · SDK 1.28.0

---

## System Architecture

```mermaid
graph TB
    subgraph "MCP Clients"
        Claude["Claude / Cursor / Agent"]
        Inspector["MCP Inspector"]
        UI["React Frontend :3000"]
    end

    subgraph "Transport Layer"
        Stdio["StdioServerTransport\nSmithery / local / Inspector"]
        Bridge["Express API :5000\nSDK Client + StdioClientTransport"]
    end

    subgraph "MCP Server — index.js v3.0.0"
        McpSrv["McpServer\nspec 2025-11-25"]
        Tools["7 Tools\nZod schemas + annotations"]
        Resources["4 Resources\nKB articles and Tickets"]
        Prompts["3 Prompts\nIncident / Status / KB-assist"]
        Store["In-Memory Store\nTickets and KB articles"]
    end

    subgraph "Backend Services"
        Auth["JWT Auth\nMiddleware"]
        Metrics["Metrics Store\nper-tool latency and counts"]
        Mongo[("MongoDB\nUsers, Integrations, Context")]
    end

    Claude -->|stdio| Stdio
    Inspector -->|stdio| Stdio
    UI -->|HTTP + JWT Bearer| Bridge

    Stdio --> McpSrv
    Bridge -->|"MCP SDK Client\nfull session handshake"| McpSrv

    McpSrv --> Tools
    McpSrv --> Resources
    McpSrv --> Prompts
    Tools <--> Store
    Resources --> Store

    Bridge --> Auth
    Bridge --> Metrics
    Auth --> Mongo
```

---

## Browser Request Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React UI :3000
    participant API as Express API :5000
    participant Client as MCP SDK Client
    participant MCP as McpServer

    U->>UI: Open /mcp-tickets
    UI->>API: GET /api/mcp/tools/list (JWT)
    API->>Client: client.listTools()
    Client->>MCP: tools/list (MCP protocol)
    MCP-->>Client: tools array with annotations
    Client-->>API: ListToolsResult
    API-->>UI: { success, tools }
    UI->>UI: Render tool list

    U->>UI: Submit create-ticket form
    UI->>API: POST /api/mcp/tools/call
    Note over API: JWT auth check
    API->>Client: client.callTool(name, args)
    Client->>MCP: tools/call (MCP protocol)
    MCP->>MCP: Zod validation
    MCP->>MCP: createTicket() handler
    MCP-->>Client: CallToolResult
    Client-->>API: result
    API->>API: recordCall(metrics)
    API-->>UI: { success, ticket, _meta }
    UI->>UI: Show new ticket
```

---

## Startup Flow

```mermaid
flowchart TD
    Start([Start]) --> InstallRoot["npm install\nRoot directory"]
    InstallRoot --> InstallBackend["cd backend\nnpm install"]
    InstallBackend --> InstallFrontend["cd frontend\nnpm install"]
    InstallFrontend --> CopyEnv["cp .env.example .env\ncp backend/.env.example backend/.env"]
    CopyEnv --> ConfigMongo["Set MONGODB_URI\nand JWT_SECRET in backend/.env"]

    ConfigMongo --> T1["Terminal 1\nnpm start\nMCP server on stdio"]
    ConfigMongo --> T2["Terminal 2\ncd backend && npm start\nExpress API on :5000"]
    ConfigMongo --> T3["Terminal 3\ncd frontend && npm start\nReact app on :3000"]

    T1 --> Ready{All running?}
    T2 --> Ready
    T3 --> Ready

    Ready -->|Yes| App["http://localhost:3000"]
    App --> Tickets["/mcp-tickets\nTicket Manager"]
    App --> Monitor["/mcp-monitor\nLive Dashboard"]
    App --> Chat["/ai-chat\nAI Chat Client"]
```

---

## File Structure

```mermaid
graph TD
    Root["MCP-ITSM/"]

    Root --> IdxJs["index.js\nMcpServer v3.0.0\nZod schemas + annotations\n7 tools, 4 resources, 3 prompts"]
    Root --> ToolsJson["tools.json\nSmithery static catalogue\ninputSchema + annotations"]
    Root --> SmitheryYaml["smithery.yaml\nCLI v4.7+ compatible"]
    Root --> PkgJson["package.json\nSDK 1.28.0, Zod 3.23"]

    Root --> Backend["backend/"]
    Backend --> BkSrc["src/"]
    BkSrc --> BkIdx["index.js\nExpress bootstrap"]
    BkSrc --> BkRoutes["routes/"]
    BkRoutes --> McpRoutes["mcp.routes.js\nSDK Client bridge\nMetrics store\n6 endpoints"]
    BkRoutes --> AuthRoutes["auth.routes.js"]

    Root --> Frontend["frontend/"]
    Frontend --> FeSrc["src/"]
    FeSrc --> FePages["pages/"]
    FePages --> MonitorPage["MCPMonitorDashboard.js\nLive metrics, polls 10s"]
    FePages --> TicketPage["MCPTicketManager.js"]
    FeSrc --> FeSvc["services/mcpService.js"]
    FeSrc --> FeApp["App.js"]
```

---

## MCP Capabilities Map

```mermaid
graph LR
    subgraph "Tools (7)"
        T1["create_ticket\nwrite, non-idempotent"]
        T2["get_ticket\nread-only, idempotent"]
        T3["update_ticket\nwrite, non-idempotent"]
        T4["list_tickets\nread-only, idempotent"]
        T5["assign_ticket\nwrite, idempotent"]
        T6["add_comment\nwrite, non-idempotent"]
        T7["search_knowledge_base\nread-only, idempotent"]
    end

    subgraph "Resources (4)"
        R1["kb://articles\nAll KB articles"]
        R2["kb://articles/{id}\nSingle KB article"]
        R3["itsm://tickets/open\nLive open tickets"]
        R4["itsm://tickets/{id}\nSingle ticket"]
    end

    subgraph "Prompts (3)"
        P1["create-incident-ticket\nP1/P2 template"]
        P2["ticket-status-report\nQueue summary"]
        P3["kb-search-assist\nSearch before ticket"]
    end
```
