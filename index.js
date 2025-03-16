// MCP ITSM Tools - Smithery Integration
const readline = require('readline');

// Create readline interface for stdio
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Mock implementation of ITSM tools
const tickets = {};
let nextTicketId = 1000;

// Handle incoming messages
rl.on('line', async (line) => {
  try {
    const message = JSON.parse(line);
    console.error(`Received message: ${line}`);
    
    // Handle MCP tool calls
    if (message.type === 'tool_call') {
      const { name, parameters } = message.data;
      let result;
      
      console.error(`Processing tool call: ${name}`);
      
      switch (name) {
        case 'create_ticket':
          result = handleCreateTicket(parameters);
          break;
        case 'get_ticket':
          result = handleGetTicket(parameters);
          break;
        case 'update_ticket':
          result = handleUpdateTicket(parameters);
          break;
        case 'list_tickets':
          result = handleListTickets(parameters);
          break;
        case 'assign_ticket':
          result = handleAssignTicket(parameters);
          break;
        case 'add_comment':
          result = handleAddComment(parameters);
          break;
        case 'search_knowledge_base':
          result = handleSearchKnowledgeBase(parameters);
          break;
        default:
          result = { error: `Unknown tool: ${name}` };
      }
      
      // Send response back in MCP format
      const response = {
        type: 'tool_response',
        id: message.id,
        data: result
      };
      
      console.log(JSON.stringify(response));
    }
    // For backward compatibility, also handle function calls
    else if (message.type === 'function' || message.type === 'function_call') {
      console.error(`Received non-MCP message type: ${message.type}`);
      let name, params, id;
      
      if (message.type === 'function') {
        name = message.name;
        params = typeof message.arguments === 'string' ? 
          JSON.parse(message.arguments) : message.arguments;
        id = message.id || 'function-call';
      } else {
        name = message.function_call.name;
        params = message.function_call.arguments;
        id = message.id || 'function-call';
      }
      
      let result;
      
      switch (name) {
        case 'create_ticket':
          result = handleCreateTicket(params);
          break;
        case 'get_ticket':
          result = handleGetTicket(params);
          break;
        case 'update_ticket':
          result = handleUpdateTicket(params);
          break;
        case 'list_tickets':
          result = handleListTickets(params);
          break;
        case 'assign_ticket':
          result = handleAssignTicket(params);
          break;
        case 'add_comment':
          result = handleAddComment(params);
          break;
        case 'search_knowledge_base':
          result = handleSearchKnowledgeBase(params);
          break;
        default:
          result = { error: `Unknown function: ${name}` };
      }
      
      // Convert to MCP format for consistency
      const response = {
        type: 'tool_response',
        id: id,
        data: result
      };
      
      console.log(JSON.stringify(response));
    }
  } catch (error) {
    console.error('Error processing message:', error);
    // Send error response
    const errorResponse = {
      type: 'error',
      error: error.message
    };
    console.log(JSON.stringify(errorResponse));
  }
});

// Tool handlers
function handleCreateTicket(params) {
  const { title, description, priority = 'medium', system = 'jira' } = params;
  
  // Generate ticket ID based on system
  const prefix = system === 'jira' ? 'JIRA-' : 
                system === 'servicenow' ? 'SN-' : 'ZD-';
  const ticketId = `${prefix}${nextTicketId++}`;
  
  // Create ticket
  tickets[ticketId] = {
    id: ticketId,
    title,
    description,
    priority,
    status: 'open',
    system,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignee: null,
    comments: []
  };
  
  return {
    success: true,
    ticket: {
      id: ticketId,
      title,
      system,
      status: 'open',
      url: `https://example.com/${system}/tickets/${ticketId}`
    }
  };
}

function handleGetTicket(params) {
  const { ticket_id } = params;
  
  if (!tickets[ticket_id]) {
    return {
      success: false,
      error: `Ticket ${ticket_id} not found`
    };
  }
  
  return {
    success: true,
    ticket: tickets[ticket_id]
  };
}

function handleUpdateTicket(params) {
  const { ticket_id, status, priority, comment } = params;
  
  if (!tickets[ticket_id]) {
    return {
      success: false,
      error: `Ticket ${ticket_id} not found`
    };
  }
  
  const ticket = tickets[ticket_id];
  
  if (status) ticket.status = status;
  if (priority) ticket.priority = priority;
  if (comment) ticket.comments.push(comment);
  
  ticket.updated_at = new Date().toISOString();
  
  return {
    success: true,
    ticket: {
      id: ticket.id,
      title: ticket.title,
      status: ticket.status,
      system: ticket.system
    }
  };
}

function handleListTickets(params) {
  const { status, assigned_to, limit = 10, system } = params;
  
  let filteredTickets = Object.values(tickets);
  
  if (status && status !== 'all') {
    filteredTickets = filteredTickets.filter(t => t.status === status);
  }
  
  if (assigned_to) {
    filteredTickets = filteredTickets.filter(t => t.assignee === assigned_to);
  }
  
  if (system) {
    filteredTickets = filteredTickets.filter(t => t.system === system);
  }
  
  // Sort by created date (newest first)
  filteredTickets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  // Apply limit
  filteredTickets = filteredTickets.slice(0, limit);
  
  return {
    success: true,
    tickets: filteredTickets.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      system: t.system
    })),
    total: filteredTickets.length
  };
}

function handleAssignTicket(params) {
  const { ticket_id, user_id } = params;
  
  if (!tickets[ticket_id]) {
    return {
      success: false,
      error: `Ticket ${ticket_id} not found`
    };
  }
  
  tickets[ticket_id].assignee = user_id;
  tickets[ticket_id].updated_at = new Date().toISOString();
  
  return {
    success: true,
    ticket: {
      id: tickets[ticket_id].id,
      title: tickets[ticket_id].title,
      assignee: user_id,
      system: tickets[ticket_id].system
    }
  };
}

function handleAddComment(params) {
  const { ticket_id, comment, internal = false } = params;
  
  if (!tickets[ticket_id]) {
    return {
      success: false,
      error: `Ticket ${ticket_id} not found`
    };
  }
  
  const commentObj = {
    text: comment,
    internal,
    created_at: new Date().toISOString()
  };
  
  tickets[ticket_id].comments.push(commentObj);
  tickets[ticket_id].updated_at = new Date().toISOString();
  
  return {
    success: true,
    comment: commentObj,
    ticket_id
  };
}

function handleSearchKnowledgeBase(params) {
  const { query, limit = 5 } = params;
  
  // Mock knowledge base articles
  const articles = [
    {
      id: 'KB-001',
      title: 'How to reset your password',
      summary: 'Step-by-step guide to reset your password',
      url: 'https://example.com/kb/password-reset'
    },
    {
      id: 'KB-002',
      title: 'Common login issues',
      summary: 'Troubleshooting common login problems',
      url: 'https://example.com/kb/login-issues'
    },
    {
      id: 'KB-003',
      title: 'Setting up email on mobile devices',
      summary: 'How to configure email on iOS and Android',
      url: 'https://example.com/kb/email-setup'
    },
    {
      id: 'KB-004',
      title: 'VPN connection troubleshooting',
      summary: 'Fixing common VPN connection problems',
      url: 'https://example.com/kb/vpn-issues'
    },
    {
      id: 'KB-005',
      title: 'Printer setup guide',
      summary: 'How to install and configure network printers',
      url: 'https://example.com/kb/printer-setup'
    }
  ];
  
  // Simple mock search (in a real implementation, this would use proper search)
  const results = articles.filter(article => 
    article.title.toLowerCase().includes(query.toLowerCase()) || 
    article.summary.toLowerCase().includes(query.toLowerCase())
  ).slice(0, limit);
  
  return {
    success: true,
    articles: results,
    total: results.length
  };
}

// Log startup
console.error('MCP ITSM Tools service started');

// Handle process termination
process.on('SIGINT', () => {
  console.error('MCP ITSM Tools service shutting down');
  process.exit(0);
}); 