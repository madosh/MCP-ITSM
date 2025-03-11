# ITSM Integration Platform

A comprehensive platform for integrating with various IT Service Management (ITSM) systems through a unified API. This repository contains the backend API, client application, monitoring setup, and documentation.

## Project Overview

The ITSM Integration Platform is a comprehensive solution designed to unify access to diverse IT Service Management systems through a single, standardized API. It solves the common challenge organizations face when working with multiple ITSM tools (like Jira, ServiceNow, and Zendesk) by providing a centralized interface that handles authentication, request routing, response normalization, and health monitoring across all integrated systems. The platform features a React-based client application with role-based access control, a robust Node.js/Express backend with MongoDB for persistence, and a complete monitoring stack using Prometheus and Grafana to ensure reliability and performance.

At its core, the platform implements a modular architecture where the Integration Management Module acts as a bridge between client applications and various ITSM systems, abstracting away the complexity of dealing with different APIs and authentication methods. The system provides comprehensive health monitoring of all integrations, allowing organizations to quickly identify and resolve connectivity issues. The platform supports multiple authentication mechanisms, includes detailed documentation, and features an intuitive dashboard that provides real-time visibility into integration status. This enables teams to manage their service management workflows more efficiently while reducing the technical overhead of maintaining multiple direct integrations with various ITSM providers.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Deployment](#deployment)
- [Client Application](#client-application)
- [API Documentation](#api-documentation)
- [Monitoring](#monitoring)
- [Development](#development)
- [Connecting to ITSM Sandboxes](#connecting-to-itsm-sandboxes)
- [License](#license)

## Overview

The ITSM Integration Platform provides a unified interface for connecting to and interacting with various ITSM tools like Jira, ServiceNow, Zendesk, and others. It handles authentication, request routing, response normalization, and health monitoring.

### Key Features

- **Unified API**: Interact with multiple ITSM systems through a single API
- **Role-based Access Control**: Admin, integrator, and user roles with appropriate permissions
- **Health Monitoring**: Automatic checking of integration health and status reporting
- **Flexible Configuration**: Support for various authentication methods and endpoints
- **User Management**: Full user lifecycle management with secure authentication

## Architecture

The platform consists of:

- **Backend**: Node.js Express REST API with MongoDB database
- **Frontend**: React-based client application with Bootstrap UI
- **Monitoring**: Prometheus/Grafana stack for metrics and monitoring
- **Documentation**: Comprehensive API documentation

## Deployment

The application is deployed on Smithery and can be accessed using:

```bash
npx -y @smithery/cli@latest run @madosh/mcp-itsm --config "{\"apiKey\":\"123\"}"
```

This will establish a WebSocket connection to the deployed service at `https://server.smithery.ai/@madosh/mcp-itsm`.

### Docker Deployment

The application can also be deployed using Docker:

```bash
docker build -t itsm-integration-platform .
docker run -p 5000:5000 -e NODE_ENV=production -e PORT=5000 -e MONGODB_URI=your-mongodb-uri -e JWT_SECRET=your-jwt-secret itsm-integration-platform
```

## Client Application

The React-based client application provides a user-friendly interface for managing integrations and users.

### Features

- **Dashboard**: Overview of integration status and health
- **Integrations Management**: Create, view, update, and delete integrations
- **User Management**: Admin-only user management interface
- **Authentication**: Secure login with JWT tokens
- **Role-based Access**: Different views and permissions based on user role

### Running the Client Application

```bash
cd frontend
npm install
npm start
```

The client application will be available at http://localhost:3000 and will connect to the API at the URL specified in the proxy configuration.

## API Documentation

Comprehensive API documentation is available in the [docs/api-documentation.md](docs/api-documentation.md) file. It includes:

- Authentication endpoints
- User management endpoints
- Integration management endpoints
- Request/response examples
- Error handling

### API Base URL

```
https://server.smithery.ai/@madosh/mcp-itsm
```

### Example API Usage

```javascript
const axios = require('axios');

async function example() {
  // Login to get token
  const authResponse = await axios.post('https://server.smithery.ai/@madosh/mcp-itsm/api/auth/login', {
    email: 'admin@example.com',
    password: 'adminpassword'
  });
  
  const token = authResponse.data.token;
  
  // Get all integrations
  const integrationsResponse = await axios.get('https://server.smithery.ai/@madosh/mcp-itsm/api/integration', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log('Integrations:', integrationsResponse.data);
}
```

## Monitoring

The monitoring setup provides real-time visibility into the health and performance of the platform.

### Monitoring Features

- **API Performance Metrics**: Response times, error rates, and throughput
- **Integration Health**: Status of connected integrations
- **Resource Utilization**: CPU, memory, and network usage
- **Alerting**: Critical and warning alerts for various conditions

### Setting Up Monitoring

Detailed monitoring setup instructions are available in the [monitoring/README.md](monitoring/README.md) file. The monitoring stack includes:

- Prometheus for metrics collection
- Grafana for visualization
- Alert Manager for notifications

## Connecting to ITSM Sandboxes

The easiest way to connect the ITSM Integration Platform with sandbox environments of different ITSM tools is through a standardized approach:

### 1. Create Developer Accounts

Sign up for developer accounts on each ITSM platform:
- **ServiceNow Developer Program**: https://developer.servicenow.com/
- **Atlassian (Jira) Developer Program**: https://developer.atlassian.com/
- **Zendesk Developer Program**: https://developer.zendesk.com/

### 2. Set Up Sandbox Instances

Each platform provides different methods for creating sandbox environments:
- **ServiceNow**: Create a Personal Developer Instance (PDI) from the developer portal
- **Jira**: Set up a Cloud Development site or use the Atlassian Cloud Development environment
- **Zendesk**: Create a trial account or sandbox instance from the developer portal

### 3. Generate API Credentials

For each platform, generate the necessary API credentials:

#### ServiceNow
- Create a Service Account or OAuth application
- For basic testing, you can use Basic Authentication with admin credentials
- For production, use OAuth with client ID and client secret

#### Jira
- Create an API token from your Atlassian account
- For cloud instances, create a OAuth application
- Note the base URL of your instance (e.g., `https://your-instance.atlassian.net`)

#### Zendesk
- Create an API token from the Admin Center
- For OAuth, register an OAuth client
- Note your subdomain (e.g., `https://your-subdomain.zendesk.com`)

### 4. Configure Integrations

Use the Integration Management UI in the ITSM Integration Platform to add each sandbox:

1. Log in as an admin or integrator
2. Navigate to "Create Integration"
3. Fill in the details for each integration:
   - Name (e.g., "ServiceNow Dev", "Jira Sandbox", "Zendesk Test")
   - Type (select the appropriate ITSM system)
   - Base URL (the URL of your sandbox instance)
   - Authentication method and credentials
   - Configure endpoints based on the APIs you need to access

### 5. Test & Verify Connections

After creating each integration:
1. Use the "Check Health" feature to verify connectivity
2. Create test requests to ensure data retrieval works correctly
3. Monitor the health dashboard to ensure stable connections

### 6. Sample Configuration

Here's a sample configuration for each system:

#### ServiceNow Example
```json
{
  "name": "ServiceNow Sandbox",
  "type": "servicenow",
  "config": {
    "baseUrl": "https://devXXXXX.service-now.com",
    "auth": {
      "type": "basic",
      "credentials": {
        "username": "admin",
        "password": "your-password"
      }
    }
  },
  "endpoints": [
    {
      "name": "getIncidents",
      "path": "/api/now/table/incident",
      "method": "GET"
    }
  ]
}
```

#### Jira Example
```json
{
  "name": "Jira Sandbox",
  "type": "jira",
  "config": {
    "baseUrl": "https://your-instance.atlassian.net",
    "auth": {
      "type": "token",
      "credentials": {
        "email": "your-email@example.com",
        "apiToken": "your-api-token"
      }
    }
  },
  "endpoints": [
    {
      "name": "getIssues",
      "path": "/rest/api/3/search",
      "method": "GET"
    }
  ]
}
```

#### Zendesk Example
```json
{
  "name": "Zendesk Sandbox",
  "type": "zendesk",
  "config": {
    "baseUrl": "https://your-subdomain.zendesk.com",
    "auth": {
      "type": "token",
      "credentials": {
        "email": "your-email@example.com/token",
        "apiToken": "your-api-token"
      }
    }
  },
  "endpoints": [
    {
      "name": "getTickets",
      "path": "/api/v2/tickets",
      "method": "GET"
    }
  ]
}
```

This standardized approach allows you to quickly connect to multiple ITSM sandboxes while managing all connections through a single interface.

## Development

### Prerequisites

- Node.js v14+
- MongoDB
- npm or yarn

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/itsm-integration-platform.git
cd itsm-integration-platform
```

2. Install backend dependencies:

```bash
cd backend
npm install
```

3. Install frontend dependencies:

```bash
cd ../frontend
npm install
```

4. Set up environment variables:

Create a `.env` file in the backend directory with:

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/itsm-platform
JWT_SECRET=your-secret-key
JWT_EXPIRE=30d
```

5. Run the application in development mode:

```bash
# In the backend directory
npm run dev

# In the frontend directory (in another terminal)
npm start
```

### Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
