import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, Alert, Dropdown, Badge, ListGroup, Spinner, Tabs, Tab } from 'react-bootstrap';
import { integrationService } from '../services/api';
import { ticketService } from '../services/ticketService';
import { llmService } from '../services/llmService'; // New LLM service

const LLMChatClient = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingLLM, setUsingLLM] = useState(true); // Default to using LLM
  const [extractedTicketData, setExtractedTicketData] = useState(null);
  const [conversationContext, setConversationContext] = useState(null);
  const chatEndRef = useRef(null);

  // Fetch available integrations on component mount
  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        setLoading(true);
        const data = await integrationService.getAllIntegrations();
        
        // Filter for ServiceNow, Jira, and Zendesk integrations
        const filteredIntegrations = data.filter(
          integration => ['servicenow', 'jira', 'zendesk'].includes(integration.type)
        );
        
        setIntegrations(filteredIntegrations);
        
        if (filteredIntegrations.length > 0) {
          setSelectedSystem(filteredIntegrations[0]);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load integrations. Please try again.');
        setLoading(false);
      }
    };

    fetchIntegrations();
    
    // Initialize conversation context
    setConversationContext({
      conversationId: generateConversationId(),
      messages: [],
      metadata: {
        userId: localStorage.getItem('userId') || 'unknown',
        userRole: JSON.parse(localStorage.getItem('user'))?.role || 'user',
        timestamp: new Date().toISOString()
      }
    });
  }, []);

  // Auto-scroll to bottom of chat when history changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Generate a unique conversation ID
  const generateConversationId = () => {
    return 'conv_' + Math.random().toString(36).substring(2, 15);
  };

  // Handle system selection from dropdown
  const handleSelectSystem = (integration) => {
    setSelectedSystem(integration);
    
    // Add system change message to chat
    setChatHistory(prev => [
      ...prev, 
      { 
        sender: 'system', 
        content: `Switched to ${integration.name} (${integration.type})`,
        timestamp: new Date()
      }
    ]);
    
    // Update conversation context with system selection
    if (conversationContext) {
      setConversationContext({
        ...conversationContext,
        metadata: {
          ...conversationContext.metadata,
          selectedSystem: integration.type,
          systemId: integration.id
        }
      });
    }
  };

  // Handle message submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || !selectedSystem) return;
    
    // Add user message to chat history
    const userMessage = {
      sender: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    
    // Update conversation context
    if (conversationContext) {
      const updatedContext = {
        ...conversationContext,
        messages: [
          ...conversationContext.messages,
          {
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
          }
        ]
      };
      setConversationContext(updatedContext);
    }
    
    setMessage('');
    
    try {
      setLoading(true);
      
      // Add thinking indicator
      setChatHistory(prev => [
        ...prev, 
        { 
          sender: 'system', 
          content: `${usingLLM ? 'AI Assistant processing' : 'Processing request for'} ${selectedSystem.name}...`,
          timestamp: new Date(),
          isProcessing: true
        }
      ]);
      
      if (usingLLM) {
        // Process with LLM first
        const llmResponse = await llmService.processTicketRequest(
          message,
          selectedSystem.type,
          conversationContext
        );
        
        // Update conversation context with LLM response
        const updatedContext = {
          ...conversationContext,
          messages: [
            ...conversationContext.messages,
            {
              role: 'assistant',
              content: llmResponse.message,
              timestamp: new Date().toISOString()
            }
          ],
          extractedData: llmResponse.extractedData
        };
        setConversationContext(updatedContext);
        
        // Show LLM's understanding of the ticket
        setChatHistory(prev => {
          const filtered = prev.filter(msg => !msg.isProcessing);
          return [
            ...filtered,
            {
              sender: 'bot',
              content: llmResponse.message,
              timestamp: new Date(),
              isLLMResponse: true
            }
          ];
        });
        
        // Set extracted ticket data for review
        setExtractedTicketData(llmResponse.extractedData);
        
        // If confirm is false, wait for user to confirm before creating ticket
        if (!llmResponse.confirmCreate) {
          setLoading(false);
          return;
        }
        
        // If confirmCreate is true, proceed with ticket creation using extracted data
        const ticketData = {
          summary: llmResponse.extractedData.summary,
          description: llmResponse.extractedData.description,
          priority: llmResponse.extractedData.priority || 'medium',
          category: llmResponse.extractedData.category || 'question',
          source: 'llm-chat'
        };
        
        // Create the ticket
        const ticketResponse = await ticketService.createTicket(
          selectedSystem.id,
          ticketData
        );
        
        // Show ticket creation confirmation
        setChatHistory(prev => [
          ...prev,
          {
            sender: 'bot',
            content: `✅ Ticket created successfully in ${selectedSystem.name}!`,
            ticketId: ticketResponse.ticketId,
            ticketUrl: ticketResponse.ticketUrl,
            timestamp: new Date()
          }
        ]);
      } else {
        // Traditional direct ticket creation
        const response = await ticketService.createTicket(
          selectedSystem.id,
          {
            summary: message.split('\n')[0] || 'New ticket from chat',
            description: message,
            priority: 'medium',
            source: 'chat'
          }
        );
        
        // Remove processing message and add response
        setChatHistory(prev => {
          const filtered = prev.filter(msg => !msg.isProcessing);
          return [
            ...filtered,
            {
              sender: 'bot',
              content: `✅ Ticket created successfully in ${selectedSystem.name}!`,
              ticketId: response.ticketId,
              ticketUrl: response.ticketUrl,
              timestamp: new Date()
            }
          ];
        });
      }
      
    } catch (err) {
      // Remove processing message and add error
      setChatHistory(prev => {
        const filtered = prev.filter(msg => !msg.isProcessing);
        return [
          ...filtered,
          {
            sender: 'bot',
            content: `❌ Failed to ${usingLLM ? 'process with AI or create' : 'create'} ticket: ${err.message || 'Unknown error'}`,
            isError: true,
            timestamp: new Date()
          }
        ];
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle creating ticket from extracted data
  const handleCreateExtractedTicket = async () => {
    if (!extractedTicketData || !selectedSystem) return;
    
    try {
      setLoading(true);
      
      // Add processing message
      setChatHistory(prev => [
        ...prev, 
        { 
          sender: 'system', 
          content: `Creating ticket in ${selectedSystem.name}...`,
          timestamp: new Date(),
          isProcessing: true
        }
      ]);
      
      // Create ticket with extracted data
      const ticketData = {
        summary: extractedTicketData.summary,
        description: extractedTicketData.description,
        priority: extractedTicketData.priority || 'medium',
        category: extractedTicketData.category || 'question',
        source: 'llm-chat'
      };
      
      const response = await ticketService.createTicket(
        selectedSystem.id,
        ticketData
      );
      
      // Clear extracted data
      setExtractedTicketData(null);
      
      // Add confirmation message
      setChatHistory(prev => {
        const filtered = prev.filter(msg => !msg.isProcessing);
        return [
          ...filtered,
          {
            sender: 'bot',
            content: `✅ Ticket created successfully in ${selectedSystem.name}!`,
            ticketId: response.ticketId,
            ticketUrl: response.ticketUrl,
            timestamp: new Date()
          }
        ];
      });
      
    } catch (err) {
      setChatHistory(prev => {
        const filtered = prev.filter(msg => !msg.isProcessing);
        return [
          ...filtered,
          {
            sender: 'bot',
            content: `❌ Failed to create ticket: ${err.message || 'Unknown error'}`,
            isError: true,
            timestamp: new Date()
          }
        ];
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle LLM mode toggle
  const handleToggleLLM = () => {
    setUsingLLM(!usingLLM);
    setChatHistory(prev => [
      ...prev, 
      { 
        sender: 'system', 
        content: `Switched to ${!usingLLM ? 'AI-assisted' : 'direct'} ticket creation mode`,
        timestamp: new Date()
      }
    ]);
  };

  // Render message based on sender
  const renderMessage = (msg, index) => {
    const isUser = msg.sender === 'user';
    const isSystem = msg.sender === 'system';
    const isError = msg.isError;
    const isLLMResponse = msg.isLLMResponse;
    
    return (
      <div 
        key={index} 
        className={`d-flex ${isUser ? 'justify-content-end' : 'justify-content-start'} mb-2`}
      >
        <div 
          className={`
            p-3 rounded-3 
            ${isUser ? 'bg-primary text-white' : ''} 
            ${isSystem ? 'bg-light text-muted font-italic small' : ''} 
            ${isError ? 'bg-danger text-white' : ''} 
            ${isLLMResponse ? 'bg-info text-white' : ''}
            ${!isUser && !isSystem && !isError && !isLLMResponse ? 'bg-light border' : ''}
            ${msg.isProcessing ? 'bg-light text-muted fst-italic' : ''}
          `}
          style={{ maxWidth: '75%' }}
        >
          <div>
            {isLLMResponse && (
              <div className="mb-2">
                <Badge bg="light" text="dark" className="me-2">AI Assistant</Badge>
              </div>
            )}
            {msg.content}
          </div>
          
          {msg.ticketId && (
            <div className="mt-2">
              <Badge bg="success" className="me-2">ID: {msg.ticketId}</Badge>
              {msg.ticketUrl && (
                <a 
                  href={msg.ticketUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-white text-decoration-underline"
                >
                  View Ticket
                </a>
              )}
            </div>
          )}
          
          <small className="d-block mt-1 text-end opacity-75">
            {msg.timestamp.toLocaleTimeString()}
          </small>
        </div>
      </div>
    );
  };

  // Render extracted ticket data review
  const renderExtractedTicketData = () => {
    if (!extractedTicketData) return null;
    
    return (
      <Card className="mt-3 border-info">
        <Card.Header className="bg-info text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">AI-Extracted Ticket Information</h6>
            <Button 
              size="sm" 
              variant="light" 
              onClick={() => setExtractedTicketData(null)}
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
              <strong>Priority:</strong> <Badge bg={getPriorityBadgeColor(extractedTicketData.priority)}>{extractedTicketData.priority || 'medium'}</Badge>
            </div>
            <div>
              <strong>Category:</strong> <Badge bg="secondary">{extractedTicketData.category || 'question'}</Badge>
            </div>
          </div>
          <div className="d-flex justify-content-end">
            <Button 
              variant="outline-secondary" 
              size="sm" 
              className="me-2"
              onClick={() => setExtractedTicketData(null)}
            >
              Refine
            </Button>
            <Button 
              variant="success" 
              size="sm"
              onClick={handleCreateExtractedTicket}
              disabled={loading}
            >
              Create Ticket
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  };

  // Get badge color for priority
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

  return (
    <div className="llm-chat-client">
      <h1 className="mb-4">ITSM AI-Assisted Chat Client</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center bg-light">
          <div className="d-flex align-items-center">
            <h5 className="mb-0 me-3">Ticket Creation Chat</h5>
            <Badge 
              bg={usingLLM ? 'info' : 'secondary'} 
              className="cursor-pointer" 
              onClick={handleToggleLLM}
              style={{ cursor: 'pointer' }}
            >
              {usingLLM ? 'AI-Assisted Mode' : 'Direct Mode'}
            </Badge>
          </div>
          
          <Dropdown>
            <Dropdown.Toggle 
              variant={selectedSystem ? `outline-${getSystemColor(selectedSystem.type)}` : 'outline-secondary'} 
              id="dropdown-basic"
              disabled={loading || integrations.length === 0}
            >
              {selectedSystem ? selectedSystem.name : 'Select System'}
            </Dropdown.Toggle>

            <Dropdown.Menu>
              {integrations.map(integration => (
                <Dropdown.Item 
                  key={integration.id} 
                  onClick={() => handleSelectSystem(integration)}
                  active={selectedSystem?.id === integration.id}
                >
                  <div className="d-flex align-items-center">
                    <div 
                      className={`bg-${getSystemColor(integration.type)} rounded-circle me-2`} 
                      style={{ width: '10px', height: '10px' }}
                    ></div>
                    {integration.name}
                    <small className="ms-2 text-muted">({integration.type})</small>
                  </div>
                </Dropdown.Item>
              ))}
              
              {integrations.length === 0 && (
                <Dropdown.Item disabled>No ITSM integrations found</Dropdown.Item>
              )}
            </Dropdown.Menu>
          </Dropdown>
        </Card.Header>
        
        <Card.Body className="p-0">
          <div className="chat-messages p-3" style={{ height: '400px', overflowY: 'auto' }}>
            {chatHistory.length === 0 ? (
              <div className="text-center text-muted my-5">
                <p>No messages yet.</p>
                <p>{usingLLM 
                  ? 'Describe your issue in natural language and the AI will help create a ticket.' 
                  : 'Type a message below to create a ticket in the selected ITSM system.'}
                </p>
              </div>
            ) : (
              <div className="message-container">
                {chatHistory.map(renderMessage)}
                {renderExtractedTicketData()}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
        </Card.Body>
        
        <Card.Footer className="bg-light">
          <Form onSubmit={handleSubmit}>
            <div className="d-flex">
              <Form.Control
                as="textarea"
                rows={2}
                placeholder={
                  selectedSystem 
                    ? usingLLM 
                      ? `Describe your issue in natural language...` 
                      : `Type message to create a ticket in ${selectedSystem.name}...`
                    : 'Select a system first'
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={!selectedSystem || loading}
                className="me-2"
                style={{ resize: 'none' }}
              />
              <Button 
                type="submit" 
                variant={usingLLM ? "info" : "primary"} 
                disabled={!selectedSystem || !message.trim() || loading}
                className="align-self-end d-flex align-items-center"
              >
                {loading && <Spinner as="span" animation="border" size="sm" className="me-2" />}
                {usingLLM ? 'Ask AI' : 'Send'}
              </Button>
            </div>
          </Form>
        </Card.Footer>
      </Card>
      
      <Card className="mt-4 shadow-sm">
        <Card.Header className="bg-light">
          <h5 className="mb-0">About AI-Assisted Ticket Creation</h5>
        </Card.Header>
        <Card.Body>
          <Tabs defaultActiveKey="overview" className="mb-3">
            <Tab eventKey="overview" title="Overview">
              <p>
                This enhanced chat interface uses AI-powered language models to process natural language descriptions
                and automatically extract ticket information. The AI assistant can understand context, categorize issues,
                and create well-structured tickets across multiple ITSM systems.
              </p>
              
              <h6>Key Features:</h6>
              <ListGroup variant="flush" className="border-top border-bottom mb-3">
                <ListGroup.Item>• Natural language understanding using advanced LLMs</ListGroup.Item>
                <ListGroup.Item>• Automated extraction of ticket summary, description, and priority</ListGroup.Item>
                <ListGroup.Item>• Context-aware conversations using the Model Context Protocol</ListGroup.Item>
                <ListGroup.Item>• Support for creating tickets in ServiceNow, Jira, and Zendesk</ListGroup.Item>
                <ListGroup.Item>• Option to review AI-extracted information before ticket creation</ListGroup.Item>
              </ListGroup>
            </Tab>
            <Tab eventKey="usage" title="How to Use">
              <h6>Using the AI-Assisted Mode:</h6>
              <ListGroup variant="flush" className="border-top border-bottom mb-3">
                <ListGroup.Item>1. Make sure "AI-Assisted Mode" is enabled (blue badge)</ListGroup.Item>
                <ListGroup.Item>2. Select your target ITSM system from the dropdown</ListGroup.Item>
                <ListGroup.Item>3. Describe your issue in natural language</ListGroup.Item>
                <ListGroup.Item>4. The AI will process your description and extract ticket details</ListGroup.Item>
                <ListGroup.Item>5. Review the extracted information and create the ticket</ListGroup.Item>
              </ListGroup>
              
              <h6>Example Phrases You Can Use:</h6>
              <ListGroup variant="flush" className="border-top border-bottom mb-3">
                <ListGroup.Item><em>"I can't access the company portal since this morning. It shows a 503 error."</em></ListGroup.Item>
                <ListGroup.Item><em>"The printer on the 3rd floor is out of toner and needs replacement urgently."</em></ListGroup.Item>
                <ListGroup.Item><em>"Need to request access to the marketing database for the new team member Sarah."</em></ListGroup.Item>
              </ListGroup>
            </Tab>
            <Tab eventKey="technical" title="Technical Info">
              <p>
                This interface demonstrates the integration of the Model Context Protocol with our ITSM Integration Platform.
                It uses language models to process natural language and the Model Context Protocol to maintain conversation
                context and state.
              </p>
              
              <h6>Technical Components:</h6>
              <ListGroup variant="flush" className="border-top border-bottom mb-3">
                <ListGroup.Item>• <strong>Model Context Protocol:</strong> Manages conversation state and context</ListGroup.Item>
                <ListGroup.Item>• <strong>LLM Service:</strong> Processes natural language through language models</ListGroup.Item>
                <ListGroup.Item>• <strong>ITSM Adapters:</strong> Connect to different ITSM systems via unified API</ListGroup.Item>
                <ListGroup.Item>• <strong>Multi-Channel Platform:</strong> Provides foundational infrastructure</ListGroup.Item>
              </ListGroup>
              
              <p className="mb-0 text-muted">
                <small>For more technical details, see the documentation in <code>docs/llm_enabled_tickets.md</code></small>
              </p>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </div>
  );
};

// Helper function to get system color
const getSystemColor = (systemType) => {
  switch (systemType) {
    case 'servicenow':
      return 'info';
    case 'jira':
      return 'primary';
    case 'zendesk':
      return 'success';
    default:
      return 'secondary';
  }
};

export default LLMChatClient; 