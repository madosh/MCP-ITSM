#!/usr/bin/env node

/**
 * MCP ITSM Server v3.0.0
 * Model Context Protocol server for IT Service Management
 * Spec: 2025-11-25 | SDK: ^1.28.0
 *
 * Features: Tools (with annotations), Resources, Prompts, Zod schemas
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// ---------------------------------------------------------------------------
// In-memory data store
// ---------------------------------------------------------------------------

const tickets = new Map();
let nextTicketId = 1000;

const knowledgeBaseArticles = [
  {
    id: 'KB-001',
    title: 'How to reset your password',
    summary: 'Step-by-step guide to reset your password',
    url: 'https://example.com/kb/password-reset',
    tags: ['password', 'authentication', 'login'],
  },
  {
    id: 'KB-002',
    title: 'Common login issues',
    summary: 'Troubleshooting common login problems',
    url: 'https://example.com/kb/login-issues',
    tags: ['login', 'authentication', 'troubleshooting'],
  },
  {
    id: 'KB-003',
    title: 'Setting up email on mobile devices',
    summary: 'How to configure email on iOS and Android',
    url: 'https://example.com/kb/email-setup',
    tags: ['email', 'mobile', 'configuration'],
  },
  {
    id: 'KB-004',
    title: 'VPN connection troubleshooting',
    summary: 'Fixing common VPN connection problems',
    url: 'https://example.com/kb/vpn-issues',
    tags: ['vpn', 'network', 'troubleshooting'],
  },
  {
    id: 'KB-005',
    title: 'Printer setup guide',
    summary: 'How to install and configure network printers',
    url: 'https://example.com/kb/printer-setup',
    tags: ['printer', 'hardware', 'configuration'],
  },
];

// ---------------------------------------------------------------------------
// Reusable schema fragments
// ---------------------------------------------------------------------------

const systemSchema = z
  .enum(['servicenow', 'jira', 'zendesk', 'ivanti_neurons', 'cherwell'])
  .default('jira')
  .describe('ITSM system to use');

const prioritySchema = z
  .enum(['low', 'medium', 'high', 'critical'])
  .default('medium')
  .describe('Priority level');

// ---------------------------------------------------------------------------
// Business logic helpers
// ---------------------------------------------------------------------------

function generateTicketId(system = 'jira') {
  const prefixes = {
    jira: 'JIRA',
    servicenow: 'SN',
    zendesk: 'ZD',
    ivanti_neurons: 'IV',
    cherwell: 'CH',
  };
  return `${prefixes[system] ?? 'TKT'}-${nextTicketId++}`;
}

function createTicket({ title, description, priority = 'medium', system = 'jira' }) {
  const id = generateTicketId(system);
  const ticket = {
    id,
    title,
    description,
    priority,
    status: 'open',
    system,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assignee: null,
    comments: [],
  };
  tickets.set(id, ticket);
  return {
    success: true,
    ticket: { id, title, system, status: 'open', priority, url: `https://example.com/${system}/tickets/${id}` },
  };
}

function getTicket({ ticket_id }) {
  const ticket = tickets.get(ticket_id);
  if (!ticket) return { success: false, error: `Ticket ${ticket_id} not found` };
  return { success: true, ticket: { ...ticket } };
}

function updateTicket({ ticket_id, status, priority, comment }) {
  const ticket = tickets.get(ticket_id);
  if (!ticket) return { success: false, error: `Ticket ${ticket_id} not found` };
  if (status) ticket.status = status;
  if (priority) ticket.priority = priority;
  if (comment) ticket.comments.push({ text: comment, created_at: new Date().toISOString(), internal: false });
  ticket.updated_at = new Date().toISOString();
  tickets.set(ticket_id, ticket);
  return { success: true, ticket: { id: ticket.id, title: ticket.title, status: ticket.status, priority: ticket.priority, system: ticket.system } };
}

function listTickets({ status, assigned_to, limit = 10, system } = {}) {
  let list = Array.from(tickets.values());
  if (status && status !== 'all') list = list.filter(t => t.status === status);
  if (assigned_to) list = list.filter(t => t.assignee === assigned_to);
  if (system) list = list.filter(t => t.system === system);
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  list = list.slice(0, limit);
  return { success: true, tickets: list.map(t => ({ id: t.id, title: t.title, status: t.status, priority: t.priority, system: t.system, created_at: t.created_at })), total: list.length };
}

function assignTicket({ ticket_id, user_id }) {
  const ticket = tickets.get(ticket_id);
  if (!ticket) return { success: false, error: `Ticket ${ticket_id} not found` };
  ticket.assignee = user_id;
  ticket.updated_at = new Date().toISOString();
  tickets.set(ticket_id, ticket);
  return { success: true, ticket: { id: ticket.id, title: ticket.title, assignee: user_id, system: ticket.system } };
}

function addComment({ ticket_id, comment, internal = false }) {
  const ticket = tickets.get(ticket_id);
  if (!ticket) return { success: false, error: `Ticket ${ticket_id} not found` };
  const commentObj = { text: comment, internal, created_at: new Date().toISOString() };
  ticket.comments.push(commentObj);
  ticket.updated_at = new Date().toISOString();
  tickets.set(ticket_id, ticket);
  return { success: true, comment: commentObj, ticket_id };
}

function searchKnowledgeBase({ query, limit = 5 }) {
  const q = query.toLowerCase();
  const results = knowledgeBaseArticles
    .filter(a => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.tags.some(t => t.includes(q)))
    .slice(0, limit);
  return { success: true, articles: results, total: results.length };
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

async function main() {
  const server = new McpServer({
    name: 'mcp-itsm',
    version: '3.0.0',
    description: 'Unified ITSM tools for ServiceNow, Jira, Zendesk, Ivanti Neurons, and Cherwell',
  });

  // -------------------------------------------------------------------------
  // Tools
  // -------------------------------------------------------------------------

  server.tool(
    'create_ticket',
    'Create a new support ticket in the appropriate ITSM system',
    {
      title: z.string().describe('Title of the ticket'),
      description: z.string().describe('Detailed description of the issue'),
      priority: prioritySchema,
      system: systemSchema,
    },
    {
      title: 'Create Ticket',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    async ({ title, description, priority, system }) => {
      const result = createTicket({ title, description, priority, system });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'get_ticket',
    'Retrieve full details of an existing ticket by ID',
    {
      ticket_id: z.string().describe('ID of the ticket to retrieve (e.g. JIRA-1000)'),
      system: systemSchema.optional(),
    },
    {
      title: 'Get Ticket',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    async ({ ticket_id }) => {
      const result = getTicket({ ticket_id });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'update_ticket',
    'Update the status, priority, or add a comment to an existing ticket',
    {
      ticket_id: z.string().describe('ID of the ticket to update'),
      status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional().describe('New status'),
      priority: prioritySchema.optional(),
      comment: z.string().optional().describe('Comment to add to the ticket'),
      system: systemSchema.optional(),
    },
    {
      title: 'Update Ticket',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    async ({ ticket_id, status, priority, comment }) => {
      const result = updateTicket({ ticket_id, status, priority, comment });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'list_tickets',
    'List tickets with optional filtering by status, assignee, or system',
    {
      status: z.enum(['open', 'in_progress', 'resolved', 'closed', 'all']).optional().describe('Filter by status'),
      assigned_to: z.string().optional().describe('Filter by assignee username'),
      limit: z.number().int().min(1).max(100).default(10).describe('Max number of tickets to return'),
      system: systemSchema.optional(),
    },
    {
      title: 'List Tickets',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    async ({ status, assigned_to, limit, system }) => {
      const result = listTickets({ status, assigned_to, limit, system });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'assign_ticket',
    'Assign a ticket to a specific user',
    {
      ticket_id: z.string().describe('ID of the ticket to assign'),
      user_id: z.string().describe('Username or ID of the user to assign to'),
      system: systemSchema.optional(),
    },
    {
      title: 'Assign Ticket',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    async ({ ticket_id, user_id }) => {
      const result = assignTicket({ ticket_id, user_id });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'add_comment',
    'Add a comment (public or internal) to an existing ticket',
    {
      ticket_id: z.string().describe('ID of the ticket to comment on'),
      comment: z.string().describe('Comment text'),
      internal: z.boolean().default(false).describe('True = internal note not visible to end users'),
      system: systemSchema.optional(),
    },
    {
      title: 'Add Comment',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    async ({ ticket_id, comment, internal }) => {
      const result = addComment({ ticket_id, comment, internal });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    'search_knowledge_base',
    'Search the knowledge base for articles related to an issue',
    {
      query: z.string().describe('Search query — keywords, error messages, or topic'),
      limit: z.number().int().min(1).max(20).default(5).describe('Max articles to return'),
      system: systemSchema.optional(),
    },
    {
      title: 'Search Knowledge Base',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    async ({ query, limit }) => {
      const result = searchKnowledgeBase({ query, limit });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  );

  // -------------------------------------------------------------------------
  // Resources
  // -------------------------------------------------------------------------

  server.resource(
    'kb-articles',
    'kb://articles',
    { description: 'All knowledge base articles', mimeType: 'application/json' },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(knowledgeBaseArticles, null, 2),
      }],
    }),
  );

  server.resource(
    'kb-article',
    new ResourceTemplate('kb://articles/{id}', { list: undefined }),
    { description: 'Single knowledge base article by ID' },
    async (uri, { id }) => {
      const article = knowledgeBaseArticles.find(a => a.id === id);
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: article
            ? JSON.stringify(article, null, 2)
            : JSON.stringify({ error: `KB article ${id} not found` }),
        }],
      };
    },
  );

  server.resource(
    'open-tickets',
    'itsm://tickets/open',
    { description: 'All currently open tickets', mimeType: 'application/json' },
    async (uri) => {
      const open = Array.from(tickets.values())
        .filter(t => t.status === 'open')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ tickets: open, total: open.length }, null, 2),
        }],
      };
    },
  );

  server.resource(
    'ticket',
    new ResourceTemplate('itsm://tickets/{ticketId}', { list: undefined }),
    { description: 'A single ITSM ticket by ID' },
    async (uri, { ticketId }) => {
      const ticket = tickets.get(ticketId);
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: ticket
            ? JSON.stringify(ticket, null, 2)
            : JSON.stringify({ error: `Ticket ${ticketId} not found` }),
        }],
      };
    },
  );

  // -------------------------------------------------------------------------
  // Prompts
  // -------------------------------------------------------------------------

  server.prompt(
    'create-incident-ticket',
    'Guided template for creating a high-priority (P1/P2) incident ticket',
    {
      title: z.string().describe('Brief incident title'),
      system: z.string().optional().describe('Target ITSM system (default: jira)'),
      affected_service: z.string().optional().describe('Name of the affected service or system'),
    },
    async ({ title, system, affected_service }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: [
            `Create a P1 incident ticket with the following details:`,
            `Title: ${title}`,
            `System: ${system || 'jira'}`,
            affected_service ? `Affected Service: ${affected_service}` : '',
            `Priority: critical`,
            ``,
            `The ticket description should cover:`,
            `1. Incident summary and observed symptoms`,
            `2. Business impact and affected users`,
            `3. Immediate mitigation steps taken`,
            `4. Escalation contacts and on-call assignments`,
            `5. Estimated time to resolution`,
          ].filter(Boolean).join('\n'),
        },
      }],
    }),
  );

  server.prompt(
    'ticket-status-report',
    'Generate a structured summary of the current ticket queue',
    {
      filter_status: z.string().optional().describe('Status filter: open, in_progress, resolved, or all (default: open)'),
    },
    async ({ filter_status }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `List all ${filter_status || 'open'} tickets and produce a brief status report that includes: total count broken down by priority, the three oldest unresolved tickets, any tickets unassigned for more than 24 hours, and a recommended triage order.`,
        },
      }],
    }),
  );

  server.prompt(
    'kb-search-assist',
    'Find relevant knowledge base articles before creating a ticket',
    {
      issue_description: z.string().describe('Short description of the reported issue'),
    },
    async ({ issue_description }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Before creating a ticket for the following issue, search the knowledge base and check if a self-service resolution already exists:\n\n"${issue_description}"\n\nIf a relevant article is found, present the solution to the user. If no article matches, proceed to create a ticket.`,
        },
      }],
    }),
  );

  // -------------------------------------------------------------------------
  // Connect
  // -------------------------------------------------------------------------

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('MCP ITSM Server v3.0.0 running on stdio (spec 2025-11-25)');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
