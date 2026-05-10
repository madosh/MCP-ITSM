/**
 * MCP Client Service
 * Service for interacting with the MCP ITSM server
 */

class MCPService {
  constructor() {
    this.serverProcess = null;
    this.isConnected = false;
    this.messageId = 0;
    this.pendingRequests = new Map();
  }

  /**
   * Connect to MCP server via HTTP or stdio
   * For browser-based clients, we'll use HTTP transport
   */
  async connect(serverUrl = null) {
    // In a browser environment, we'll use HTTP transport
    // The backend will proxy MCP requests to the stdio server
    this.serverUrl = serverUrl || process.env.REACT_APP_MCP_SERVER_URL || 'http://localhost:5000/api/mcp';
    this.isConnected = true;
    return { success: true };
  }

  /**
   * Call an MCP tool
   */
  async callTool(toolName, args) {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const response = await fetch(`${this.serverUrl}/tools/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: toolName,
          arguments: args,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'MCP tool call failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('MCP tool call error:', error);
      throw error;
    }
  }

  /**
   * List available tools
   */
  async listTools() {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const response = await fetch(`${this.serverUrl}/tools/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to list MCP tools');
      }

      const result = await response.json();
      return result.tools || [];
    } catch (error) {
      console.error('MCP list tools error:', error);
      throw error;
    }
  }

  /**
   * Create a ticket using MCP
   */
  async createTicket(title, description, priority = 'medium', system = 'jira') {
    return this.callTool('create_ticket', {
      title,
      description,
      priority,
      system,
    });
  }

  /**
   * Get ticket details
   */
  async getTicket(ticketId, system = null) {
    return this.callTool('get_ticket', {
      ticket_id: ticketId,
      ...(system && { system }),
    });
  }

  /**
   * Update a ticket
   */
  async updateTicket(ticketId, updates, system = null) {
    return this.callTool('update_ticket', {
      ticket_id: ticketId,
      ...updates,
      ...(system && { system }),
    });
  }

  /**
   * List tickets with filters
   */
  async listTickets(filters = {}) {
    return this.callTool('list_tickets', filters);
  }

  /**
   * Assign a ticket
   */
  async assignTicket(ticketId, userId, system = null) {
    return this.callTool('assign_ticket', {
      ticket_id: ticketId,
      user_id: userId,
      ...(system && { system }),
    });
  }

  /**
   * Add a comment to a ticket
   */
  async addComment(ticketId, comment, internal = false, system = null) {
    return this.callTool('add_comment', {
      ticket_id: ticketId,
      comment,
      internal,
      ...(system && { system }),
    });
  }

  /**
   * Search knowledge base
   */
  async searchKnowledgeBase(query, limit = 5, system = null) {
    return this.callTool('search_knowledge_base', {
      query,
      limit,
      ...(system && { system }),
    });
  }
}

// Export singleton instance
export const mcpService = new MCPService();
export default mcpService;

