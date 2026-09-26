import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapSnPriority,
  mapSnStatusToState,
  mapSnRecordPriority,
  mapSnRecordStatus,
  formatAdapterError,
  ServiceNowAdapter,
} from './servicenow.js';

test('mapSnPriority maps our priority enum to ServiceNow impact/urgency numbers', () => {
  assert.equal(mapSnPriority('critical'), 1);
  assert.equal(mapSnPriority('high'), 2);
  assert.equal(mapSnPriority('medium'), 3);
  assert.equal(mapSnPriority('low'), 4);
  assert.equal(mapSnPriority('unknown'), 3, 'unrecognised priority defaults to medium (3)');
});

test('mapSnStatusToState maps our status enum to default OOB incident state values', () => {
  assert.equal(mapSnStatusToState('open'), '1');
  assert.equal(mapSnStatusToState('in_progress'), '2');
  assert.equal(mapSnStatusToState('resolved'), '6');
  assert.equal(mapSnStatusToState('closed'), '7');
  assert.equal(mapSnStatusToState('unknown'), '1', 'unrecognised status defaults to open (1)');
});

test('mapSnRecordPriority/mapSnRecordStatus round-trip the outbound mappings', () => {
  assert.equal(mapSnRecordPriority('1'), 'critical');
  assert.equal(mapSnRecordPriority(4), 'low');
  assert.equal(mapSnRecordStatus('6'), 'resolved');
  assert.equal(mapSnRecordStatus(8), 'closed');
});

test('fromEnv returns null when credentials are incomplete', () => {
  assert.equal(ServiceNowAdapter.fromEnv({}), null);
  assert.equal(
    ServiceNowAdapter.fromEnv({ SERVICENOW_BASE_URL: 'https://x.service-now.com' }),
    null,
  );
});

test('fromEnv returns a configured adapter when all three vars are set', () => {
  const adapter = ServiceNowAdapter.fromEnv({
    SERVICENOW_BASE_URL: 'https://dev12345.service-now.com/',
    SERVICENOW_USERNAME: 'admin',
    SERVICENOW_PASSWORD: 'secret',
  });
  assert.ok(adapter instanceof ServiceNowAdapter);
  assert.equal(adapter.instanceUrl, 'https://dev12345.service-now.com', 'trailing slash is stripped');
  assert.equal(adapter.table, 'incident');
});

test('_mapRecord converts a ServiceNow incident record into our ticket shape', () => {
  const adapter = new ServiceNowAdapter({
    baseUrl: 'https://dev12345.service-now.com',
    username: 'admin',
    password: 'secret',
  });
  const ticket = adapter._mapRecord({
    number: 'INC0010023',
    sys_id: 'abc123',
    short_description: 'VPN not connecting',
    description: 'Fails to authenticate',
    priority: '2',
    state: '6',
    sys_created_on: '2026-09-01 10:00:00',
    sys_updated_on: '2026-09-02 11:00:00',
    assigned_to: { display_value: 'Jane Doe' },
  });
  assert.deepEqual(ticket, {
    id: 'INC0010023',
    sys_id: 'abc123',
    title: 'VPN not connecting',
    description: 'Fails to authenticate',
    priority: 'high',
    status: 'resolved',
    system: 'servicenow',
    created_at: '2026-09-01 10:00:00',
    updated_at: '2026-09-02 11:00:00',
    assignee: 'Jane Doe',
    url: 'https://dev12345.service-now.com/nav_to.do?uri=incident.do?sys_id=abc123',
  });
});

test('formatAdapterError extracts ServiceNow error payloads', () => {
  assert.equal(
    formatAdapterError({ response: { data: { error: { message: 'Invalid table' } } } }),
    'ServiceNow: Invalid table',
  );
  assert.equal(formatAdapterError({ message: 'timeout' }), 'ServiceNow: timeout');
});
