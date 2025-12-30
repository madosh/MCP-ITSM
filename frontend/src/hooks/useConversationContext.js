import { useState, useCallback } from 'react';

const generateConversationId = () => {
  return 'conv_' + Math.random().toString(36).substring(2, 15);
};

export const useConversationContext = () => {
  const [conversationContext, setConversationContext] = useState(null);

  const initializeContext = useCallback(() => {
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

  const addUserMessage = useCallback((content) => {
    setConversationContext(prev => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          role: 'user',
          content,
          timestamp: new Date().toISOString()
        }
      ]
    }));
  }, []);

  const addAssistantMessage = useCallback((content, extractedData = null) => {
    setConversationContext(prev => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          role: 'assistant',
          content,
          timestamp: new Date().toISOString()
        }
      ],
      ...(extractedData && { extractedData })
    }));
  }, []);

  const updateSystemSelection = useCallback((systemType, systemId) => {
    setConversationContext(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        selectedSystem: systemType,
        systemId
      }
    }));
  }, []);

  return {
    conversationContext,
    initializeContext,
    addUserMessage,
    addAssistantMessage,
    updateSystemSelection
  };
};
