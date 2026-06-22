#!/usr/bin/env node
/**
 * Build a `.mcpb` Desktop Extension for Koan — the zero-terminal install path.
 *
 * A `.mcpb` is a zip the user double-clicks in Finder; Claude Desktop / Cowork
 * shows an install dialog and registers the connector for them. No Node, no npm,
 * no git, no hand-editing claude_desktop_config.json.
 *
 * What this produces (in build/mcpb/, then zipped to koan.mcpb):
 *   manifest.json        — describes the server + the KOAN_HOME config field
 *   server/index.js      — the MCP server, esbuild-bundled (core + sdk inlined)
 *   server/ui/card.js    — the interactive draft-review card
 *   node_modules/        — ONLY @xenova/transformers (+ onnxruntime-node, which
 *                          ships darwin/linux/win32 binaries) so local semantic
 *                          search keeps working inside the bundle
 *
 * Everything except @xenova/transformers is inlined by esbuild, so the bundle is
 * small and self-contained. The embedding model itself is NOT bundled — it
 * downloads on first use and caches on disk, exactly as in a source install.
 *
 *   npm run pack:mcpb
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync, copyFileSync, cpSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const stage = join(repoRoot, "build", "mcpb");
const serverDir = join(stage, "server");

const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { stdio: "inherit", cwd: repoRoot, ...opts });

console.log("→ Building @koan/core + the card UI (npm run build)…");
run("npm", ["run", "build"]);

console.log("→ Staging at build/mcpb/ …");
rmSync(stage, { recursive: true, force: true });
mkdirSync(join(serverDir, "ui"), { recursive: true });

// 1. Bundle the server. Everything inlines EXCEPT @xenova/transformers, which
//    loads native .node binaries + downloads model assets at runtime and so must
//    stay an installed dependency (resolved from the bundle's node_modules).
console.log("→ Bundling server/index.js (esbuild)…");
run(join(repoRoot, "node_modules", ".bin", "esbuild"), [
  join(repoRoot, "apps", "mcp", "dist", "index.js"),
  "--bundle",
  "--platform=node",
  "--format=esm",
  "--target=node18",
  "--external:@xenova/transformers",
  `--outfile=${join(serverDir, "index.js")}`,
]);

// 2. The card UI is read relative to server/index.js via import.meta.url.
copyFileSync(
  join(repoRoot, "apps", "mcp", "dist", "ui", "card.js"),
  join(serverDir, "ui", "card.js"),
);

// 2b. Fold the skills into the bundle. The server reads server/skills/<name>/
//     SKILL.md at startup and exposes each as a prompt (/mcp__koan__<name>), so
//     one-click users get the workflows without the in-app plugin manager.
cpSync(join(repoRoot, "plugin", "skills"), join(serverDir, "skills"), { recursive: true });
const skillNames = readdirSync(join(serverDir, "skills")).filter((n) =>
  existsSync(join(serverDir, "skills", n, "SKILL.md")),
);
console.log(`→ Bundled ${skillNames.length} skills as prompts: ${skillNames.join(", ")}`);

// 3. A minimal package.json so `npm install` pulls ONLY the embedding stack.
writeFileSync(
  join(stage, "package.json"),
  JSON.stringify(
    {
      name: "koan-mcpb",
      version: "0.1.0",
      private: true,
      type: "module",
      dependencies: { "@xenova/transformers": "^2.17.2" },
    },
    null,
    2,
  ) + "\n",
);

console.log("→ Installing the embedding stack into the bundle (npm install)…");
run("npm", ["install", "--omit=dev", "--no-audit", "--no-fund", "--silent"], { cwd: stage });

// 4. The manifest: declares the node server and a single friendly config field
//    for where the local store lives. Defaults to a visible Documents folder so
//    non-technical users can find/back-up their knowledge.
const manifest = {
  manifest_version: "0.2",
  name: "koan",
  display_name: "Koan",
  version: "0.1.0",
  description:
    "Capture the firm's 'how do we do X' know-how, review it, and recall it — all stored locally on your own machine. No API key; nothing leaves your box.",
  long_description: [
    "**Koan keeps your firm's know-how on your own machine.** It captures",
    '"how do we do X" procedures, lets a human review them, and recalls them',
    "later — grounded in your firm's own answers, not generic advice.",
    "",
    "**What it can access:** only the one knowledge folder you choose during",
    "install (plain markdown files). It reads and writes there and nowhere else —",
    "unit ids are path-checked so they can't escape that folder.",
    "",
    "**What it does *not* do:**",
    "",
    "- No API key, and it never calls Claude or any AI service — Claude (the app",
    "  you're already using) does all the thinking; this server is just local",
    "  storage and search.",
    "- No telemetry, analytics, or phoning home.",
    "- Your captured knowledge never leaves your computer.",
    "",
    "Like every local extension, the install dialog warns that it runs on your",
    "computer — that's how Koan can keep your data fully local instead of sending",
    "it to a server. The source is open (MIT) and auditable.",
  ].join("\n"),
  author: { name: "Sam Harden", url: "https://github.com/<your-username>" },
  homepage: "https://github.com/<your-username>/koan",
  documentation: "https://github.com/<your-username>/koan#readme",
  support: "https://github.com/<your-username>/koan/issues",
  license: "MIT",
  server: {
    type: "node",
    entry_point: "server/index.js",
    mcp_config: {
      command: "node",
      args: ["${__dirname}/server/index.js"],
      env: { KOAN_HOME: "${user_config.koan_home}" },
    },
  },
  tools: [
    { name: "search_knowledge", description: "Search captured knowledge and ingested documents." },
    { name: "capture_knowledge", description: "Save a structured draft of a firm process for review." },
    { name: "ingest_document", description: "Index a document's text into searchable memory." },
    { name: "review_queue", description: "List drafts awaiting human review." },
    { name: "promote_unit", description: "Promote a reviewed draft to authoritative firm knowledge." },
    { name: "reject_draft", description: "Discard a draft." },
    { name: "list_units", description: "List captured units." },
    { name: "read_unit", description: "Read one unit's full markdown." },
    { name: "open_draft", description: "Render a draft/unit as an interactive review card." },
    { name: "update_draft", description: "Edit a draft's fields." },
  ],
  // The bundled skills are registered as prompts at runtime (slash commands like
  // /mcp__koan__capture) — see apps/mcp/src/skills.ts.
  prompts_generated: true,
  user_config: {
    koan_home: {
      type: "directory",
      title: "Knowledge store folder",
      description:
        "Where your captured knowledge is saved (plain files, local only). Pick a synced or backed-up folder if you want it safe across machines. To share one store with the Claude Code CLI, point both at the same folder.",
      required: false,
      default: "${HOME}/Documents/Koan",
    },
  },
  compatibility: {
    platforms: ["darwin"],
    runtimes: { node: ">=18.0.0" },
  },
};
writeFileSync(join(stage, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

// 5. Pack into koan.mcpb.
console.log("→ Packing koan.mcpb (npx @anthropic-ai/mcpb)…");
const out = join(repoRoot, "koan.mcpb");
run("npx", ["--yes", "@anthropic-ai/mcpb", "pack", stage, out]);

console.log(`\n✓ Built ${out}`);
console.log("  Double-click it in Finder to install into Claude Desktop / Cowork.");
