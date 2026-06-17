#!/usr/bin/env bash

#
# fetch-page.sh - Bash wrapper for Puppeteer-based web content fetching
#
# Usage: fetch-page.sh <url> [output-dir]
#
# Environment variables:
#   EXTRACT_KNOWLEDGE_SKILL - Path to extract-knowledge skill (auto-detected)
#   FETCH_METHOD - "puppeteer" (default) or "webreader"
#   FETCH_DELAY - Seconds to wait between fetches (default: 2)
#

set -e

# Get the script directory - works even when sourced
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default values
FETCH_METHOD="${FETCH_METHOD:-puppeteer}"
FETCH_DELAY="${FETCH_DELAY:-2}"
URL="${1:-}"
OUTPUT_DIR="${2:-.}"

# Validate inputs
if [ -z "$URL" ]; then
  echo "Usage: fetch-page.sh <url> [output-dir]" >&2
  exit 1
fi

# Create output directory if needed
mkdir -p "$OUTPUT_DIR"

# Fetch based on method
case "$FETCH_METHOD" in
  puppeteer)
    # Use Puppeteer for JavaScript-rendered content
    node "$SCRIPT_DIR/fetch-rendered.js" "$URL" "$OUTPUT_DIR"
    ;;
  webreader)
    # Fallback to simple curl (would need MCP webReader in context)
    # This is a placeholder - actual implementation would call mcp__web_reader__webReader
    echo "Error: webreader method requires MCP context" >&2
    exit 1
    ;;
  *)
    echo "Error: Unknown FETCH_METHOD '$FETCH_METHOD'. Use 'puppeteer' or 'webreader'" >&2
    exit 1
    ;;
esac

# Rate limiting delay
if [ "$FETCH_DELAY" -gt 0 ]; then
  sleep "$FETCH_DELAY"
fi

