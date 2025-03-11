# ITSM Integration Platform

A comprehensive platform for integrating with various IT Service Management (ITSM) systems through a unified API. This repository contains the backend API, client application, monitoring setup, and documentation.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Deployment](#deployment)
- [Client Application](#client-application)
- [API Documentation](#api-documentation)
- [Monitoring](#monitoring)
- [Development](#development)
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
