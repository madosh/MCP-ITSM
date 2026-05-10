# Quick Start — MCP ITSM

## In 3 steps

### Step 1 — Install

```bash
npm install                              # MCP server deps
cd backend && npm install && cd ..       # Backend API deps
cd frontend && npm install && cd ..      # Frontend deps
```

### Step 2 — Configure

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Edit `backend/.env` — at minimum set:

```env
MONGODB_URI=mongodb://localhost:27017/mcp-itsm
JWT_SECRET=change-me
```

### Step 3 — Run (3 terminals)

```bash
# Terminal 1 — MCP server (stdio)
npm start

# Terminal 2 — Backend API
cd backend && npm start          # → http://localhost:5000

# Terminal 3 — Frontend
cd frontend && npm start         # → http://localhost:3000
```

---

## URLs

| URL | What |
|---|---|
| `http://localhost:3000` | Web app |
| `http://localhost:3000/mcp-tickets` | Ticket Manager |
| `http://localhost:3000/mcp-monitor` | Live Monitoring Dashboard |
| `http://localhost:5000/api/mcp/health` | MCP server status |
| `http://localhost:5000/api/mcp/metrics` | Tool-call metrics (auth) |

---

## Debug with MCP Inspector

```bash
npm run debug-mcp
# Opens Inspector at http://localhost:5173
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Cannot find module zod` | `npm install` in root |
| Backend `ECONNREFUSED` on Mongo | Start MongoDB or set `MONGODB_URI` to Atlas |
| Frontend blank after login | Check backend is running on `:5000` |
| MCP server not connecting | Check Terminal 1 shows `MCP ITSM Server v3.0.0 running on stdio` |
| `/api/mcp/metrics` returns 401 | Pass `Authorization: Bearer <token>` from login |
