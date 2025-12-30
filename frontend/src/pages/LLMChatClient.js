import React, { useState, useEffect, useRef } from 'react';
import { Card, Alert, Dropdown, Badge, ListGroup, Tabs, Tab } from 'react-bootstrap';
import { integrationService } from '../services/api';
import { ticketService } from '../services/ticketService';
import { llmService } from '../services/llmService';
import ChatMessageList from '../components/ChatMessageList';
import ChatInputForm from '../components/ChatInputForm';
import TicketPreviewPanel from '../components/TicketPreviewPanel';
import { useChatHistory } from '../hooks/useChatHistory';
import { useConversationContext } from '../hooks/useConversationContext';

const SYSTEM_COLORS = {
  servicenow: 'info',
  jira: 'primary',
  zendesk: 'success',
  default: 'secondary'
};

const getSystemColor = (systemType) => SYSTEM_COLORS[systemType] || SYSTEM_COLORS.default;

const LLMChatClient = () => {
  const [message, setMessage] = useState('');
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingLLM, setUsingLLM] = useState(true);
  const [extractedTicketData, setExtractedTicketData] = useState(null);
  const chatEndRef = useRef(null);

  const {
    chatHistory,
    addMessage,
    addSystemMessage,
    addProcessingMessage,
    removeProcessingMessages
  } = useChatHistory();

  const {
    conversationContext,
    initializeContext,
    addUserMessage,
    addAssistantMessage,
    updateSystemSelection
  } = useConversationContext();

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
    initializeContext();
  }, [initializeContext]);

  // Auto-scroll to bottom of chat when history changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Handle system selection from dropdown
  const handleSelectSystem = (integration) => {
    setSelectedSystem(integration);
    addSystemMessage(`Switched to ${integration.name} (${integration.type})`);

    if (conversationContext) {
      updateSystemSelection(integration.type, integration.id);
    }
  };

  // Handle message submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim() || !selectedSystem) return;

    // Add user message to chat history
    addMessage({
      sender: 'user',
      content: message,
      timestamp: new Date()
    });

    // Update conversation context
    if (conversationContext) {
      addUserMessage(message);
    }

    const userMessage = message;
    setMessage('');

    try {
      setLoading(true);
      addProcessingMessage(
        `${usingLLM ? 'AI Assistant processing' : 'Processing request for'} ${selectedSystem.name}...`
      );

      if (usingLLM) {
        // Process with LLM first
        const llmResponse = await llmService.processTicketRequest(
          userMessage,
          selectedSystem.type,
          conversationContext
        );

        // Update conversation context with LLM response
        addAssistantMessage(llmResponse.message, llmResponse.extractedData);

        // Show LLM's understanding of the ticket
        removeProcessingMessages();
        addMessage({
          sender: 'bot',
          content: llmResponse.message,
          timestamp: new Date(),
          isLLMResponse: true
        });

        // Set extracted ticket data for review
        setExtractedTicketData(llmResponse.extractedData);

        // If confirm is false, wait for user to confirm before creating ticket
        if (!llmResponse.confirmCreate) {
          setLoading(false);
          return;
        }

        // If confirmCreate is true, proceed with ticket creation using extracted data
        await createTicketFromExtractedData(llmResponse.extractedData);
      } else {
        // Traditional direct ticket creation
        const response = await ticketService.createTicket(
          selectedSystem.id,
          {
            summary: userMessage.split('\n')[0] || 'New ticket from chat',
            description: userMessage,
            priority: 'medium',
            source: 'chat'
          }
        );

        removeProcessingMessages();
        addMessage({
          sender: 'bot',
          content: `✅ Ticket created successfully in ${selectedSystem.name}!`,
          ticketId: response.ticketId,
          ticketUrl: response.ticketUrl,
          timestamp: new Date()
        });
      }
    } catch (err) {
      removeProcessingMessages();
      addMessage({
        sender: 'bot',
        content: `❌ Failed to ${usingLLM ? 'process with AI or create' : 'create'} ticket: ${err.message || 'Unknown error'}`,
        isError: true,
        timestamp: new Date()
      });
    } finally {
      setLoading(false);
    }
  };

  // Create ticket from extracted data
  const createTicketFromExtractedData = async (ticketData) => {
    const data = {
      summary: ticketData.summary,
      description: ticketData.description,
      priority: ticketData.priority || 'medium',
      category: ticketData.category || 'question',
      source: 'llm-chat'
    };

    const response = await ticketService.createTicket(selectedSystem.id, data);

    addMessage({
      sender: 'bot',
      content: `✅ Ticket created successfully in ${selectedSystem.name}!`,
      ticketId: response.ticketId,
      ticketUrl: response.ticketUrl,
      timestamp: new Date()
    });
  };

  // Handle creating ticket from extracted data
  const handleCreateExtractedTicket = async () => {
    if (!extractedTicketData || !selectedSystem) return;

    try {
      setLoading(true);
      addProcessingMessage(`Creating ticket in ${selectedSystem.name}...`);

      await createTicketFromExtractedData(extractedTicketData);
      setExtractedTicketData(null);
      removeProcessingMessages();
    } catch (err) {
      removeProcessingMessages();
      addMessage({
        sender: 'bot',
        content: `❌ Failed to create ticket: ${err.message || 'Unknown error'}`,
        isError: true,
        timestamp: new Date()
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle LLM mode toggle
  const handleToggleLLM = () => {
    setUsingLLM(!usingLLM);
    addSystemMessage(`Switched to ${!usingLLM ? 'AI-assisted' : 'direct'} ticket creation mode`);
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
              <>
                <ChatMessageList chatHistory={chatHistory} chatEndRef={chatEndRef} />
                <TicketPreviewPanel
                  extractedTicketData={extractedTicketData}
                  onDismiss={() => setExtractedTicketData(null)}
                  onCreateTicket={handleCreateExtractedTicket}
                  loading={loading}
                />
              </>
            )}
          </div>
        </Card.Body>

        <Card.Footer className="bg-light">
          <ChatInputForm
            message={message}
            setMessage={setMessage}
            onSubmit={handleSubmit}
            selectedSystem={selectedSystem}
            loading={loading}
            usingLLM={usingLLM}
          />
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

export default LLMChatClient;
