import API from './api';

// Simulated response for development/demo purposes
const SIMULATED_MODE = true;

export const llmService = {
  // Process a ticket request through LLM
  processTicketRequest: async (userMessage, systemType, conversationContext) => {
    try {
      // If in simulated mode, return a mock response
      if (SIMULATED_MODE) {
        return simulateProcessTicketRequest(userMessage, systemType, conversationContext);
      }
      
      // In production, make an actual API call to the LLM processing service
      const response = await API.post('/api/llm/process-ticket', {
        message: userMessage,
        systemType,
        context: conversationContext
      });
      
      return response.data;
    } catch (error) {
      throw error?.response?.data || { message: 'Failed to process with AI' };
    }
  },
  
  // Get ticket suggestions based on message content
  getTicketSuggestions: async (message) => {
    try {
      if (SIMULATED_MODE) {
        return simulateGetTicketSuggestions(message);
      }
      
      const response = await API.post('/api/llm/ticket-suggestions', { message });
      return response.data;
    } catch (error) {
      throw error?.response?.data || { message: 'Failed to get ticket suggestions' };
    }
  },
  
  // Translate a message to structured ticket format
  translateToTicket: async (message, systemType) => {
    try {
      if (SIMULATED_MODE) {
        return simulateTranslateToTicket(message, systemType);
      }
      
      const response = await API.post('/api/llm/translate-ticket', { 
        message, 
        systemType 
      });
      return response.data;
    } catch (error) {
      throw error?.response?.data || { message: 'Failed to translate message to ticket' };
    }
  }
};

// Simulate processing a ticket request (for demo/development)
const simulateProcessTicketRequest = (userMessage, systemType, context) => {
  console.log('Simulating LLM processing with context:', context);
  
  // Wait for a realistic delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // Extract key information from the message
      const lowerMessage = userMessage.toLowerCase();
      let priority = 'medium';
      let category = 'question';
      
      // Simple rule-based priority detection
      if (lowerMessage.includes('urgent') || 
          lowerMessage.includes('emergency') || 
          lowerMessage.includes('critical') ||
          lowerMessage.includes('immediately')) {
        priority = 'high';
      } else if (lowerMessage.includes('low priority') || 
                lowerMessage.includes('when you have time') ||
                lowerMessage.includes('not urgent')) {
        priority = 'low';
      }
      
      // Simple rule-based category detection
      if (lowerMessage.includes('access') || 
          lowerMessage.includes('login') || 
          lowerMessage.includes('permission')) {
        category = 'access';
      } else if (lowerMessage.includes('broken') || 
                lowerMessage.includes('not working') || 
                lowerMessage.includes('error') ||
                lowerMessage.includes('down')) {
        category = 'incident';
      } else if (lowerMessage.includes('how') || 
                lowerMessage.includes('help with') || 
                lowerMessage.includes('guide')) {
        category = 'question';
      } else if (lowerMessage.includes('request') || 
                lowerMessage.includes('need') || 
                lowerMessage.includes('please provide')) {
        category = 'request';
      }
      
      // Generate a summary (first sentence or first 60 chars)
      let summary = userMessage.split('.')[0];
      if (summary.length > 60) {
        summary = summary.substring(0, 57) + '...';
      }
      
      // Generate a response based on the extracted information
      let message = '';
      if (priority === 'high') {
        message = `I'll create a high-priority ticket for you right away. Based on your description, this appears to be a ${category} that needs urgent attention.`;
      } else if (priority === 'low') {
        message = `I'll create a low-priority ticket for this ${category}. Is there anything else you'd like to add before I submit it?`;
      } else {
        message = `I'll create a ticket for this ${category}. Here's what I understood from your description:`;
      }
      
      // Format for different ITSM systems
      let systemSpecific = '';
      switch (systemType.toLowerCase()) {
        case 'servicenow':
          systemSpecific = 'This will be created as an Incident in ServiceNow.';
          break;
        case 'jira':
          systemSpecific = 'This will be created as an Issue in Jira.';
          break;
        case 'zendesk':
          systemSpecific = 'This will be created as a Ticket in Zendesk.';
          break;
      }
      
      // Add extracted information to the response
      message += `\n\nSummary: "${summary}"\nCategory: ${category}\nPriority: ${priority}\n\n${systemSpecific}`;
      
      // If context has previous messages, provide context awareness
      if (context && context.messages && context.messages.length > 1) {
        message += `\n\nI've taken into account our earlier conversation about this issue.`;
      }
      
      resolve({
        message,
        extractedData: {
          summary,
          description: userMessage,
          priority,
          category
        },
        confirmCreate: false // Require user confirmation before creating ticket
      });
    }, 1500); // Simulate LLM processing time
  });
};

// Simulate getting ticket suggestions (for demo/development)
const simulateGetTicketSuggestions = (message) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        suggestions: [
          {
            type: 'category',
            value: message.toLowerCase().includes('access') ? 'access' : 'incident',
            confidence: 0.85
          },
          {
            type: 'priority',
            value: message.toLowerCase().includes('urgent') ? 'high' : 'medium',
            confidence: 0.78
          }
        ]
      });
    }, 800);
  });
};

// Simulate translating a message to a ticket (for demo/development)
const simulateTranslateToTicket = (message, systemType) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let ticketFormat = {};
      
      switch (systemType.toLowerCase()) {
        case 'servicenow':
          ticketFormat = {
            short_description: message.split('.')[0],
            description: message,
            impact: message.toLowerCase().includes('urgent') ? '1' : '2',
            category: 'inquiry'
          };
          break;
        case 'jira':
          ticketFormat = {
            summary: message.split('.')[0],
            description: message,
            priority: { name: message.toLowerCase().includes('urgent') ? 'High' : 'Medium' },
            issuetype: { name: 'Task' }
          };
          break;
        case 'zendesk':
          ticketFormat = {
            subject: message.split('.')[0],
            comment: { body: message },
            priority: message.toLowerCase().includes('urgent') ? 'urgent' : 'normal'
          };
          break;
      }
      
      resolve({
        formatted: ticketFormat,
        systemType
      });
    }, 1000);
  });
};

export default llmService; 