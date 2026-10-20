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

/**
 * Bridge to the causal-memory MCP server's multi-tenant token store.
 *
 * The server (`tenant.rs`) watches a tokens directory; every `*.json` in it
 * is a token→tenant map. Keys prefixed `sha256:` are matched against the
 * SHA-256 of the presented bearer token, so this bridge writes ONLY the
 * hash — plaintext never touches disk.
 *
 * Safety rules (audit P1-4/P1-5):
 *  - read-modify-write happens under an inter-process lock file;
 *  - a corrupt/unreadable cloud.json is a hard error, never treated as an
 *    empty map (otherwise the next add would wipe every other user);
 *  - replacement is atomic (same-directory tmp + rename) and keeps a .bak.
 *
 * Disabled when CM_TOKENS_BRIDGE is unset (local dev). Callers that mint
 * memory credentials must check `bridgeConfigured()` first and fail closed:
 * a token that cannot be projected into cloud.json must not be handed out.
 */
const BRIDGE_FILE = process.env.CM_TOKENS_BRIDGE?.trim() || "";
const LOCK_TIMEOUT_MS = 5_000;
const LOCK_STALE_MS = 30_000;

export type BridgeMap = Record<string, string>;

export class BridgeError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "BridgeError";
    this.code = code;
  }
}

export function bridgeConfigured(): boolean {
  return Boolean(BRIDGE_FILE);
}

export function bridgeFilePath(): string {
  return BRIDGE_FILE;
}

function sleepSync(ms: number) {
  // Node has Atomics.wait on the main thread; it is the smallest dependency-free
  // synchronous sleep and keeps this module usable from route handlers.
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function lockPath(): string {
  return `${BRIDGE_FILE}.lock`;
}

function acquireLock(): number {
  if (!BRIDGE_FILE) throw new BridgeError("bridge_not_configured", "CM_TOKENS_BRIDGE is not set");
  mkdirSync(dirname(BRIDGE_FILE), { recursive: true });
  const lock = lockPath();
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  for (;;) {
    try {
      const fd = openSync(lock, "wx", 0o600);
      try {
        writeFileSync(fd, `${process.pid} ${Date.now()}\n`, "utf8");
      } catch {
        // The lock is still held even if the owner annotation fails.
      }
      return fd;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EEXIST") {
        throw new BridgeError("bridge_lock_failed", `cannot create ${lock}: ${String(code)}`);
      }
      try {
        const age = Date.now() - statSync(lock).mtimeMs;
        if (age > LOCK_STALE_MS) {
          // A crashed process must not wedge the bridge forever.
          unlinkSync(lock);
          continue;
        }
      } catch {
        // Another process removed the lock between EEXIST and stat; retry.
        continue;
      }
      if (Date.now() >= deadline) {
        throw new BridgeError("bridge_busy", "cloud.json is locked by another writer");
      }
      sleepSync(25);
    }
  }
}

function releaseLock(fd: number) {
  try {
    closeSync(fd);
  } catch {
    // best effort
  }
  try {
    unlinkSync(lockPath());
  } catch {
    // best effort
  }
}

function parseMap(raw: string): BridgeMap {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new BridgeError("bridge_corrupt", "cloud.json is not valid JSON; refusing to overwrite it");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new BridgeError("bridge_corrupt", "cloud.json is not a JSON object; refusing to overwrite it");
  }
  const map: BridgeMap = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof value !== "string" || !value) {
      throw new BridgeError("bridge_corrupt", `cloud.json entry ${key} has a non-string tenant`);
    }
    map[key] = value;
  }
  return map;
}

/**
 * Read the current map. Missing file => {} (first write); unreadable/corrupt
 * file => BridgeError, deliberately NOT an empty map.
 */
export function readBridgeMap(): BridgeMap {
  if (!BRIDGE_FILE) throw new BridgeError("bridge_not_configured", "CM_TOKENS_BRIDGE is not set");
  if (!existsSync(BRIDGE_FILE)) return {};
  let raw: string;
  try {
    raw = readFileSync(BRIDGE_FILE, "utf8");
  } catch (error) {
    throw new BridgeError("bridge_unreadable", `cannot read cloud.json: ${(error as Error).message}`);
  }
  if (!raw.trim()) {
    throw new BridgeError("bridge_corrupt", "cloud.json is empty; refusing to overwrite it");
  }
  return parseMap(raw);
}

function writeMapLocked(map: BridgeMap) {
  if (!BRIDGE_FILE) throw new BridgeError("bridge_not_configured", "CM_TOKENS_BRIDGE is not set");
  mkdirSync(dirname(BRIDGE_FILE), { recursive: true });
  const tmp = join(dirname(BRIDGE_FILE), `.cloud.${process.pid}.${Date.now()}.tmp`);
  const fd = openSync(tmp, "w", 0o600);
  try {
    writeFileSync(fd, JSON.stringify(map, null, 1), { encoding: "utf8", mode: 0o600 });
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  try {
    if (existsSync(BRIDGE_FILE)) copyFileSync(BRIDGE_FILE, `${BRIDGE_FILE}.bak`);
    renameSync(tmp, BRIDGE_FILE);
  } catch (error) {
    try {
      unlinkSync(tmp);
    } catch {
      // ignore
    }
    throw new BridgeError("bridge_write_failed", `cannot replace cloud.json: ${(error as Error).message}`);
  }
}

/** Run a read-modify-write transaction under the bridge file lock. */
export function withBridgeLock<T>(fn: (map: BridgeMap) => { map: BridgeMap; value: T }): T {
  const fd = acquireLock();
  try {
    const current = readBridgeMap();
    const { map, value } = fn(current);
    writeMapLocked(map);
    return value;
  } finally {
    releaseLock(fd);
  }
}

/** Replace the whole projection (reconciliation); still atomic + locked. */
export function writeBridgeMap(map: BridgeMap): void {
  const fd = acquireLock();
  try {
    writeMapLocked(map);
  } finally {
    releaseLock(fd);
  }
}

/** Register a freshly issued token: sha256 hash → tenant (user identity). */
export function bridgeTokenAdd(tokenHash: string, tenant: string): void {
  if (!bridgeConfigured()) throw new BridgeError("bridge_not_configured", "CM_TOKENS_BRIDGE is not set");
  if (!/^[0-9a-f]{64}$/.test(tokenHash)) throw new BridgeError("bad_hash", "tokenHash must be sha256 hex");
  if (!/^u_[A-Za-z0-9_-]{1,64}$/.test(tenant)) {
    throw new BridgeError("bad_tenant", "tenant must be u_<user id>");
  }
  withBridgeLock((map) => {
    map[`sha256:${tokenHash}`] = tenant;
    return { map, value: undefined };
  });
}

/** Revoke by hash (the ApiToken row keeps tokenHash, so revocation needs no plaintext). */
export function bridgeTokenRemove(tokenHash: string): void {
  if (!bridgeConfigured()) throw new BridgeError("bridge_not_configured", "CM_TOKENS_BRIDGE is not set");
  if (!/^[0-9a-f]{64}$/.test(tokenHash)) throw new BridgeError("bad_hash", "tokenHash must be sha256 hex");
  withBridgeLock((map) => {
    delete map[`sha256:${tokenHash}`];
    return { map, value: undefined };
  });
}
