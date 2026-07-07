#!/usr/bin/env node
/**
 * Register the koan MCP connector for the Claude Code CLI, pointing
 * at the server built in THIS repo and at a single shared store.
 *
 * Design: the plugin (plugin/) is skills-only. The connector is configured once
 * per surface so both surfaces share one store:
 *   - Cowork / Desktop: claude_desktop_config.json (managed in-app)
 *   - Claude Code CLI:   this script -> `claude mcp add` (user scope)
 *
 * KOAN_HOME resolution (so CLI and Cowork agree automatically):
 *   1. $KOAN_HOME if set
 *   2. the KOAN_HOME already configured for koan in Cowork/Desktop
 *   3. ~/.koan (the built-in default)
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

/** Reuse the store Cowork/Desktop already uses, so both surfaces share one.
 *  Checks the current `koan` connector first, then the pre-rename
 *  `knowledge-capture` / `KG_HOME` so existing setups migrate cleanly. */
function koanHomeFromDesktop() {
  const cfg = join(homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
  try {
    const servers = JSON.parse(readFileSync(cfg, "utf-8"))?.mcpServers ?? {};
    const env = servers["koan"]?.env ?? servers["knowledge-capture"]?.env ?? {};
    return env.KOAN_HOME || env.KG_HOME || null;
  } catch {
    return null;
  }
}

const koanHome =
  process.env.KOAN_HOME || process.env.KG_HOME || koanHomeFromDesktop() || join(homedir(), ".koan");
const source =
  process.env.KOAN_HOME || process.env.KG_HOME
    ? "env"
    : koanHomeFromDesktop()
      ? "Cowork/Desktop config"
      : "default";

function claude(args) {
  return execFileSync("claude", args, { stdio: ["ignore", "pipe", "pipe"] }).toString();
}

try {
  // Idempotent: drop any prior user-scope entry, then add fresh.
  try { claude(["mcp", "remove", "koan", "-s", "user"]); } catch { /* none yet */ }
  claude(["mcp", "add", "koan", "-s", "user", "-e", `KOAN_HOME=${koanHome}`, "--", process.execPath, serverPath]);
} catch (e) {
  console.error(`\nCouldn't run "claude mcp add" automatically: ${e.message?.split("\n")[0] ?? e}`);
  console.error(`Run it yourself:\n  claude mcp add koan -s user -e KOAN_HOME="${koanHome}" -- "${process.execPath}" "${serverPath}"\n`);
  process.exit(1);
}

console.log(`Registered the CLI connector "koan":`);
console.log(`  store (KOAN_HOME): ${koanHome}   [from ${source}]`);
console.log(`  server:          ${serverPath}`);
console.log(`\nNow install the skills plugin:`);
console.log(`  CLI:    claude plugin marketplace add ${repoRoot}`);
console.log(`          claude plugin install koan@koan`);
console.log(`  Cowork: upload the ${join(repoRoot, "plugin")} folder via the in-app plugin manager`);
console.log(`          (its connector is already in claude_desktop_config.json — keep that one).`);
console.log(`\nThen restart Cowork / Desktop, or /reload-plugins in the CLI.`);
