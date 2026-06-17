#!/usr/bin/env node
/**
 * Install (or remove) the plugin's skills into the user's personal skills
 * directory (~/.claude/skills) so they load in Cowork, Claude Desktop, and the
 * Claude Code CLI alike — no plugin marketplace required.
 *
 *   npm run install-skills      # symlink plugin/skills/* -> ~/.claude/skills/*
 *   npm run install-skills -- --copy    # copy instead of symlink
 *   npm run uninstall-skills    # remove the links/copies we created
 *
 * Idempotent: re-running re-points our own links and never touches a skill we
 * didn't create (a name collision we don't own is reported and skipped).
 */
import { cpSync, lstatSync, mkdirSync, readdirSync, readlinkSync, rmSync, symlinkSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, "..", "plugin", "skills");
const DEST = join(homedir(), ".claude", "skills");

const args = process.argv.slice(2);
const uninstall = args.includes("--uninstall");
const copy = args.includes("--copy");

const skills = readdirSync(SRC, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

if (skills.length === 0) {
  console.error(`No skills found in ${SRC}.`);
  process.exit(1);
}

mkdirSync(DEST, { recursive: true });

/** Does this dest entry belong to us (a symlink back into our repo)? */
function ownedByUs(path) {
  try {
    const st = lstatSync(path);
    if (st.isSymbolicLink()) return resolve(dirname(path), readlinkSync(path)).startsWith(SRC);
    return false; // a real dir we didn't create — never clobber it
  } catch {
    return null; // doesn't exist
  }
}

for (const name of skills) {
  const target = join(SRC, name);
  const link = join(DEST, name);
  const owned = ownedByUs(link);

  if (uninstall) {
    if (owned) {
      rmSync(link, { recursive: true, force: true });
      console.log(`removed  ${link}`);
    } else if (owned === false) {
      console.log(`skipped  ${link} (not created by us)`);
    }
    continue;
  }

  if (owned === false) {
    console.warn(`SKIP     ${link} already exists and isn't ours — remove it first to install.`);
    continue;
  }
  if (owned) rmSync(link, { recursive: true, force: true });

  if (copy) {
    cpSync(target, link, { recursive: true });
    console.log(`copied   ${name}  ->  ${link}`);
  } else {
    symlinkSync(target, link, "dir");
    console.log(`linked   ${name}  ->  ${link}`);
  }
}

if (!uninstall) {
  console.log(`\nDone. Restart Cowork / Claude Desktop (or run /reload-plugins in the CLI) to load: ${skills.join(", ")}.`);
  console.log(`These skills drive the knowledge-capture MCP server — make sure that connector is added too.`);
}
