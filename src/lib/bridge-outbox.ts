import type { Prisma, PrismaClient } from "@prisma/client";
import {
  BridgeError,
  bridgeConfigured,
  bridgeTokenAdd,
  bridgeTokenRemove,
  writeBridgeMap,
} from "@/lib/memory-bridge";

/**
 * cloud.json is a projection of the ApiToken table. Writes go through a small
 * transactional outbox so a failed bridge write never loses the intent:
 * the DB row is committed first, then flushed; pending rows are retried by
 * this module and by scripts/reconcile-memory-bridge.mjs.
 */
export type BridgeOp = "add" | "remove";
export type BridgeTx = Prisma.TransactionClient;

export async function enqueueBridgeOp(
  tx: BridgeTx,
  op: BridgeOp,
  tokenHash: string,
  tenant: string,
): Promise<void> {
  await tx.bridgeOutbox.create({ data: { op, tokenHash, tenant } });
}

export type FlushResult = {
  ok: boolean;
  processed: number;
  failed: number;
  pending: number;
  error?: string;
};

/**
 * DB-side expiry sweep. causal-memory only understands the hash→tenant map,
 * so an expired ApiToken must disappear from cloud.json explicitly; the
 * outbox remove is enqueued here and applied by the next flush/对账.
 */
export async function sweepExpiredTokens(prisma: PrismaClient, limit = 200): Promise<number> {
  const expired = await prisma.apiToken.findMany({
    where: { revokedAt: null, expiresAt: { lte: new Date() } },
    select: { id: true, tokenHash: true, tenant: true },
    take: Math.max(1, Math.min(limit, 1000)),
  });
  let swept = 0;
  for (const token of expired) {
    await prisma.$transaction(async (tx) => {
      await tx.apiToken.update({ where: { id: token.id }, data: { revokedAt: new Date() } });
      await enqueueBridgeOp(tx, "remove", token.tokenHash, token.tenant);
      await tx.licenseClaim.updateMany({
        where: { memoryTokenId: token.id, revokedAt: null },
        data: { revokedAt: new Date(), status: "revoked" },
      });
    });
    swept += 1;
  }
  return swept;
}

function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/\s+/g, " ").slice(0, 240);
}

export async function flushBridgeOutbox(prisma: PrismaClient, limit = 500): Promise<FlushResult> {
  // Expired tokens must leave cloud.json even if nobody revokes them by hand.
  await sweepExpiredTokens(prisma);
  const pendingBefore = await prisma.bridgeOutbox.count({ where: { processedAt: null } });
  if (pendingBefore === 0) return { ok: true, processed: 0, failed: 0, pending: 0 };
  if (!bridgeConfigured()) {
    return {
      ok: false,
      processed: 0,
      failed: 0,
      pending: pendingBefore,
      error: "CM_TOKENS_BRIDGE is not configured; token projection is unavailable",
    };
  }

  const rows = await prisma.bridgeOutbox.findMany({
    where: { processedAt: null },
    orderBy: { createdAt: "asc" },
    take: Math.max(1, Math.min(limit, 500)),
  });

  let processed = 0;
  for (const row of rows) {
    try {
      if (row.op === "add") bridgeTokenAdd(row.tokenHash, row.tenant);
      else if (row.op === "remove") bridgeTokenRemove(row.tokenHash);
      else throw new BridgeError("bad_op", `unknown bridge op ${row.op}`);
      await prisma.bridgeOutbox.update({
        where: { id: row.id },
        data: { processedAt: new Date(), attempts: { increment: 1 }, lastError: null },
      });
      processed += 1;
    } catch (error) {
      const message = safeError(error);
      await prisma.bridgeOutbox.update({
        where: { id: row.id },
        data: { attempts: { increment: 1 }, lastError: message },
      });
      // A corrupt file or a missing bridge affects every subsequent row;
      // stop and let the reconciliation task surface the real error.
      const pending = await prisma.bridgeOutbox.count({ where: { processedAt: null } });
      return { ok: false, processed, failed: 1, pending, error: message };
    }
  }

  const pending = await prisma.bridgeOutbox.count({ where: { processedAt: null } });
  return { ok: pending === 0, processed, failed: 0, pending };
}

/**
 * Replace cloud.json from the ApiToken table.
 *
 * `canonicalizeLegacy=false` (the safe default) keeps a legacy token's
 * existing tenant (or its user email) so running reconciliation before the
 * tenant DB copy cannot silently move a user to an empty u_<id> store.
 * Set it to true only after the Phase-2 tenant migration has copied data.
 */
export async function rebuildBridgeFromDb(
  prisma: PrismaClient,
  options: { canonicalizeLegacy?: boolean; dryRun?: boolean } = {},
): Promise<{ map: Record<string, string>; skipped: number; written: boolean }> {
  const now = new Date();
  const tokens = await prisma.apiToken.findMany({
    where: {
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: {
      tokenHash: true,
      tenant: true,
      userId: true,
      user: { select: { email: true } },
    },
  });
  const aliases = await prisma.tenantAlias.findMany();
  const aliasByLegacy = new Map(aliases.map((a) => [a.legacyTenant, a.tenant]));

  const map: Record<string, string> = {};
  let skipped = 0;
  for (const token of tokens) {
    let tenant = "";
    if (options.canonicalizeLegacy) {
      tenant = `u_${token.userId}`;
    } else if (token.tenant.startsWith("u_")) {
      tenant = token.tenant;
    } else if (token.tenant) {
      tenant = aliasByLegacy.get(token.tenant) ?? token.tenant;
    } else if (token.user.email) {
      tenant = aliasByLegacy.get(token.user.email) ?? token.user.email;
    }
    if (!tenant) {
      skipped += 1;
      continue;
    }
    map[`sha256:${token.tokenHash}`] = tenant;
  }

  if (!options.dryRun) writeBridgeMap(map);
  return { map, skipped, written: !options.dryRun };
}
