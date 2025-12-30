import { useState, useCallback } from 'react';

export const useChatHistory = () => {
  const [chatHistory, setChatHistory] = useState([]);

  const addMessage = useCallback((message) => {
    setChatHistory(prev => [...prev, message]);
  }, []);

  const addSystemMessage = useCallback((content) => {
    setChatHistory(prev => [
      ...prev,
      {
        sender: 'system',
        content,
        timestamp: new Date()
      }
    ]);
  }, []);

  const addProcessingMessage = useCallback((content) => {
    setChatHistory(prev => [
      ...prev,
      {
        sender: 'system',
        content,
        timestamp: new Date(),
        isProcessing: true
      }
    ]);
  }, []);

  const removeProcessingMessages = useCallback(() => {
    setChatHistory(prev => prev.filter(msg => !msg.isProcessing));
  }, []);

  const clearHistory = useCallback(() => {
    setChatHistory([]);
  }, []);

  return {
    chatHistory,
    addMessage,
    addSystemMessage,
    addProcessingMessage,
    removeProcessingMessages,
    clearHistory
  };
};
