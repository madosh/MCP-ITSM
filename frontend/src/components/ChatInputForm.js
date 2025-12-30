import React from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';

const ChatInputForm = ({
  message,
  setMessage,
  onSubmit,
  selectedSystem,
  loading,
  usingLLM
}) => {
  return (
    <Form onSubmit={onSubmit}>
      <div className="d-flex">
        <Form.Control
          as="textarea"
          rows={2}
          placeholder={
            selectedSystem
              ? usingLLM
                ? 'Describe your issue in natural language...'
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
  );
};

export default ChatInputForm;
