import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Form,
  Table,
  Badge,
  Modal,
  Alert,
  Spinner,
  Tabs,
  Tab,
  InputGroup,
  Dropdown,
  ListGroup,
} from 'react-bootstrap';
import { mcpService } from '../services/mcpService';

const MCPTicketManager = () => {
  const [tickets, setTickets] = useState([]);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [kbResults, setKbResults] = useState([]);
  const [kbQuery, setKbQuery] = useState('');
  const [kbLoading, setKbLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    system: 'jira',
  });

  // Filter state
  const [filters, setFilters] = useState({
    status: 'all',
    system: '',
    limit: 10,
  });

  useEffect(() => {
    loadTools();
    loadTickets();
  }, []);

  useEffect(() => {
    if (filters.status !== 'all' || filters.system) {
      loadTickets();
    }
  }, [filters]);

  const loadTools = async () => {
    try {
      const availableTools = await mcpService.listTools();
      setTools(availableTools);
    } catch (err) {
      console.error('Failed to load tools:', err);
      setError('Failed to connect to MCP server. Make sure the server is running.');
    }
  };

  const loadTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await mcpService.listTickets(filters);
      if (result.success) {
        setTickets(result.tickets || []);
      } else {
        setError(result.error || 'Failed to load tickets');
      }
    } catch (err) {
      setError(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await mcpService.createTicket(
        formData.title,
        formData.description,
        formData.priority,
        formData.system
      );

      if (result.success) {
        setSuccess(`Ticket ${result.ticket.id} created successfully!`);
        setShowCreateModal(false);
        setFormData({
          title: '',
          description: '',
          priority: 'medium',
          system: 'jira',
        });
        loadTickets();
      } else {
        setError(result.error || 'Failed to create ticket');
      }
    } catch (err) {
      setError(err.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = async (ticketId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mcpService.getTicket(ticketId);
      if (result.success) {
        setSelectedTicket(result.ticket);
        setShowTicketModal(true);
      } else {
        setError(result.error || 'Failed to load ticket');
      }
    } catch (err) {
      setError(err.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicket = async (ticketId, updates) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mcpService.updateTicket(ticketId, updates);
      if (result.success) {
        setSuccess(`Ticket ${ticketId} updated successfully!`);
        setShowTicketModal(false);
        loadTickets();
      } else {
        setError(result.error || 'Failed to update ticket');
      }
    } catch (err) {
      setError(err.message || 'Failed to update ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchKB = async () => {
    if (!kbQuery.trim()) return;

    setKbLoading(true);
    setError(null);
    try {
      const result = await mcpService.searchKnowledgeBase(kbQuery, 5);
      if (result.success) {
        setKbResults(result.articles || []);
      } else {
        setError(result.error || 'Failed to search knowledge base');
      }
    } catch (err) {
      setError(err.message || 'Failed to search knowledge base');
    } finally {
      setKbLoading(false);
    }
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      critical: 'danger',
      high: 'warning',
      medium: 'info',
      low: 'secondary',
    };
    return <Badge bg={variants[priority] || 'secondary'}>{priority}</Badge>;
  };

  const getStatusBadge = (status) => {
    const variants = {
      open: 'primary',
      in_progress: 'warning',
      resolved: 'success',
      closed: 'secondary',
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getSystemBadge = (system) => {
    const colors = {
      jira: 'primary',
      servicenow: 'info',
      zendesk: 'success',
      ivanti_neurons: 'warning',
      cherwell: 'dark',
    };
    return <Badge bg={colors[system] || 'secondary'}>{system}</Badge>;
  };

  return (
    <div className="mcp-ticket-manager">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>MCP Ticket Manager</h1>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <i className="bi bi-plus-circle me-2"></i>
          Create Ticket
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Tabs defaultActiveKey="tickets" className="mb-4">
        <Tab eventKey="tickets" title="Tickets">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Ticket List</h5>
              <div className="d-flex gap-2">
                <Form.Select
                  style={{ width: 'auto' }}
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </Form.Select>
                <Form.Select
                  style={{ width: 'auto' }}
                  value={filters.system}
                  onChange={(e) => setFilters({ ...filters, system: e.target.value })}
                >
                  <option value="">All Systems</option>
                  <option value="jira">Jira</option>
                  <option value="servicenow">ServiceNow</option>
                  <option value="zendesk">Zendesk</option>
                  <option value="ivanti_neurons">Ivanti Neurons</option>
                  <option value="cherwell">Cherwell</option>
                </Form.Select>
                <Button variant="outline-primary" size="sm" onClick={loadTickets}>
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Refresh
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Loading tickets...</p>
                </div>
              ) : tickets.length === 0 ? (
                <Alert variant="info">No tickets found. Create your first ticket to get started.</Alert>
              ) : (
                <Table striped hover responsive>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>System</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>
                          <code>{ticket.id}</code>
                        </td>
                        <td>{ticket.title}</td>
                        <td>{getSystemBadge(ticket.system)}</td>
                        <td>{getPriorityBadge(ticket.priority)}</td>
                        <td>{getStatusBadge(ticket.status)}</td>
                        <td>{new Date(ticket.created_at).toLocaleDateString()}</td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleViewTicket(ticket.id)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="knowledge" title="Knowledge Base">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Knowledge Base Search</h5>
            </Card.Header>
            <Card.Body>
              <InputGroup className="mb-3">
                <Form.Control
                  type="text"
                  placeholder="Search knowledge base articles..."
                  value={kbQuery}
                  onChange={(e) => setKbQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchKB()}
                />
                <Button variant="primary" onClick={handleSearchKB} disabled={kbLoading}>
                  {kbLoading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-search me-2"></i>
                      Search
                    </>
                  )}
                </Button>
              </InputGroup>

              {kbResults.length > 0 && (
                <ListGroup>
                  {kbResults.map((article) => (
                    <ListGroup.Item key={article.id}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">{article.title}</h6>
                          <p className="mb-1 text-muted">{article.summary}</p>
                          <small className="text-muted">ID: {article.id}</small>
                        </div>
                        {article.url && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View
                          </Button>
                        )}
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}

              {kbQuery && kbResults.length === 0 && !kbLoading && (
                <Alert variant="info">No articles found for "{kbQuery}"</Alert>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="tools" title="Available Tools">
          <Card>
            <Card.Header>
              <h5 className="mb-0">MCP Tools</h5>
            </Card.Header>
            <Card.Body>
              {tools.length === 0 ? (
                <Alert variant="warning">No tools available. Make sure the MCP server is running.</Alert>
              ) : (
                <ListGroup>
                  {tools.map((tool) => (
                    <ListGroup.Item key={tool.name}>
                      <div>
                        <h6 className="mb-1">
                          <code>{tool.name}</code>
                        </h6>
                        <p className="mb-1 text-muted">{tool.description}</p>
                        {tool.inputSchema && tool.inputSchema.properties && (
                          <div className="mt-2">
                            <small className="text-muted">
                              <strong>Parameters:</strong>{' '}
                              {Object.keys(tool.inputSchema.properties).join(', ')}
                            </small>
                          </div>
                        )}
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Create Ticket Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Ticket</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateTicket}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter ticket title"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter detailed description"
              />
            </Form.Group>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Priority</Form.Label>
                  <Form.Select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>System</Form.Label>
                  <Form.Select
                    value={formData.system}
                    onChange={(e) => setFormData({ ...formData, system: e.target.value })}
                  >
                    <option value="jira">Jira</option>
                    <option value="servicenow">ServiceNow</option>
                    <option value="zendesk">Zendesk</option>
                    <option value="ivanti_neurons">Ivanti Neurons</option>
                    <option value="cherwell">Cherwell</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Creating...
                </>
              ) : (
                'Create Ticket'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Ticket Detail Modal */}
      <Modal show={showTicketModal} onHide={() => setShowTicketModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Ticket Details: {selectedTicket?.id}
            {selectedTicket && getSystemBadge(selectedTicket.system)}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTicket && (
            <>
              <div className="mb-3">
                <h6>Title</h6>
                <p>{selectedTicket.title}</p>
              </div>
              <div className="mb-3">
                <h6>Description</h6>
                <p>{selectedTicket.description}</p>
              </div>
              <div className="row mb-3">
                <div className="col-md-4">
                  <h6>Priority</h6>
                  {getPriorityBadge(selectedTicket.priority)}
                </div>
                <div className="col-md-4">
                  <h6>Status</h6>
                  {getStatusBadge(selectedTicket.status)}
                </div>
                <div className="col-md-4">
                  <h6>Assignee</h6>
                  <p>{selectedTicket.assignee || 'Unassigned'}</p>
                </div>
              </div>
              {selectedTicket.comments && selectedTicket.comments.length > 0 && (
                <div className="mb-3">
                  <h6>Comments</h6>
                  <ListGroup>
                    {selectedTicket.comments.map((comment, idx) => (
                      <ListGroup.Item key={idx}>
                        <div className="d-flex justify-content-between">
                          <span>{comment.text}</span>
                          <small className="text-muted">
                            {new Date(comment.created_at).toLocaleString()}
                          </small>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTicketModal(false)}>
            Close
          </Button>
          {selectedTicket && selectedTicket.status !== 'closed' && (
            <>
              <Button
                variant="warning"
                onClick={() =>
                  handleUpdateTicket(selectedTicket.id, { status: 'in_progress' })
                }
                disabled={loading}
              >
                Mark In Progress
              </Button>
              <Button
                variant="success"
                onClick={() => handleUpdateTicket(selectedTicket.id, { status: 'resolved' })}
                disabled={loading}
              >
                Resolve
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MCPTicketManager;

