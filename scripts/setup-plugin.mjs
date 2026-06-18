#!/usr/bin/env node
/**
 * Register the knowledge-capture MCP connector for the Claude Code CLI, pointing
 * at the server built in THIS repo and at a single shared store.
 *
 * Design: the plugin (plugin/) is skills-only. The connector is configured once
 * per surface so both surfaces share one store:
 *   - Cowork / Desktop: claude_desktop_config.json (managed in-app)
 *   - Claude Code CLI:   this script -> `claude mcp add` (user scope)
 *
 * KG_HOME resolution (so CLI and Cowork agree automatically):
 *   1. $KG_HOME if set
 *   2. the KG_HOME already configured for knowledge-capture in Cowork/Desktop
 *   3. ~/.knowledge-capture (the built-in default)
 *
 *   npm run setup
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const serverPath = join(repoRoot, "apps", "mcp", "dist", "index.js");

if (!existsSync(serverPath)) {
  console.error(`\nMCP server not built yet: ${serverPath}`);
  console.error(`Run "npm run build" first (or just "npm run setup").\n`);
  process.exit(1);
}

/** Reuse the KG_HOME Cowork/Desktop already uses, so both surfaces share a store. */
function kgHomeFromDesktop() {
  const cfg = join(homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
  try {
    const j = JSON.parse(readFileSync(cfg, "utf-8"));
    return j?.mcpServers?.["knowledge-capture"]?.env?.KG_HOME || null;
  } catch {
    return null;
  }
}

const kgHome = process.env.KG_HOME || kgHomeFromDesktop() || join(homedir(), ".knowledge-capture");
const source = process.env.KG_HOME ? "$KG_HOME" : kgHomeFromDesktop() ? "Cowork/Desktop config" : "default";

function claude(args) {
  return execFileSync("claude", args, { stdio: ["ignore", "pipe", "pipe"] }).toString();
}

try {
  // Idempotent: drop any prior user-scope entry, then add fresh.
  try { claude(["mcp", "remove", "knowledge-capture", "-s", "user"]); } catch { /* none yet */ }
  claude(["mcp", "add", "knowledge-capture", "-s", "user", "-e", `KG_HOME=${kgHome}`, "--", process.execPath, serverPath]);
} catch (e) {
  console.error(`\nCouldn't run "claude mcp add" automatically: ${e.message?.split("\n")[0] ?? e}`);
  console.error(`Run it yourself:\n  claude mcp add knowledge-capture -s user -e KG_HOME="${kgHome}" -- "${process.execPath}" "${serverPath}"\n`);
  process.exit(1);
}

console.log(`Registered the CLI connector "knowledge-capture":`);
console.log(`  store (KG_HOME): ${kgHome}   [from ${source}]`);
console.log(`  server:          ${serverPath}`);
console.log(`\nNow install the skills plugin:`);
console.log(`  CLI:    claude plugin marketplace add ${repoRoot}`);
console.log(`          claude plugin install knowledge-capture@knowledge-capture-local`);
console.log(`  Cowork: upload the ${join(repoRoot, "plugin")} folder via the in-app plugin manager`);
console.log(`          (its connector is already in claude_desktop_config.json — keep that one).`);
console.log(`\nThen restart Cowork / Desktop, or /reload-plugins in the CLI.`);
