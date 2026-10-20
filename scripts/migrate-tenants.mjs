#!/usr/bin/env node
// Backfill ApiToken.tenant = u_<userId> and seed TenantAlias from the current
// email. This is the read-time compatibility half of the tenant migration;
// it does NOT move causal-memory tenant DB files.
//
// Usage:
//   node scripts/migrate-tenants.mjs [--dry-run]
//
// After this, run scripts/reconcile-memory-bridge.mjs only once the Phase-2
// SQLite files have been copied (see docs/CLOUD-MEMORY-PRO-CLAIM.md).
import { PrismaClient } from "@prisma/client";

const dryRun = new Set(process.argv.slice(2)).has("--dry-run");
const prisma = new PrismaClient();
try {
  const tokens = await prisma.apiToken.findMany({
    select: { id: true, tenant: true, userId: true },
  });
  let updated = 0;
  let tokenAliases = 0;
  for (const token of tokens) {
    if (!token.tenant) {
      updated += 1;
      if (!dryRun) {
        await prisma.apiToken.update({ where: { id: token.id }, data: { tenant: `u_${token.userId}` } });
      }
      continue;
    }
    if (!token.tenant.startsWith("u_")) {
      // Legacy email/tenant string recorded on the token itself: keep a
      // read-compat alias even if the user's current email has changed.
      tokenAliases += 1;
      if (!dryRun) {
        await prisma.tenantAlias.upsert({
          where: { legacyTenant: token.tenant },
          create: {
            legacyTenant: token.tenant,
            tenant: `u_${token.userId}`,
            userId: token.userId,
            note: "token tenant backfill",
          },
          update: { tenant: `u_${token.userId}`, userId: token.userId },
        });
      }
    }
  }

  const users = await prisma.user.findMany({
    where: { email: { not: null } },
    select: { id: true, email: true },
  });
  let aliases = 0;
  for (const user of users) {
    if (!user.email) continue;
    aliases += 1;
    if (!dryRun) {
      await prisma.tenantAlias.upsert({
        where: { legacyTenant: user.email },
        create: { legacyTenant: user.email, tenant: `u_${user.id}`, userId: user.id, note: "email backfill" },
        update: { tenant: `u_${user.id}`, userId: user.id },
      });
    }
  }
  console.log(
    `tokens=${tokens.length} tenant_backfilled=${updated} ` +
      `email_aliases=${aliases} token_aliases=${tokenAliases}` +
      (dryRun ? " (dry-run)" : ""),
  );
} finally {
  await prisma.$disconnect();
}
