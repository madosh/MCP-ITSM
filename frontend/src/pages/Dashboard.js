import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { integrationService, authService } from '../services/api';

const Dashboard = () => {
  const [integrations, setIntegrations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const response = await integrationService.getAllIntegrations();
        setIntegrations(response.data || []);
      } catch (err) {
        setError('Failed to load integrations. ' + (err.message || ''));
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrations();
  }, []);

  // Group integrations by type
  const integrationsByType = integrations.reduce((acc, integration) => {
    const type = integration.type || 'other';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(integration);
    return acc;
  }, {});

  // Count active vs inactive integrations
  const activeIntegrations = integrations.filter(i => i.isActive).length;
  const inactiveIntegrations = integrations.length - activeIntegrations;

  // Count integrations by health status
  const healthStatus = integrations.reduce((acc, integration) => {
    const status = integration.health?.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <h1 className="mb-4">Dashboard</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {loading ? (
        <Alert variant="info">Loading integration data...</Alert>
      ) : (
        <>
          {/* Integration Statistics */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <Card.Title>Total Integrations</Card.Title>
                  <h2>{integrations.length}</h2>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <Card.Title>Active</Card.Title>
                  <h2 className="text-success">{activeIntegrations}</h2>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <Card.Title>Inactive</Card.Title>
                  <h2 className="text-danger">{inactiveIntegrations}</h2>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100">
                <Card.Body>
                  <Card.Title>Health: Healthy</Card.Title>
                  <h2 className="text-success">{healthStatus.healthy || 0}</h2>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* Recent Integrations */}
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Integrations</h5>
                <Link to="/integrations">
                  <Button variant="outline-primary" size="sm">View All</Button>
                </Link>
              </div>
            </Card.Header>
            <Card.Body>
              {integrations.length === 0 ? (
                <Alert variant="info">No integrations found. Create your first integration to get started.</Alert>
              ) : (
                <Row>
                  {integrations.slice(0, 4).map((integration) => (
                    <Col md={6} lg={3} key={integration._id} className="mb-3">
                      <Card>
                        <Card.Body>
                          <Card.Title>{integration.name}</Card.Title>
                          <Card.Subtitle className="mb-2 text-muted">{integration.type}</Card.Subtitle>
                          <Card.Text className="small">
                            {integration.description?.substring(0, 70)}
                            {integration.description?.length > 70 ? '...' : ''}
                          </Card.Text>
                          <div className="d-flex justify-content-between">
                            <span className={`badge ${integration.isActive ? 'bg-success' : 'bg-danger'}`}>
                              {integration.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <Link to={`/integrations/${integration._id}`}>
                              <Button variant="outline-primary" size="sm">View</Button>
                            </Link>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card.Body>
          </Card>
          
          {/* Integrations by Type */}
          {Object.keys(integrationsByType).length > 0 && (
            <Card>
              <Card.Header>
                <h5 className="mb-0">Integrations by Type</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  {Object.entries(integrationsByType).map(([type, integs]) => (
                    <Col md={4} key={type} className="mb-3">
                      <Card>
                        <Card.Body>
                          <Card.Title>{type.charAt(0).toUpperCase() + type.slice(1)}</Card.Title>
                          <Card.Text>
                            <strong>{integs.length}</strong> integration{integs.length !== 1 ? 's' : ''}
                          </Card.Text>
                          <Link to={`/integrations?type=${type}`}>
                            <Button variant="outline-primary" size="sm">View</Button>
                          </Link>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          )}
          
          {/* Create Integration Button for admins and integrators */}
          {(currentUser?.role === 'admin' || currentUser?.role === 'integrator') && (
            <div className="text-center mt-4">
              <Link to="/integrations/create">
                <Button variant="primary">Create New Integration</Button>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard; 