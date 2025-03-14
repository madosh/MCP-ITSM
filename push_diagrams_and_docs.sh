#!/bin/bash

echo "Pushing diagrams and documentation files to GitHub..."

# Make sure we're on the main branch
git checkout main

# Add the diagram and documentation files
git add llm_reasoning_diagram.drawio
git add mcp_itsm_architecture.drawio
git add README_MCP_ITSM_Integration.md

# Add the Smithery integration files
git add smithery/
git add smithery.yaml
git add start_smithery.bat
git add push_smithery_changes.sh
git add push_smithery_changes.bat
git add git_push_smithery.sh
git add git_push_to_main.sh

# Check status
echo "Git status:"
git status

# Commit the changes
git commit -m "Add diagrams, documentation, and Smithery integration"

# Push to GitHub main branch
git push origin main

echo "Done!"
read -p "Press Enter to continue..." 