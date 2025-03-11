# MCP-ITSM: Model Context Protocol for ITSM

This project implements a Model Context Protocol (MCP) system designed to be hosted alongside or integrated with IT Service Management (ITSM) tools.

## Overview

The Model Context Protocol facilitates intelligent context management for AI/ML models within ITSM workflows. It provides:

- Contextual awareness for AI-powered service desk interactions
- Knowledge management integrations
- Workflow optimization through contextual understanding
- Audit trails of context usage

## Architecture

The system consists of:

- **Backend API**: Node.js/Express server providing REST endpoints
- **Frontend UI**: React-based administration dashboard
- **Database**: MongoDB for storing context data
- **Authentication**: JWT-based auth system

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 5+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/MCP-ITSM.git
cd MCP-ITSM

# Install dependencies for backend
cd backend
npm install

# Install dependencies for frontend
cd ../frontend
npm install
```

### Running the Application

```bash
# Start backend server
cd backend
npm run dev

# In another terminal, start frontend
cd frontend
npm run dev
```

The application will be available at http://localhost:3000

## Features

- **Context Management**: Store and retrieve context for AI model interactions
- **Integration APIs**: Connect with existing ITSM tools
- **Admin Dashboard**: Monitor and manage context data
- **Audit Logs**: Track all context usage for compliance

## License

MIT 