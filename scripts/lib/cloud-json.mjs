// Node-only helpers for ops scripts. Keep the safety rules in sync with
// src/lib/memory-bridge.ts: inter-process lock, atomic replace, and a hard
// error (never an empty map) when cloud.json is corrupt.
import {
  closeSync,
  copyFileSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

const LOCK_TIMEOUT_MS = 5_000;
const LOCK_STALE_MS = 30_000;

export function bridgePath() {
  return (process.env.CM_TOKENS_BRIDGE || "").trim();
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function acquireLock(file) {
  const lock = `${file}.lock`;
  mkdirSync(dirname(file), { recursive: true });
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  for (;;) {
    try {
      const fd = openSync(lock, "wx", 0o600);
      try {
        writeFileSync(fd, `${process.pid} ${Date.now()}\n`, "utf8");
      } catch {
        // annotation only
      }
      return { fd, lock };
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      try {
        if (Date.now() - statSync(lock).mtimeMs > LOCK_STALE_MS) {
          unlinkSync(lock);
          continue;
        }
      } catch {
        continue;
      }
      if (Date.now() >= deadline) throw new Error("cloud.json is locked by another writer");
      sleepSync(25);
    }
  }
}

function releaseLock({ fd, lock }) {
  try {
    closeSync(fd);
  } catch {
    // ignore
  }
  try {
    unlinkSync(lock);
  } catch {
    // ignore
  }
}

export function readMap(file) {
  if (!existsSync(file)) return {};
  const raw = readFileSync(file, "utf8");
  if (!raw.trim()) throw new Error("cloud.json is empty; refusing to overwrite it");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("cloud.json is not valid JSON; refusing to overwrite it");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("cloud.json is not a JSON object; refusing to overwrite it");
  }
  const map = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== "string" || !value) {
      throw new Error(`cloud.json entry ${key} has a non-string tenant`);
    }
    map[key] = value;
  }
  return map;
}

export function writeMapAtomic(file, map) {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = join(dirname(file), `.cloud.${process.pid}.${Date.now()}.tmp`);
  const fd = openSync(tmp, "w", 0o600);
  try {
    writeFileSync(fd, JSON.stringify(map, null, 1), { encoding: "utf8", mode: 0o600 });
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  try {
    if (existsSync(file)) copyFileSync(file, `${file}.bak`);
    renameSync(tmp, file);
  } catch (error) {
    try {
      unlinkSync(tmp);
    } catch {
      // ignore
    }
    throw error;
  }
}

export function withBridgeLock(file, fn) {
  const lock = acquireLock(file);
  try {
    const map = readMap(file);
    const next = fn(map);
    writeMapAtomic(file, next);
    return next;
  } finally {
    releaseLock(lock);
  }
}
