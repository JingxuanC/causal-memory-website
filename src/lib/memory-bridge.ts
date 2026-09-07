import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Bridge to the causal-memory MCP server's multi-tenant token store.
 *
 * The server (`tenant.rs`) watches a tokens directory; every `*.json` in it
 * is a token→tenant map. Keys prefixed `sha256:` are matched against the
 * SHA-256 of the presented bearer token, so this bridge writes ONLY the
 * hash — plaintext never touches disk, keeping the "we only keep a hash"
 * promise while making dashboard-issued tokens live on /memory/mcp.
 *
 * Disabled when CM_TOKENS_BRIDGE is unset (local dev); the dashboard still
 * issues tokens, they just don't authenticate anywhere.
 */
const BRIDGE_FILE = process.env.CM_TOKENS_BRIDGE;

type Map = Record<string, string>;

function read(): Map {
  if (!BRIDGE_FILE) return {};
  try {
    const parsed: unknown = JSON.parse(readFileSync(BRIDGE_FILE, "utf8"));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Map;
    }
    return {};
  } catch {
    return {}; // missing or mid-write file = empty source
  }
}

function write(map: Map) {
  if (!BRIDGE_FILE) return;
  mkdirSync(dirname(BRIDGE_FILE), { recursive: true });
  // atomic replace; the server reloads on mtime change
  const tmp = join(dirname(BRIDGE_FILE), `.cloud.${process.pid}.tmp`);
  writeFileSync(tmp, JSON.stringify(map, null, 1), { mode: 0o600 });
  renameSync(tmp, BRIDGE_FILE);
}

/** Register a freshly issued token: sha256 hash → tenant (user identity). */
export function bridgeTokenAdd(tokenHash: string, tenant: string) {
  if (!BRIDGE_FILE) return;
  const map = read();
  map[`sha256:${tokenHash}`] = tenant;
  write(map);
}

/** Revoke by hash (the ApiToken row keeps tokenHash, so revocation needs no plaintext). */
export function bridgeTokenRemove(tokenHash: string) {
  if (!BRIDGE_FILE) return;
  const map = read();
  delete map[`sha256:${tokenHash}`];
  write(map);
}
