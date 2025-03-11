# ITSM Integration Platform Diagrams

This folder contains Mermaid diagrams that explain the architecture and functionality of the ITSM Integration Platform.

## Diagrams Overview

### Original MCP-ITSM Diagrams
1. **system_architecture.mmd** - Original MCP system architecture
2. **data_flow.mmd** - Original data flow between MCP components
3. **entity_relationship.mmd** - Original database entity relationships
4. **authentication_flow.mmd** - Original user authentication process
5. **context_lifecycle.mmd** - Original lifecycle states of a context
6. **component_architecture.mmd** - Original component-level architecture

### ITSM Integration Platform Diagrams
7. **itsm_integration_architecture.mmd** - Updated system architecture for ITSM Integration
8. **authentication_flow_updated.mmd** - Updated authentication workflow for ITSM Integration
9. **integration_workflow.mmd** - Workflow for creating and using integrations
10. **monitoring_architecture.mmd** - Monitoring stack architecture
11. **itsm_data_model.mmd** - Updated entity relationship diagram for ITSM Integration

### MCP-ITSM Relationship Diagrams
12. **mcp_architecture_relationship.mmd** - Illustrates how MCP enables the ITSM Integration Platform
13. **mcp_enabled_flow.mmd** - Technical flowchart showing how MCP components power the solution
14. **chat_client_mcp_integration.mmd** - Sequence diagram of Chat Client interaction with MCP to create tickets

## Viewing the Diagrams

These diagrams are written in Mermaid format. You can view them using:

- GitHub (which natively renders Mermaid in markdown)
- VS Code with the Mermaid extension
- The official Mermaid Live Editor: https://mermaid.live/
- Any Markdown editor that supports Mermaid

## Adding New Diagrams

To add a new diagram:

1. Create a new `.mmd` file following the naming convention
2. Use Mermaid syntax to create your diagram
3. Update this README to include your new diagram
4. Test your diagram in a Mermaid renderer before committing 