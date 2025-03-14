#!/bin/bash

echo "Pushing Smithery MCP tools integration to GitHub..."

# Make sure we're on the clean-branch
git checkout clean-branch

# Add the files explicitly with full paths
git add ./smithery/
git add ./smithery.yaml
git add ./start_smithery.bat
git add ./push_smithery_changes.sh
git add ./push_smithery_changes.bat

# Check status
echo "Git status:"
git status

# Commit the changes
git commit -m "Add Smithery MCP tools integration"

# Push to GitHub
git push -u origin clean-branch

echo "Done!"
read -p "Press Enter to continue..." 