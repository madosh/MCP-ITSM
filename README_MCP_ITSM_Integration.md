# MCP ITSM Integration: Handling Ticket Creation Across Different ITSM Systems

The Model Context Protocol (MCP) provides a unified interface for creating tickets across different ITSM systems while handling the unique requirements and differences of each system behind the scenes. Here's how MCP manages these differences:

## 1. Unified Interface vs. System-Specific Implementation

### Unified Interface (What the LLM and User See)
```json
{
  "name": "create_ticket",
  "description": "Create a new support ticket",
  "parameters": {
    "type": "object",
    "properties": {
      "title": {
        "type": "string",
        "description": "Title of the ticket"
      },
      "description": {
        "type": "string",
        "description": "Detailed description of the issue"
      },
      "priority": {
        "type": "string",
        "enum": ["low", "medium", "high", "critical"],
        "description": "Priority level of the ticket"
      }
    },
    "required": ["title", "description"]
  }
}
```

### Behind the Scenes (System-Specific Implementation)

#### ServiceNow Implementation
```python
def create_servicenow_ticket(parameters):
    # ServiceNow uses "short_description" for title and "description" for details
    # Priority is numeric: 1 (critical), 2 (high), 3 (medium), 4 (low)
    priority_map = {"critical": 1, "high": 2, "medium": 3, "low": 4}
    
    payload = {
        "short_description": parameters["title"],
        "description": parameters["description"],
        "priority": priority_map.get(parameters.get("priority", "medium"), 3),
        "urgency": priority_map.get(parameters.get("priority", "medium"), 3),
        "impact": priority_map.get(parameters.get("priority", "medium"), 3),
        "category": "Incident"  # ServiceNow specific field
    }
    
    # ServiceNow API call
    response = servicenow_connector.create_incident(payload)
    return format_response(response)
```

#### Jira Implementation
```python
def create_jira_ticket(parameters):
    # Jira uses "summary" for title and "description" for details
    # Priority is string: "Highest", "High", "Medium", "Low", "Lowest"
    priority_map = {"critical": "Highest", "high": "High", "medium": "Medium", "low": "Low"}
    
    payload = {
        "fields": {
            "project": {"key": "SUPPORT"},
            "summary": parameters["title"],
            "description": parameters["description"],
            "issuetype": {"name": "Bug"},
            "priority": {"name": priority_map.get(parameters.get("priority", "medium"), "Medium")},
            "labels": ["mcp-created"]  # Jira specific field
        }
    }
    
    # Jira API call
    response = jira_connector.create_issue(payload)
    return format_response(response)
```

#### Zendesk Implementation
```python
def create_zendesk_ticket(parameters):
    # Zendesk uses "subject" for title and "comment" for description
    # Priority is string: "urgent", "high", "normal", "low"
    priority_map = {"critical": "urgent", "high": "high", "medium": "normal", "low": "low"}
    
    payload = {
        "ticket": {
            "subject": parameters["title"],
            "comment": {"body": parameters["description"]},
            "priority": priority_map.get(parameters.get("priority", "medium"), "normal"),
            "type": "incident",  # Zendesk specific field
            "tags": ["mcp-created"]  # Zendesk specific field
        }
    }
    
    # Zendesk API call
    response = zendesk_connector.create_ticket(payload)
    return format_response(response)
```

## 2. LLM Reasoning for System Selection

The LLM uses a reasoning process to determine which ITSM system to use for a given ticket:

1. **Analyze the issue type**: Is it a software bug, hardware issue, customer support request, etc.?
2. **Apply organizational rules**: Different issue types may be routed to different systems
   - Software bugs → Jira
   - IT infrastructure issues → ServiceNow
   - Customer support → Zendesk
3. **Check for explicit system mention**: If the user specifies a system, use that
4. **Consider user history**: If the user typically uses a specific system, prefer that
5. **Default to organization's primary system**: Use the default if no other factors apply

## 3. MCP Architecture Components

The MCP ITSM integration consists of several key components:

1. **MCP Server**: Handles API requests and routes them to the appropriate ITSM system
2. **ITSM Service**: Provides a unified interface to multiple ITSM systems
3. **System Connectors**: System-specific implementations for each ITSM platform
4. **Context Protocol**: Maintains state and context throughout the request lifecycle
5. **LLM Handler**: Processes user messages and determines when to call ITSM tools

## 4. Available MCP Tools

The MCP ITSM integration provides the following tools:

- **get_ticket**: Retrieve details of an existing ticket
- **create_ticket**: Create a new ticket
- **update_ticket**: Update an existing ticket
- **list_tickets**: List tickets with optional filtering
- **assign_ticket**: Assign a ticket to a user
- **add_comment**: Add a comment to an existing ticket
- **search_knowledge_base**: Search for articles related to an issue

## 5. Smithery Integration

The MCP ITSM tools can be integrated with Smithery using the provided configuration:

```yaml
# MCP Tools configuration
tools:
  # Path to the tools directory
  directory: ./smithery
  # Main module that exports the tools
  main: index.js
  # Environment variables for the tools
  env:
    MCP_BASE_URL: process.env.MCP_BASE_URL || 'http://localhost:5000'
    API_KEY: process.env.API_KEY || ''
  # Tool definitions
  definitions:
    - get_ticket
    - create_ticket
    - update_ticket
    - list_tickets
    - assign_ticket
    - add_comment
    - search_knowledge_base
```

## 6. Demo Mode

The MCP server can run in demo mode, which returns mock responses instead of making actual API calls. This is useful for testing and development.

To enable demo mode, set the `API_KEY` environment variable to an empty string or omit it entirely.

## 7. Getting Started

1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Configure your ITSM systems in `.env`
4. Start the server: `python app.py`
5. Test the endpoints: `python test_mcp.py`

For Smithery integration:
1. Navigate to the smithery directory: `cd smithery`
2. Install dependencies: `npm install`
3. Start the Smithery server: `npm start` 