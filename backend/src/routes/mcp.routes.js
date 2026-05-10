const express = require('express');
const path = require('path');
const { authenticate } = require('../middleware/auth.middleware');
const { logger } = require('../utils/logger');

const router = express.Router();

const SERVER_PATH = path.join(__dirname, '../../../index.js');
const ROOT_PATH = path.join(__dirname, '../../../');

// ---------------------------------------------------------------------------
// Metrics store
// ---------------------------------------------------------------------------

const metrics = {
  startTime: Date.now(),
  totalCalls: 0,
  successCalls: 0,
  failedCalls: 0,
  toolCallCounts: {},
  recentCalls: [],
  lastCallTime: null,
};

function recordCall(toolName, latencyMs, success) {
  metrics.totalCalls++;
  if (success) metrics.successCalls++;
  else metrics.failedCalls++;
  metrics.lastCallTime = new Date().toISOString();

  if (!metrics.toolCallCounts[toolName]) {
    metrics.toolCallCounts[toolName] = { calls: 0, successes: 0, failures: 0, totalLatencyMs: 0 };
  }
  const t = metrics.toolCallCounts[toolName];
  t.calls++;
  if (success) t.successes++;
  else t.failures++;
  t.totalLatencyMs += latencyMs;

  metrics.recentCalls.unshift({ tool: toolName, timestamp: new Date().toISOString(), latencyMs, success });
  if (metrics.recentCalls.length > 50) metrics.recentCalls.pop();
}

// ---------------------------------------------------------------------------
// MCP Client singleton (SDK Client + StdioClientTransport)
// ---------------------------------------------------------------------------

let mcpClient = null;
let connectingPromise = null;

async function getMCPClient() {
  if (mcpClient) return mcpClient;
  if (connectingPromise) return connectingPromise;

  connectingPromise = (async () => {
    const [{ Client }, { StdioClientTransport }] = await Promise.all([
      import('@modelcontextprotocol/sdk/client/index.js'),
      import('@modelcontextprotocol/sdk/client/stdio.js'),
    ]);

    const transport = new StdioClientTransport({
      command: 'node',
      args: [SERVER_PATH],
      cwd: ROOT_PATH,
      env: { ...process.env },
    });

    const client = new Client(
      { name: 'mcp-itsm-backend', version: '3.0.0' },
      { capabilities: {} },
    );

    transport.onerror = (err) => {
      logger.error('MCP transport error:', err.message);
      mcpClient = null;
      connectingPromise = null;
    };

    transport.onclose = () => {
      logger.warn('MCP server connection closed — will reconnect on next request');
      mcpClient = null;
      connectingPromise = null;
    };

    await client.connect(transport);
    logger.info('Connected to MCP ITSM server via StdioClientTransport');
    mcpClient = client;
    connectingPromise = null;
    return client;
  })().catch((err) => {
    connectingPromise = null;
    throw err;
  });

  return connectingPromise;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/mcp/health
 * Server connectivity and uptime.
 */
router.get('/health', authenticate, async (req, res) => {
  try {
    const isConnected = mcpClient !== null;
    res.json({
      success: true,
      connected: isConnected,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - metrics.startTime) / 1000),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/mcp/tools/list
 * List available MCP tools with annotations and schemas.
 */
router.get('/tools/list', authenticate, async (req, res) => {
  try {
    const client = await getMCPClient();
    const result = await client.listTools();
    res.json({ success: true, tools: result.tools || [] });
  } catch (error) {
    logger.error('Error listing MCP tools:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to list tools' });
  }
});

/**
 * POST /api/mcp/tools/call
 * Call an MCP tool by name with arguments.
 */
router.post('/tools/call', authenticate, async (req, res) => {
  const { name, arguments: args } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Tool name is required' });
  }

  const start = Date.now();
  try {
    const client = await getMCPClient();
    const result = await client.callTool({ name, arguments: args || {} });
    const latencyMs = Date.now() - start;
    const isError = result.isError === true;

    recordCall(name, latencyMs, !isError);

    let parsedResult = result.structuredContent || {};
    if (!result.structuredContent && result.content?.length > 0) {
      try {
        parsedResult = JSON.parse(result.content[0].text);
      } catch {
        parsedResult = { raw: result.content[0].text };
      }
    }

    res.json({ success: !isError, ...parsedResult, _meta: { latencyMs, toolName: name } });
  } catch (error) {
    recordCall(name, Date.now() - start, false);
    logger.error(`Error calling MCP tool '${name}':`, error);
    res.status(500).json({ success: false, message: error.message || 'Failed to call tool' });
  }
});

/**
 * GET /api/mcp/resources/list
 * List available MCP resources.
 */
router.get('/resources/list', authenticate, async (req, res) => {
  try {
    const client = await getMCPClient();
    const result = await client.listResources();
    res.json({ success: true, resources: result.resources || [] });
  } catch (error) {
    logger.error('Error listing MCP resources:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to list resources' });
  }
});

/**
 * GET /api/mcp/prompts/list
 * List available MCP prompts.
 */
router.get('/prompts/list', authenticate, async (req, res) => {
  try {
    const client = await getMCPClient();
    const result = await client.listPrompts();
    res.json({ success: true, prompts: result.prompts || [] });
  } catch (error) {
    logger.error('Error listing MCP prompts:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to list prompts' });
  }
});

/**
 * GET /api/mcp/metrics
 * Aggregated tool-call metrics for the monitoring dashboard.
 */
router.get('/metrics', authenticate, async (req, res) => {
  try {
    const toolStats = Object.entries(metrics.toolCallCounts).map(([name, s]) => ({
      name,
      calls: s.calls,
      successes: s.successes,
      failures: s.failures,
      avgLatencyMs: s.calls > 0 ? Math.round(s.totalLatencyMs / s.calls) : 0,
      successRate: s.calls > 0 ? Math.round((s.successes / s.calls) * 100) : 100,
    }));

    res.json({
      success: true,
      serverConnected: mcpClient !== null,
      uptimeSeconds: Math.floor((Date.now() - metrics.startTime) / 1000),
      totalCalls: metrics.totalCalls,
      successCalls: metrics.successCalls,
      failedCalls: metrics.failedCalls,
      overallSuccessRate: metrics.totalCalls > 0
        ? Math.round((metrics.successCalls / metrics.totalCalls) * 100)
        : 100,
      toolStats,
      recentCalls: metrics.recentCalls.slice(0, 20),
      lastCallTime: metrics.lastCallTime,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
