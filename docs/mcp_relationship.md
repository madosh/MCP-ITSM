# MCP and ITSM Integration Platform Relationship

## Overview

This document explains how the Multi-Channel Platform (MCP) enables and powers the ITSM Integration Platform. It clarifies the relationship between these two components and how they work together to provide a unified interface for multiple ITSM systems.

## What is MCP?

The Multi-Channel Platform (MCP) is a foundational infrastructure that provides:

1. **Core Services:**
   - Authentication and authorization
   - API gateway and request routing
   - Configuration management
   - Deployment and scaling
   - Security layer
   - Logging and monitoring

2. **Infrastructure Components:**
   - Server hosting and management
   - Database connections
   - WebSocket handling
   - Service discovery

3. **Development Framework:**
   - Common libraries and utilities
   - Standardized API patterns
   - Deployment pipelines
   - Testing frameworks

## How ITSM Integration Platform Leverages MCP

The ITSM Integration Platform is built **on top of** MCP, using MCP as its foundation. Here's how the relationship works:

1. **MCP provides the infrastructure:**
   - The ITSM Integration Platform is deployed via MCP's deployment service
   - User authentication is handled by MCP's authentication service
   - API requests are routed through MCP's API gateway
   - Configuration is stored in MCP's configuration store

2. **ITSM Integration Platform extends MCP with specialized capabilities:**
   - ITSM-specific adapters for ServiceNow, Jira, Zendesk, etc.
   - Integration health monitoring
   - Data normalization across different ITSM systems
   - Unified API for ticket management

3. **Key Benefits of this Architecture:**
   - The ITSM platform doesn't need to re-implement core functionality
   - Updates to MCP automatically benefit the ITSM platform
   - Consistent security and authentication patterns
   - Reduced development time and maintenance costs

## Technical Implementation

The relationship is implemented as follows:

1. **Hosting and Deployment:**
   - The ITSM Integration Platform is packaged and deployed via `smithery.yaml`
   - MCP handles the containerization and orchestration

2. **Authentication Flow:**
   - User login requests go through MCP's authentication service
   - JWTs issued by MCP are used for ITSM API authorization
   - Role-based access control is managed at the MCP level

3. **API Routing:**
   - The MCP API gateway routes requests to the appropriate ITSM endpoints
   - The gateway handles rate limiting, request validation, and logging

4. **Configuration Management:**
   - Integration settings are stored in MCP's configuration database
   - The ITSM platform retrieves these settings as needed

## The Chat Client Example

The Chat Client we've implemented provides a concrete example of how this architecture works:

1. User enters a message in the Chat Client UI
2. The UI makes a request to `/api/ticket/create/{integrationId}`
3. MCP authenticates the request and retrieves the integration configuration
4. The ITSM Integration Platform uses this information to:
   - Format the ticket for the target system
   - Connect to the appropriate ITSM system
   - Handle the API-specific authentication
   - Create the ticket
   - Return a normalized response

This demonstrates how MCP provides the core infrastructure, while the ITSM Integration Platform adds the specialized ITSM functionality.

## References

For visual representations of this relationship, see the following diagrams:

1. [MCP Architecture Relationship](../diagrams/mcp_architecture_relationship.mmd)
2. [MCP Enabled Flow](../diagrams/mcp_enabled_flow.mmd)
3. [Chat Client MCP Integration](../diagrams/chat_client_mcp_integration.mmd)

These diagrams illustrate the components, flow, and interactions between MCP and the ITSM Integration Platform. 