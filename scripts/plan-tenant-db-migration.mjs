#!/usr/bin/env node
// Print (never execute) the SQLite copy commands for the Phase-2 tenant
// rename email -> u_<userId>. Filenames mirror causal-memory's tenant.rs:
//   safe = tenant.replace(/[^A-Za-z0-9_-]/g, "_")
//   file = `${safe}.${fnv1a(tenant).toString(16)}.db`
//
// Usage:
//   node scripts/plan-tenant-db-migration.mjs --tenants-dir /path/to/cm-data/tenants
import { existsSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const argv = process.argv.slice(2);
const dirIndex = argv.indexOf("--tenants-dir");
const tenantsDir = dirIndex >= 0 ? argv[dirIndex + 1] : process.env.CAUSAL_MEMORY_TENANTS_DIR;
if (!tenantsDir) {
  console.error("usage: plan-tenant-db-migration.mjs --tenants-dir <dir>");
  process.exit(2);
}

function fnv1a(text) {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;
  for (const byte of Buffer.from(text, "utf8")) {
    hash ^= BigInt(byte);
    hash = (hash * prime) & mask;
  }
  return hash.toString(16);
}

function dbFile(tenant) {
  const safe = tenant.replace(/[^A-Za-z0-9_-]/g, "_");
  return `${safe}.${fnv1a(tenant)}.db`;
}

const prisma = new PrismaClient();
try {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, apiTokens: { select: { tenant: true } } },
  });
  let planned = 0;
  for (const user of users) {
    const targetTenant = `u_${user.id}`;
    const legacy = new Set();
    if (user.email) legacy.add(user.email);
    for (const token of user.apiTokens) {
      if (token.tenant && !token.tenant.startsWith("u_")) legacy.add(token.tenant);
    }
    for (const oldTenant of legacy) {
      const oldFile = join(tenantsDir, dbFile(oldTenant));
      const newFile = join(tenantsDir, dbFile(targetTenant));
      if (!existsSync(oldFile)) continue;
      planned += 1;
      console.log(`# ${user.email ?? user.id}: ${oldTenant} -> ${targetTenant}`);
      console.log(`sqlite3 '${oldFile}' "VACUUM INTO '${newFile}.tmp'"`);
      console.log(`mv '${newFile}.tmp' '${newFile}'`);
    }
  }
  console.log(`# planned=${planned}; review before running; keep old files read-only for 30 days`);
} finally {
  await prisma.$disconnect();
}
