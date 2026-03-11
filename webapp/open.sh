#!/usr/bin/env bash
# Opens the Claude SEO Plugin Marketplace web app in your default browser.
# Usage: ./webapp/open.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FILE="$SCRIPT_DIR/index.html"

if [ ! -f "$FILE" ]; then
  echo "Error: index.html not found at $FILE"
  exit 1
fi

echo "Opening Claude SEO Plugin Marketplace..."

# Cross-platform browser open
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$FILE"
elif command -v open >/dev/null 2>&1; then
  open "$FILE"
elif command -v start >/dev/null 2>&1; then
  start "$FILE"
else
  echo "Could not detect browser. Open this file manually:"
  echo "  $FILE"
fi
