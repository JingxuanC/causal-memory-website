#!/usr/bin/env node
// Project the ApiToken table into causal-memory's cloud.json.
//
// Usage:
//   node scripts/reconcile-memory-bridge.mjs [--dry-run] [--canonicalize-legacy]
//
// Safe default: a legacy row with an empty tenant keeps its user email (or an
// existing alias) so running this before the Phase-2 tenant DB copy cannot
// silently move a user to an empty u_<id> database. Only pass
// --canonicalize-legacy after the DB files have been copied.
import { PrismaClient } from "@prisma/client";
import { bridgePath, readMap, withBridgeLock } from "./lib/cloud-json.mjs";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const canonicalizeLegacy = args.has("--canonicalize-legacy");
const file = bridgePath();
if (!file) {
  console.error("CM_TOKENS_BRIDGE is not set");
  process.exit(2);
}

const prisma = new PrismaClient();
try {
  const now = new Date();
  const tokens = await prisma.apiToken.findMany({
    where: { revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    select: { tokenHash: true, tenant: true, userId: true, user: { select: { email: true } } },
  });
  const aliases = new Map((await prisma.tenantAlias.findMany()).map((a) => [a.legacyTenant, a.tenant]));
  const map = {};
  let skipped = 0;
  for (const token of tokens) {
    let tenant = "";
    if (canonicalizeLegacy) tenant = `u_${token.userId}`;
    else if (token.tenant.startsWith("u_")) tenant = token.tenant;
    else if (token.tenant) tenant = aliases.get(token.tenant) ?? token.tenant;
    else if (token.user.email) tenant = aliases.get(token.user.email) ?? token.user.email;
    if (!tenant) {
      skipped += 1;
      continue;
    }
    map[`sha256:${token.tokenHash}`] = tenant;
  }

  const before = readMap(file);
  const beforeKeys = Object.keys(before).length;
  const added = Object.keys(map).filter((k) => !(k in before)).length;
  const removed = Object.keys(before).filter((k) => !(k in map)).length;
  console.log(
    `tokens=${tokens.length} active=${Object.keys(map).length} skipped=${skipped} ` +
      `cloud.json_before=${beforeKeys} added=${added} removed=${removed}`,
  );
  if (dryRun) {
    console.log("dry-run: cloud.json not written");
  } else {
    withBridgeLock(file, () => map);
    console.log("cloud.json replaced atomically");
  }
} finally {
  await prisma.$disconnect();
}
