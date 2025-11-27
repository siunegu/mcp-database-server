#!/usr/bin/env node
// Fast MySQL MCP launcher. Usage: MCP_ env vars set, then:
//   npm run mcpdb -- <database> [--extra-flags]

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
let dbArg;
const passthrough = [];

if (args.length && !args[0].startsWith('--')) {
  dbArg = args.shift();
}
passthrough.push(...args);

const host = process.env.MCP_MYSQL_HOST;
const database = dbArg || process.env.MCP_MYSQL_DATABASE || process.env.MCP_MYSQL_DB;
const user = process.env.MCP_MYSQL_USER;
const password = process.env.MCP_MYSQL_PASSWORD;
const port = process.env.MCP_MYSQL_PORT;

if (!host || !database) {
  console.error('[ERROR] Set MCP_MYSQL_HOST and MCP_MYSQL_DATABASE (or pass <database> as first arg).');
  process.exit(1);
}

const cmd = 'node';
const script = path.join(__dirname, '..', 'dist', 'src', 'index.js');

const finalArgs = [
  script,
  '--mysql',
  '--host', host,
  '--database', database,
];

if (user) finalArgs.push('--user', user);
if (password) finalArgs.push('--password', password);
if (port) finalArgs.push('--port', port);

// Extra flags after the db name (e.g., --ssl true)
finalArgs.push(...passthrough);

console.error('[INFO] Starting MCP MySQL server', { host, database, user, port });
const child = spawn(cmd, finalArgs, { stdio: 'inherit' });

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`[INFO] MCP server exited with signal ${signal}`);
  } else {
    console.error(`[INFO] MCP server exited with code ${code}`);
  }
});
