// Containment: a caller-supplied id/path must never read or write outside KG_HOME.
// Run via `npm test` (builds core first). Uses Node's built-in test runner.
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

// Point the store at a throwaway dir BEFORE importing (kgHome reads this lazily).
const home = mkdtempSync(join(tmpdir(), "kg-test-"));
process.env.KG_HOME = home;

const { writeUnit, readUnitFile, saveUnitFile } = await import("../dist/index.js");

// A secret living outside the store — nothing should be able to reach it by id.
const secret = join(tmpdir(), `kg-secret-${Date.now()}.txt`);
writeFileSync(secret, "TOP SECRET");

test("a real draft is readable by its id", async () => {
  const { id } = await writeUnit(
    { title: "How we test things", trigger: "t", steps: ["s"], practice_area: [], matter_type: "", exceptions: [], authorities: [], templates: [], confidentiality: "internal", open_questions: [] },
    { owner: "tester" }
  );
  assert.match((await readUnitFile(id)) ?? "", /How we test things/);
});

test("readUnitFile refuses an absolute path outside the store", async () => {
  assert.equal(await readUnitFile(secret), null);
  assert.equal(await readUnitFile("/etc/hosts"), null);
});

test("readUnitFile refuses a relative ../ escape", async () => {
  assert.equal(await readUnitFile("../../../../etc/hosts"), null);
  assert.equal(await readUnitFile(`../../${secret}`), null);
});

test("saveUnitFile refuses to write outside the store", async () => {
  await assert.rejects(() => saveUnitFile(secret, "PWNED"));
  await assert.rejects(() => saveUnitFile("../../../../tmp/evil", "PWNED"));
  // The secret is untouched.
  const { readFileSync } = await import("node:fs");
  assert.equal(readFileSync(secret, "utf-8"), "TOP SECRET");
});
