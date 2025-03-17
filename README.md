# MCP ITSM Integration

A Model Context Protocol (MCP) implementation for IT Service Management (ITSM) tools, designed to work with Smithery.

## Overview

This project provides a unified interface for LLMs to interact with multiple ITSM systems (ServiceNow, Jira, Zendesk, Ivanti Neurons for ITSM, and Cherwell) using the Model Context Protocol (MCP). Instead of requiring LLMs to learn different APIs for each ITSM system, this integration provides a standardized set of tools that work across all systems.

![MCP ITSM Architecture](./diagrams/mcp_itsm_architecture.png)

## MCP Server Information

This is an MCP-compliant server that implements the Model Context Protocol specification. It provides a standardized interface for Large Language Models to interact with multiple ITSM systems through a unified set of tools.

### MCP Compatibility
- **Protocol Version**: MCP 1.0
- **Tool Format**: JSON Schema compliant
- **Runtime**: Node.js
- **Transport**: HTTP and stdio
- **Authentication**: API key

### MCP Server Usage
The server can be used directly with any MCP-compatible client, including:
- MCP Inspector CLI tool
- Claude via MCP integration
- Any LLM with MCP support

To inspect the server locally:
```bash
npx @modelcontextprotocol/inspector node index.js
```

## Features

- **Unified Interface**: Consistent tool definitions across all ITSM systems
- **Intelligent Routing**: Automatically routes requests to the appropriate ITSM system
- **Context Management**: Maintains context across interactions
- **MCP Compliant**: Follows the Model Context Protocol specification
- **Smithery Integration**: Designed to work seamlessly with Smithery

## Prerequisites

- Node.js (v14 or higher)
- Smithery CLI
- Access to ITSM systems (ServiceNow, Jira, Zendesk, Ivanti Neurons for ITSM, Cherwell)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/mcp-itsm.git
   cd mcp-itsm
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure your ITSM credentials (see Configuration section)

4. Deploy to Smithery:
   ```
   smithery deploy
   ```

## Configuration

### ITSM Credentials

Create a `.env` file with your ITSM credentials:

```
# ServiceNow
SERVICENOW_INSTANCE=your-instance
SERVICENOW_USERNAME=your-username
SERVICENOW_PASSWORD=your-password

# Jira
JIRA_URL=https://your-instance.atlassian.net
JIRA_USERNAME=your-username
JIRA_API_TOKEN=your-api-token

# Zendesk
ZENDESK_URL=https://your-instance.zendesk.com
ZENDESK_EMAIL=your-email
ZENDESK_API_TOKEN=your-api-token

# Ivanti Neurons for ITSM
IVANTI_URL=https://your-instance.ivanti.com
IVANTI_CLIENT_ID=your-client-id
IVANTI_CLIENT_SECRET=your-client-secret
IVANTI_TENANT_ID=your-tenant-id

# Cherwell
CHERWELL_URL=https://your-instance.cherwell.com
CHERWELL_CLIENT_ID=your-client-id
CHERWELL_AUTH_MODE=internal
CHERWELL_USERNAME=your-username
CHERWELL_PASSWORD=your-password
```

### Smithery Configuration

The `smithery.yaml` file configures how your tools are deployed to Smithery:

```yaml
name: mcp-itsm
description: MCP ITSM Tools for ticket management across multiple systems
version: 1.0.0
tools: ./tools.json
command: node index.js
```

## Available Tools

This integration provides the following tools:

- **create_ticket**: Create a new ticket in any ITSM system
- **get_ticket**: Retrieve ticket details
- **update_ticket**: Update an existing ticket
- **list_tickets**: List tickets with filtering options
- **assign_ticket**: Assign a ticket to a user
- **add_comment**: Add a comment to a ticket
- **search_knowledge_base**: Search the knowledge base for relevant articles

See `tools.json` for the complete tool definitions.

## Usage

Once deployed to Smithery, LLMs can use these tools to interact with your ITSM systems. Here's an example of how an LLM might create a ticket:

```
User: "I need to report a bug in our accounting software"

LLM: (Makes a tool call)
{
  "type": "tool_call",
  "data": {
    "name": "create_ticket",
    "parameters": {
      "title": "Bug in accounting software",
      "description": "User reported an issue with the accounting software",
      "priority": "medium",
      "system": "jira"
    }
  }
}

Response:
{
  "type": "tool_response",
  "data": {
    "name": "create_ticket",
    "content": {
      "id": "ACCT-123",
      "status": "open",
      "url": "https://your-instance.atlassian.net/browse/ACCT-123"
    }
  }
}
```

## Debugging

This project includes several debugging tools:

- `debug_smithery_mcp.bat`: Diagnoses MCP-specific issues with Smithery
- `force_redeploy_smithery.bat`: Forces redeployment with MCP configuration
- `test_tools.js`: Tests MCP tool calls locally

## Documentation

- [MCP Integration](./MCP_INTEGRATION.md): Details of the Model Context Protocol implementation
- [MCP Quick Reference](./MCP_QUICK_REFERENCE.md): Quick reference guide for MCP concepts
- [ITSM Systems Reference](./ITSM_SYSTEMS_REFERENCE.md): Detailed information about each supported ITSM system
- [OpenAI to MCP Conversion](./OPENAI_TO_MCP_CONVERSION.md): Guide for converting from OpenAI function calling to MCP

## Diagrams

- [MCP ITSM Architecture](./diagrams/mcp_itsm_architecture.png): Overall architecture of the integration
- [System Fragmentation](./diagrams/system_fragmentation.png): The challenge of ITSM system fragmentation
- [LLM Reasoning](./diagrams/llm_reasoning.png): How LLMs select the appropriate ITSM system
- [Benefits Comparison](./diagrams/benefits_comparison.png): Comparison of traditional vs. MCP approach
- [Smithery Integration](./diagrams/smithery_integration.png): How MCP integrates with Smithery

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Resources

- [Model Context Protocol](https://modelcontextprotocol.io)
- [Smithery Documentation](https://docs.smithery.io)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
<a href="https://glama.ai/mcp/servers/hud80wep9g">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/hud80wep9g/badge" />
</a>