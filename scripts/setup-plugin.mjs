#!/usr/bin/env node
/**
 * Generate plugin/.mcp.json so the Cowork/Desktop/CLI plugin ships its own
 * connector — pointing at the MCP server built in THIS repo.
 *
 * Why absolute paths: the server is a local stdio process that resolves
 * @kg/core and its embeddings dep from this repo's node_modules, so it must run
 * in place (that's what keeps local SEMANTIC SEARCH working). The plugin is
 * copied into a cache on install, so a relative path wouldn't reach the server.
 * The generated file is machine-specific and therefore gitignored — every
 * cloner runs `npm run setup` to write their own.
 *
 *   npm run setup     # build + write plugin/.mcp.json, then `claude plugins add ./plugin`
 */
import { existsSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const serverPath = join(repoRoot, "apps", "mcp", "dist", "index.js");
const mcpJsonPath = join(repoRoot, "plugin", ".mcp.json");

if (!existsSync(serverPath)) {
  console.error(`\nMCP server not built yet: ${serverPath}`);
  console.error(`Run "npm run build" first, then "npm run setup".\n`);
  process.exit(1);
}

const config = {
  mcpServers: {
    "knowledge-capture": {
      command: process.execPath, // absolute path to this node binary
      args: [serverPath],
    },
  },
};

writeFileSync(mcpJsonPath, JSON.stringify(config, null, 2) + "\n");

console.log(`Wrote ${mcpJsonPath}`);
console.log(`  command: ${process.execPath}`);
console.log(`  server:  ${serverPath}`);
console.log(`\nNext:`);
console.log(`  claude plugins add ${join(repoRoot, "plugin")}`);
console.log(`  # then restart Cowork / Claude Desktop (or /reload-plugins in the CLI)`);
console.log(`\nThe plugin now carries both the 3 skills and the local connector.`);
console.log(`If you previously added the server with "claude mcp add knowledge-capture",`);
console.log(`remove that one to avoid a duplicate connector.`);
