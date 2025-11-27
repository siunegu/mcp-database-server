#!/bin/sh
# Load environment variables from .env.mysql
. "$(dirname "$0")/../.env.mysql"

# Redirect stderr to a log file to prevent it from interfering with MCP JSON-RPC on stdout
# The MCP server logs to stderr, but we need to keep stderr clean too
exec node "$(dirname "$0")/../dist/src/index.js" --mysql "$@" 2>/tmp/mcp-mysql-debug.log
