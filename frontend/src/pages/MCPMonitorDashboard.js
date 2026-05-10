import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Badge, Table, Alert,
  Button, ProgressBar, Spinner, ListGroup,
} from 'react-bootstrap';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const POLL_INTERVAL_MS = 10000;

function getAuthHeaders() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.token) return { Authorization: `Bearer ${user.token}` };
    const token = localStorage.getItem('token');
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {
    // ignore
  }
  return {};
}

async function apiFetch(path) {
  const res = await fetch(`${API_BASE}/mcp${path}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function formatUptime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return new Date(iso).toLocaleTimeString();
}

function StatusDot({ connected }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: connected ? '#28a745' : '#dc3545',
        marginRight: 6,
        verticalAlign: 'middle',
        animation: connected ? 'pulse-green 2s infinite' : 'none',
      }}
    />
  );
}

export default function MCPMonitorDashboard() {
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [tools, setTools] = useState([]);
  const [resources, setResources] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [countdown, setCountdown] = useState(POLL_INTERVAL_MS / 1000);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [h, m, t, r, p] = await Promise.allSettled([
        apiFetch('/health'),
        apiFetch('/metrics'),
        apiFetch('/tools/list'),
        apiFetch('/resources/list'),
        apiFetch('/prompts/list'),
      ]);
      if (h.status === 'fulfilled') setHealth(h.value);
      if (m.status === 'fulfilled') setMetrics(m.value);
      if (t.status === 'fulfilled') setTools(t.value.tools || []);
      if (r.status === 'fulfilled') setResources(r.value.resources || []);
      if (p.status === 'fulfilled') setPrompts(p.value.prompts || []);

      const allFailed = [h, m, t, r, p].every(r => r.status === 'rejected');
      if (allFailed) setError('Cannot reach the backend. Make sure the Express server is running on port 5000.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
      setCountdown(POLL_INTERVAL_MS / 1000);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const pollId = setInterval(fetchAll, POLL_INTERVAL_MS);
    return () => clearInterval(pollId);
  }, [fetchAll]);

  useEffect(() => {
    const tick = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(tick);
  }, [lastRefresh]);

  const connected = health?.connected ?? false;
  const uptime = formatUptime(health?.uptimeSeconds ?? 0);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Connecting to MCP server…</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <style>{`
        @keyframes pulse-green {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Header */}
      <Row className="align-items-center mb-4">
        <Col>
          <h2 className="mb-0 fw-bold">
            MCP Server Monitor
            <Badge
              bg={connected ? 'success' : 'danger'}
              className="ms-3 fs-6 align-middle"
            >
              <StatusDot connected={connected} />
              {connected ? 'Connected' : 'Disconnected'}
            </Badge>
          </h2>
          <small className="text-muted">
            Spec 2025-11-25 · SDK ^1.28.0 · v3.0.0
          </small>
        </Col>
        <Col xs="auto" className="text-end">
          <small className="text-muted d-block">
            Last refresh: {lastRefresh ? lastRefresh.toLocaleTimeString() : '—'}
          </small>
          <small className="text-muted d-block">
            Next refresh in {countdown}s
          </small>
          <Button size="sm" variant="outline-primary" className="mt-1" onClick={fetchAll}>
            Refresh now
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="warning" dismissible onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats row */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <Card className="text-center h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="fs-1 fw-bold text-primary">{metrics?.totalCalls ?? 0}</div>
              <div className="text-muted small">Total Tool Calls</div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="text-center h-100 border-0 shadow-sm">
            <Card.Body>
              <div className={`fs-1 fw-bold ${(metrics?.overallSuccessRate ?? 100) >= 95 ? 'text-success' : 'text-warning'}`}>
                {metrics?.overallSuccessRate ?? 100}%
              </div>
              <div className="text-muted small">Success Rate</div>
              <ProgressBar
                variant={(metrics?.overallSuccessRate ?? 100) >= 95 ? 'success' : 'warning'}
                now={metrics?.overallSuccessRate ?? 100}
                className="mt-2"
                style={{ height: 4 }}
              />
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="text-center h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="fs-1 fw-bold text-danger">{metrics?.failedCalls ?? 0}</div>
              <div className="text-muted small">Failed Calls</div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="text-center h-100 border-0 shadow-sm">
            <Card.Body>
              <div className="fs-1 fw-bold text-info">{uptime}</div>
              <div className="text-muted small">Backend Uptime</div>
              <div className="text-muted" style={{ fontSize: 11 }}>
                Last call: {timeAgo(metrics?.lastCallTime)}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mb-4">
        {/* Per-tool stats */}
        <Col lg={8}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white fw-semibold border-bottom">
              Tool Call Statistics
              <Badge bg="secondary" className="ms-2">{tools.length} tools</Badge>
            </Card.Header>
            <Card.Body className="p-0">
              {(metrics?.toolStats?.length ?? 0) === 0 ? (
                <div className="p-4 text-muted text-center">No tool calls recorded yet.</div>
              ) : (
                <Table hover responsive className="mb-0" size="sm">
                  <thead className="table-light">
                    <tr>
                      <th>Tool</th>
                      <th className="text-center">Calls</th>
                      <th className="text-center">Success</th>
                      <th className="text-center">Failed</th>
                      <th className="text-center">Avg Latency</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(metrics?.toolStats ?? []).map((t) => (
                      <tr key={t.name}>
                        <td><code style={{ fontSize: 12 }}>{t.name}</code></td>
                        <td className="text-center">{t.calls}</td>
                        <td className="text-center text-success">{t.successes}</td>
                        <td className="text-center text-danger">{t.failures}</td>
                        <td className="text-center">
                          <Badge bg={t.avgLatencyMs < 100 ? 'success' : t.avgLatencyMs < 500 ? 'warning' : 'danger'}>
                            {t.avgLatencyMs}ms
                          </Badge>
                        </td>
                        <td style={{ minWidth: 80 }}>
                          <ProgressBar
                            variant={t.successRate >= 95 ? 'success' : 'warning'}
                            now={t.successRate}
                            label={`${t.successRate}%`}
                            style={{ height: 16, fontSize: 10 }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Capabilities */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm mb-3">
            <Card.Header className="bg-white fw-semibold border-bottom">
              Resources
              <Badge bg="info" className="ms-2">{resources.length}</Badge>
            </Card.Header>
            <ListGroup variant="flush" style={{ maxHeight: 160, overflowY: 'auto' }}>
              {resources.length === 0 ? (
                <ListGroup.Item className="text-muted small">None loaded yet</ListGroup.Item>
              ) : resources.map((r, i) => (
                <ListGroup.Item key={i} className="py-2">
                  <div className="fw-medium" style={{ fontSize: 13 }}>{r.name || r.uri}</div>
                  {r.description && <div className="text-muted" style={{ fontSize: 11 }}>{r.description}</div>}
                  {r.uri && <code style={{ fontSize: 10, color: '#6c757d' }}>{r.uri}</code>}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white fw-semibold border-bottom">
              Prompts
              <Badge bg="purple" className="ms-2" style={{ background: '#6f42c1' }}>{prompts.length}</Badge>
            </Card.Header>
            <ListGroup variant="flush" style={{ maxHeight: 160, overflowY: 'auto' }}>
              {prompts.length === 0 ? (
                <ListGroup.Item className="text-muted small">None loaded yet</ListGroup.Item>
              ) : prompts.map((p, i) => (
                <ListGroup.Item key={i} className="py-2">
                  <div className="fw-medium" style={{ fontSize: 13 }}>{p.name}</div>
                  {p.description && <div className="text-muted" style={{ fontSize: 11 }}>{p.description}</div>}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mb-4">
        {/* Tools with annotations */}
        <Col md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white fw-semibold border-bottom">Registered Tools</Card.Header>
            <ListGroup variant="flush" style={{ maxHeight: 340, overflowY: 'auto' }}>
              {tools.length === 0 ? (
                <ListGroup.Item className="text-muted">No tools loaded yet — is the MCP server running?</ListGroup.Item>
              ) : tools.map((t, i) => (
                <ListGroup.Item key={i} className="py-2">
                  <Row className="align-items-start">
                    <Col>
                      <div className="fw-medium" style={{ fontSize: 13 }}>
                        {t.title || t.name}
                        {t.title && t.name !== t.title && (
                          <code className="ms-2 text-muted" style={{ fontSize: 10 }}>{t.name}</code>
                        )}
                      </div>
                      {t.description && (
                        <div className="text-muted" style={{ fontSize: 11 }}>{t.description}</div>
                      )}
                    </Col>
                    <Col xs="auto" className="d-flex gap-1 flex-wrap justify-content-end">
                      {t.annotations?.readOnlyHint && (
                        <Badge bg="success" style={{ fontSize: 9 }}>read-only</Badge>
                      )}
                      {t.annotations?.destructiveHint && (
                        <Badge bg="danger" style={{ fontSize: 9 }}>destructive</Badge>
                      )}
                      {t.annotations?.idempotentHint && (
                        <Badge bg="secondary" style={{ fontSize: 9 }}>idempotent</Badge>
                      )}
                      {!t.annotations?.readOnlyHint && !t.annotations?.destructiveHint && (
                        <Badge bg="primary" style={{ fontSize: 9 }}>write</Badge>
                      )}
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>

        {/* Recent calls log */}
        <Col md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white fw-semibold border-bottom">
              Recent Activity
              <Badge bg="secondary" className="ms-2">{metrics?.recentCalls?.length ?? 0}</Badge>
            </Card.Header>
            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {(metrics?.recentCalls?.length ?? 0) === 0 ? (
                <div className="p-3 text-muted small text-center">No calls recorded yet.</div>
              ) : (
                <Table hover size="sm" className="mb-0">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th style={{ fontSize: 11 }}>Tool</th>
                      <th style={{ fontSize: 11 }}>Time</th>
                      <th style={{ fontSize: 11 }} className="text-center">Latency</th>
                      <th style={{ fontSize: 11 }} className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(metrics?.recentCalls ?? []).map((call, i) => (
                      <tr key={i}>
                        <td><code style={{ fontSize: 11 }}>{call.tool}</code></td>
                        <td style={{ fontSize: 11 }}>{timeAgo(call.timestamp)}</td>
                        <td className="text-center">
                          <span style={{ fontSize: 11 }}>{call.latencyMs}ms</span>
                        </td>
                        <td className="text-center">
                          {call.success ? (
                            <Badge bg="success" style={{ fontSize: 9 }}>OK</Badge>
                          ) : (
                            <Badge bg="danger" style={{ fontSize: 9 }}>ERR</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <small className="text-muted">
            Auto-refreshes every {POLL_INTERVAL_MS / 1000}s · Backend: {API_BASE} · MCP ITSM v3.0.0
          </small>
        </Col>
      </Row>
    </Container>
  );
}
