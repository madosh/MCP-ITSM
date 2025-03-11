require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mcp-itsm',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  api: {
    prefix: '/api',
  },
  // Integration settings for ITSM tools
  integrations: {
    servicenow: {
      baseUrl: process.env.SERVICENOW_BASE_URL || '',
      username: process.env.SERVICENOW_USERNAME || '',
      password: process.env.SERVICENOW_PASSWORD || '',
    },
    jira: {
      baseUrl: process.env.JIRA_BASE_URL || '',
      apiToken: process.env.JIRA_API_TOKEN || '',
      email: process.env.JIRA_EMAIL || '',
    },
    zendesk: {
      baseUrl: process.env.ZENDESK_BASE_URL || '',
      username: process.env.ZENDESK_USERNAME || '',
      token: process.env.ZENDESK_TOKEN || '',
    },
  },
  // MCP Context settings
  context: {
    defaultTTL: process.env.CONTEXT_DEFAULT_TTL || 86400, // 24 hours in seconds
    maxSize: process.env.CONTEXT_MAX_SIZE || 1024 * 1024, // 1MB
  },
}; 