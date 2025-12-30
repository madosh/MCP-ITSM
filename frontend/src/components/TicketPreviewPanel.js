import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';

const getPriorityBadgeColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high':
    case 'urgent':
      return 'danger';
    case 'medium':
    case 'normal':
      return 'warning';
    case 'low':
      return 'info';
    default:
      return 'secondary';
  }
};

const TicketPreviewPanel = ({
  extractedTicketData,
  onDismiss,
  onCreateTicket,
  loading
}) => {
  if (!extractedTicketData) return null;

  return (
    <Card className="mt-3 border-info">
      <Card.Header className="bg-info text-white">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">AI-Extracted Ticket Information</h6>
          <Button
            size="sm"
            variant="light"
            onClick={onDismiss}
          >
            Dismiss
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="mb-3">
          <strong>Summary:</strong> {extractedTicketData.summary}
        </div>
        <div className="mb-3">
          <strong>Description:</strong>
          <pre className="bg-light p-2 rounded mt-1" style={{ whiteSpace: 'pre-wrap' }}>
            {extractedTicketData.description}
          </pre>
        </div>
        <div className="mb-3 d-flex gap-3">
          <div>
            <strong>Priority:</strong>{' '}
            <Badge bg={getPriorityBadgeColor(extractedTicketData.priority)}>
              {extractedTicketData.priority || 'medium'}
            </Badge>
          </div>
          <div>
            <strong>Category:</strong>{' '}
            <Badge bg="secondary">{extractedTicketData.category || 'question'}</Badge>
          </div>
        </div>
        <div className="d-flex justify-content-end">
          <Button
            variant="outline-secondary"
            size="sm"
            className="me-2"
            onClick={onDismiss}
          >
            Refine
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={onCreateTicket}
            disabled={loading}
          >
            Create Ticket
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default TicketPreviewPanel;
