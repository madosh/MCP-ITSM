/**
 * ServiceNow live adapter — Table API (incident table) over Basic Auth.
 *
 * Talks to a real ServiceNow instance instead of the in-memory store.
 * Instantiate via `ServiceNowAdapter.fromEnv()`, which returns `null` when
 * SERVICENOW_BASE_URL / SERVICENOW_USERNAME / SERVICENOW_PASSWORD aren't set
 * — callers should fall back to the in-memory mock in that case.
 *
 * Field mapping notes:
 *  - `priority` (low/medium/high/critical) is not written directly; most
 *    instances derive `priority` from `impact` + `urgency`, so we set both.
 *  - `status` maps to the incident `state` field using the out-of-box
 *    values (1 New, 2 In Progress, 6 Resolved, 7 Closed). Many instances
 *    customise these — override STATUS_TO_SN_STATE / SN_STATE_TO_STATUS
 *    below if your instance uses different state numbers.
 *  - `comment` writes to the `comments` journal field (customer-visible) or
 *    `work_notes` (internal). Both APPEND a new entry; they never overwrite.
 *  - `assign_ticket` passes the username as a display value
 *    (sysparm_input_display_value=true) so callers don't need to resolve a
 *    sys_id for the assignee up front.
 */

import axios from 'axios';

const PRIORITY_TO_SN = { critical: 1, high: 2, medium: 3, low: 4 };
const SN_TO_PRIORITY = { 1: 'critical', 2: 'high', 3: 'medium', 4: 'low', 5: 'low' };

const STATUS_TO_SN_STATE = { open: '1', in_progress: '2', resolved: '6', closed: '7' };
const SN_STATE_TO_STATUS = { 1: 'open', 2: 'in_progress', 3: 'in_progress', 6: 'resolved', 7: 'closed', 8: 'closed' };

export function mapSnPriority(priority) {
  return PRIORITY_TO_SN[priority] ?? 3;
}

export function mapSnStatusToState(status) {
  return STATUS_TO_SN_STATE[status] ?? STATUS_TO_SN_STATE.open;
}

export function mapSnRecordPriority(snPriority) {
  return SN_TO_PRIORITY[Number(snPriority)] ?? 'medium';
}

export function mapSnRecordStatus(snState) {
  return SN_STATE_TO_STATUS[Number(snState)] ?? 'open';
}

export function formatAdapterError(err) {
  const data = err?.response?.data;
  if (data?.error?.message) return `ServiceNow: ${data.error.message}`;
  if (data) return `ServiceNow: ${JSON.stringify(data)}`;
  return `ServiceNow: ${err?.message || String(err)}`;
}

export class ServiceNowAdapter {
  constructor({ baseUrl, username, password, table = 'incident' }) {
    this.table = table;
    this.instanceUrl = baseUrl.replace(/\/+$/, '');
    this.client = axios.create({
      baseURL: `${this.instanceUrl}/api/now/table`,
      auth: { username, password },
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      timeout: 15000,
    });
  }

  static fromEnv(env = process.env) {
    const baseUrl = env.SERVICENOW_BASE_URL;
    const username = env.SERVICENOW_USERNAME;
    const password = env.SERVICENOW_PASSWORD;
    if (!baseUrl || !username || !password) return null;
    return new ServiceNowAdapter({ baseUrl, username, password, table: env.SERVICENOW_TABLE });
  }

  _mapRecord(rec) {
    const assignee =
      rec.assigned_to && typeof rec.assigned_to === 'object' ? rec.assigned_to.display_value : rec.assigned_to || null;
    return {
      id: rec.number,
      sys_id: rec.sys_id,
      title: rec.short_description,
      description: rec.description,
      priority: mapSnRecordPriority(rec.priority),
      status: mapSnRecordStatus(rec.state),
      system: 'servicenow',
      created_at: rec.sys_created_on,
      updated_at: rec.sys_updated_on,
      assignee: assignee || null,
      url: `${this.instanceUrl}/nav_to.do?uri=${this.table}.do?sys_id=${rec.sys_id}`,
    };
  }

  async _findByNumber(number) {
    const { data } = await this.client.get(`/${this.table}`, {
      params: { sysparm_query: `number=${number}`, sysparm_limit: 1, sysparm_display_value: 'true' },
    });
    return data.result?.[0] || null;
  }

  async createTicket({ title, description, priority = 'medium' }) {
    const snPriority = String(mapSnPriority(priority));
    const { data } = await this.client.post(`/${this.table}`, {
      short_description: title,
      description,
      urgency: snPriority,
      impact: snPriority,
    });
    return { success: true, ticket: this._mapRecord(data.result) };
  }

  async getTicket({ ticket_id }) {
    const rec = await this._findByNumber(ticket_id);
    if (!rec) return { success: false, error: `Ticket ${ticket_id} not found` };
    return { success: true, ticket: this._mapRecord(rec) };
  }

  async updateTicket({ ticket_id, status, priority, comment }) {
    const rec = await this._findByNumber(ticket_id);
    if (!rec) return { success: false, error: `Ticket ${ticket_id} not found` };

    const body = {};
    if (status) body.state = mapSnStatusToState(status);
    if (priority) {
      const p = String(mapSnPriority(priority));
      body.urgency = p;
      body.impact = p;
    }
    if (comment) body.comments = comment;

    const { data } = await this.client.patch(`/${this.table}/${rec.sys_id}`, body);
    return { success: true, ticket: this._mapRecord(data.result) };
  }

  async listTickets({ status, assigned_to, limit = 10 } = {}) {
    const filters = [];
    if (status && status !== 'all') filters.push(`state=${mapSnStatusToState(status)}`);
    if (assigned_to) filters.push(`assigned_to.user_name=${assigned_to}`);
    filters.push('ORDERBYDESCsys_created_on');

    const { data } = await this.client.get(`/${this.table}`, {
      params: {
        sysparm_query: filters.join('^'),
        sysparm_limit: limit,
        sysparm_display_value: 'true',
      },
    });
    const list = (data.result || []).map((rec) => this._mapRecord(rec));
    return { success: true, tickets: list, total: list.length };
  }

  async assignTicket({ ticket_id, user_id }) {
    const rec = await this._findByNumber(ticket_id);
    if (!rec) return { success: false, error: `Ticket ${ticket_id} not found` };

    const { data } = await this.client.patch(
      `/${this.table}/${rec.sys_id}`,
      { assigned_to: user_id },
      { params: { sysparm_input_display_value: 'true' } },
    );
    return { success: true, ticket: this._mapRecord(data.result) };
  }

  async addComment({ ticket_id, comment, internal = false }) {
    const rec = await this._findByNumber(ticket_id);
    if (!rec) return { success: false, error: `Ticket ${ticket_id} not found` };

    const field = internal ? 'work_notes' : 'comments';
    await this.client.patch(`/${this.table}/${rec.sys_id}`, { [field]: comment });
    return {
      success: true,
      comment: { text: comment, internal, created_at: new Date().toISOString() },
      ticket_id,
    };
  }
}
