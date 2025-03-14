#!/bin/bash

echo "Pushing Smithery MCP tools integration to main branch..."

# Make sure we're on the main branch
git checkout main

# Add the files explicitly with full paths
git add ./smithery/
git add ./smithery.yaml
git add ./start_smithery.bat
git add ./push_smithery_changes.sh
git add ./push_smithery_changes.bat
git add ./git_push_smithery.sh

# Check status
echo "Git status:"
git status

# Commit the changes
git commit -m "Add Smithery MCP tools integration"

# Push to GitHub main branch
git push origin main

echo "Done!"
read -p "Press Enter to continue..." 