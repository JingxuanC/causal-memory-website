#!/usr/bin/env node
// Smoke test for src/lib/memory-bridge.ts (lock, atomic write, corrupt-file
// refusal). Dev-only; requires Node >= 22.6 for --experimental-strip-types.
//
//   node --experimental-strip-types scripts/test-memory-bridge.mjs
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const modulePath = new URL("../src/lib/memory-bridge.ts", import.meta.url).pathname;

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

const child = process.argv[2] === "--child";
if (child) {
  const b = await import(modulePath);
  b.bridgeTokenAdd(process.argv[3], process.argv[4]);
  process.exit(0);
}

const dir = mkdtempSync(join(tmpdir(), "cm-bridge-test-"));
const file = join(dir, "cloud.json");
process.env.CM_TOKENS_BRIDGE = file;

try {
  const b = await import(modulePath);
  const h1 = "1".repeat(64);
  const h2 = "2".repeat(64);
  b.bridgeTokenAdd(h1, "u_user1");
  b.bridgeTokenAdd(h2, "u_user2");
  let map = JSON.parse(readFileSync(file, "utf8"));
  assert(map[`sha256:${h1}`] === "u_user1", "add h1");
  assert(map[`sha256:${h2}`] === "u_user2", "add h2");

  // Corrupt file: add must throw and must not replace the file.
  writeFileSync(file, "{not json");
  let threw = false;
  try {
    b.bridgeTokenAdd("3".repeat(64), "u_user3");
  } catch (error) {
    threw = error.code === "bridge_corrupt";
  }
  assert(threw, "corrupt cloud.json must throw bridge_corrupt");
  assert(readFileSync(file, "utf8") === "{not json", "corrupt file must not be overwritten");

  // Restore and test concurrent cross-process adds (file lock).
  writeFileSync(file, JSON.stringify({ [`sha256:${h1}`]: "u_user1" }));
  const hashes = Array.from({ length: 8 }, (_, i) => (i + 4).toString(16).padStart(2, "0").repeat(32));
  for (const [i, hash] of hashes.entries()) {
    const res = spawnSync(process.execPath, [
      "--experimental-strip-types",
      new URL(import.meta.url).pathname,
      "--child",
      hash,
      `u_parallel${i}`,
    ], { env: { ...process.env, CM_TOKENS_BRIDGE: file }, encoding: "utf8" });
    assert(res.status === 0, `child ${i} failed: ${res.stderr}`);
  }
  map = JSON.parse(readFileSync(file, "utf8"));
  assert(Object.keys(map).length === 9, `expected 9 entries, got ${Object.keys(map).length}`);
  for (const hash of hashes) assert(map[`sha256:${hash}`], "parallel entry missing");

  b.bridgeTokenRemove(h1);
  map = JSON.parse(readFileSync(file, "utf8"));
  assert(!map[`sha256:${h1}`], "remove h1");
  console.log("OK: lock/atomic/corrupt-refusal/concurrent-add");
} finally {
  rmSync(dir, { recursive: true, force: true });
}
