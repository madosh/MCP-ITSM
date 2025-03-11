# ITSM Integration API Documentation

## Overview

The ITSM Integration API provides endpoints for managing integrations with various ITSM systems and user management functionality.

**Base URL**: `https://server.smithery.ai/@madosh/mcp-itsm`

## Authentication

### Login

Authenticates a user and returns a JWT token.

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

**Response** (401 Unauthorized):
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### API Key Authentication

For service-to-service authentication.

**Endpoint**: `POST /api/auth/api-key`

**Request Body**:
```json
{
  "apiKey": "your-api-key"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## User Management

### Get All Users

Get a list of all users. Requires admin role.

**Endpoint**: `GET /api/users`

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response** (200 OK):
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "user_id_1",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "admin",
      "isActive": true,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    {
      "_id": "user_id_2",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "role": "user",
      "isActive": true,
      "createdAt": "2023-01-02T00:00:00.000Z",
      "updatedAt": "2023-01-02T00:00:00.000Z"
    }
  ]
}
```

### Get User by ID

Get a specific user by ID. Users can only access their own data unless they're an admin.

**Endpoint**: `GET /api/users/:id`

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "admin",
    "isActive": true,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### Get Current User Profile

Get the profile of the currently authenticated user.

**Endpoint**: `GET /api/users/profile/me`

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "admin",
    "isActive": true,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### Update User

Update a user's information. Users can only update their own data unless they're an admin.

**Endpoint**: `PUT /api/users/:id`

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@example.com"
}
```

**Additional Fields for Admins**:
```json
{
  "role": "integrator",
  "isActive": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "_id": "user_id",
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@example.com",
    "role": "integrator",
    "isActive": true,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-03T00:00:00.000Z"
  }
}
```

### Update Password

Update a user's password. Users can only update their own password unless they're an admin.

**Endpoint**: `PUT /api/users/:id/password`

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body** (regular users):
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Request Body** (admins changing another user's password):
```json
{
  "newPassword": "newpassword123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

### Delete User

Delete a user. Requires admin role.

**Endpoint**: `DELETE /api/users/:id`

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

## Integration Management

### Get All Integrations

Get a list of all integrations. Requires admin or integrator role.

**Endpoint**: `GET /api/integration`

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response** (200 OK):
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "integration_id_1",
      "name": "Jira Integration",
      "description": "Integration with Jira for ticket management",
      "type": "jira",
      "config": {
        "baseUrl": "https://example.atlassian.net",
        "auth": {
          "type": "basic"
        }
      },
      "endpoints": [
        {
          "name": "getTickets",
          "path": "/rest/api/3/search",
          "method": "GET"
        }
      ],
      "isActive": true,
      "health": {
        "status": "healthy",
        "lastChecked": "2023-01-01T00:00:00.000Z",
        "message": "Integration is active and responding"
      },
      "createdBy": "user_id",
      "managers": ["user_id_2"],
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    {
      "_id": "integration_id_2",
      "name": "ServiceNow Integration",
      "description": "Integration with ServiceNow for incident management",
      "type": "servicenow",
      "config": {
        "baseUrl": "https://example.service-now.com",
        "auth": {
          "type": "oauth"
        }
      },
      "endpoints": [
        {
          "name": "getIncidents",
          "path": "/api/now/table/incident",
          "method": "GET"
        }
      ],
      "isActive": true,
      "health": {
        "status": "healthy",
        "lastChecked": "2023-01-01T00:00:00.000Z",
        "message": "Integration is active and responding"
      },
      "createdBy": "user_id",
      "managers": [],
      "createdAt": "2023-01-02T00:00:00.000Z",
      "updatedAt": "2023-01-02T00:00:00.000Z"
    }
  ]
}
```

### Get Integration by ID

Get a specific integration by ID. Only admins, integration managers, or creators can access specific integrations.

**Endpoint**: `GET /api/integration/:id`

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "integration_id",
    "name": "Jira Integration",
    "description": "Integration with Jira for ticket management",
    "type": "jira",
    "config": {
      "baseUrl": "https://example.atlassian.net",
      "auth": {
        "type": "basic"
      }
    },
    "endpoints": [
      {
        "name": "getTickets",
        "path": "/rest/api/3/search",
        "method": "GET"
      }
    ],
    "isActive": true,
    "health": {
      "status": "healthy",
      "lastChecked": "2023-01-01T00:00:00.000Z",
      "message": "Integration is active and responding"
    },
    "createdBy": "user_id",
    "managers": ["user_id_2"],
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### Get Integrations by Type

Get all integrations of a specific type. Requires admin or integrator role.

**Endpoint**: `GET /api/integration/type/:type`

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response** (200 OK):
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "integration_id_1",
      "name": "Jira Integration",
      "description": "Integration with Jira for ticket management",
      "type": "jira",
      "config": {
        "baseUrl": "https://example.atlassian.net",
        "auth": {
          "type": "basic"
        }
      },
      "endpoints": [
        {
          "name": "getTickets",
          "path": "/rest/api/3/search",
          "method": "GET"
        }
      ],
      "isActive": true,
      "health": {
        "status": "healthy",
        "lastChecked": "2023-01-01T00:00:00.000Z",
        "message": "Integration is active and responding"
      },
      "createdBy": "user_id",
      "managers": ["user_id_2"],
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### Create Integration

Create a new integration. Requires admin or integrator role.

**Endpoint**: `POST /api/integration`

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Zendesk Integration",
  "description": "Integration with Zendesk for support tickets",
  "type": "zendesk",
  "config": {
    "baseUrl": "https://example.zendesk.com",
    "auth": {
      "type": "token",
      "credentials": {
        "apiToken": "your_zendesk_api_token"
      }
    }
  },
  "endpoints": [
    {
      "name": "getTickets",
      "path": "/api/v2/tickets",
      "method": "GET"
    },
    {
      "name": "createTicket",
      "path": "/api/v2/tickets",
      "method": "POST"
    }
  ],
  "managers": ["user_id_1", "user_id_2"]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Integration created successfully",
  "data": {
    "_id": "new_integration_id",
    "name": "Zendesk Integration",
    "description": "Integration with Zendesk for support tickets",
    "type": "zendesk",
    "config": {
      "baseUrl": "https://example.zendesk.com",
      "auth": {
        "type": "token"
      }
    },
    "endpoints": [
      {
        "name": "getTickets",
        "path": "/api/v2/tickets",
        "method": "GET"
      },
      {
        "name": "createTicket",
        "path": "/api/v2/tickets",
        "method": "POST"
      }
    ],
    "isActive": true,
    "health": {
      "status": "unknown",
      "lastChecked": "2023-01-03T00:00:00.000Z",
      "message": "Integration created, health check pending"
    },
    "createdBy": "user_id",
    "managers": ["user_id_1", "user_id_2"],
    "createdAt": "2023-01-03T00:00:00.000Z",
    "updatedAt": "2023-01-03T00:00:00.000Z"
  }
}
```

### Update Integration

Update an existing integration. Only admins, creators, or managers can update integrations.

**Endpoint**: `PUT /api/integration/:id`

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body** (only include fields to update):
```json
{
  "name": "Updated Zendesk Integration",
  "description": "Updated description",
  "isActive": false,
  "config": {
    "baseUrl": "https://new-example.zendesk.com",
    "auth": {
      "type": "oauth"
    }
  },
  "managers": ["user_id_1", "user_id_3"]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Integration updated successfully",
  "data": {
    "_id": "integration_id",
    "name": "Updated Zendesk Integration",
    "description": "Updated description",
    "type": "zendesk",
    "config": {
      "baseUrl": "https://new-example.zendesk.com",
      "auth": {
        "type": "oauth"
      }
    },
    "endpoints": [
      {
        "name": "getTickets",
        "path": "/api/v2/tickets",
        "method": "GET"
      },
      {
        "name": "createTicket",
        "path": "/api/v2/tickets",
        "method": "POST"
      }
    ],
    "isActive": false,
    "health": {
      "status": "inactive",
      "lastChecked": "2023-01-03T00:00:00.000Z",
      "message": "Integration is currently inactive"
    },
    "createdBy": "user_id",
    "managers": ["user_id_1", "user_id_3"],
    "createdAt": "2023-01-03T00:00:00.000Z",
    "updatedAt": "2023-01-04T00:00:00.000Z"
  }
}
```

### Delete Integration

Delete an integration. Requires admin role.

**Endpoint**: `DELETE /api/integration/:id`

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Integration deleted successfully"
}
```

### Check Integration Health

Check the health of an integration. Only admins, creators, or managers can check health.

**Endpoint**: `POST /api/integration/:id/check-health`

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Health check performed",
  "data": {
    "status": "healthy",
    "lastChecked": "2023-01-04T00:00:00.000Z",
    "message": "Integration is active and responding"
  }
}
```

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Error message describing the issue"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Access denied"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Error fetching/creating/updating resource",
  "error": "Detailed error message (only in development environment)"
}
```

## API Usage Examples

### Authenticating and Getting Integrations

```javascript
const axios = require('axios');

async function example() {
  // Step 1: Login to get token
  const authResponse = await axios.post('https://server.smithery.ai/@madosh/mcp-itsm/api/auth/login', {
    email: 'admin@example.com',
    password: 'adminpassword'
  });
  
  const token = authResponse.data.token;
  
  // Step 2: Get all integrations
  const integrationsResponse = await axios.get('https://server.smithery.ai/@madosh/mcp-itsm/api/integration', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log('Integrations:', integrationsResponse.data);
}

example().catch(console.error);
```

### Creating a New Integration

```javascript
const axios = require('axios');

async function createIntegration() {
  // Step 1: Login to get token
  const authResponse = await axios.post('https://server.smithery.ai/@madosh/mcp-itsm/api/auth/login', {
    email: 'admin@example.com',
    password: 'adminpassword'
  });
  
  const token = authResponse.data.token;
  
  // Step 2: Create a new integration
  const integrationResponse = await axios.post('https://server.smithery.ai/@madosh/mcp-itsm/api/integration', {
    name: "ServiceNow Integration",
    description: "Integration with ServiceNow for incident management",
    type: "servicenow",
    config: {
      baseUrl: "https://example.service-now.com",
      auth: {
        type: "oauth",
        credentials: {
          clientId: "client_id",
          clientSecret: "client_secret"
        }
      }
    },
    endpoints: [
      {
        name: "getIncidents",
        path: "/api/now/table/incident",
        method: "GET"
      }
    ]
  }, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  console.log('New integration created:', integrationResponse.data);
}

createIntegration().catch(console.error);
``` 