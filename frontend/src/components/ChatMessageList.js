import React from 'react';
import { Badge } from 'react-bootstrap';

const ChatMessageList = ({ chatHistory, chatEndRef }) => {
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

  if (chatHistory.length === 0) {
    return null;
  }

  return (
    <div className="message-container">
      {chatHistory.map(renderMessage)}
      <div ref={chatEndRef} />
    </div>
  );
};

export default ChatMessageList;
