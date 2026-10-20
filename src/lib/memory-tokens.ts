import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { enqueueBridgeOp, flushBridgeOutbox } from "@/lib/bridge-outbox";

/**
 * Mint a `cm_` token: SHA-256 at rest, tenant-bound, projected to cloud.json
 * before the plaintext is returned. If the projection cannot be written the
 * token is revoked and the caller gets an error — never a dead credential.
 */
export function tokenMaterial(): { token: string; tokenHash: string } {
  const token = `cm_${randomBytes(24).toString("hex")}`;
  return { token, tokenHash: createHash("sha256").update(token).digest("hex") };
}

export async function createMemoryToken(input: {
  userId: string;
  tenant: string;
  name: string;
  expiresAt: Date | null;
  source: "dashboard" | "alpha-desk";
}): Promise<{ id: string; token: string; tokenHash: string }> {
  const { token, tokenHash } = tokenMaterial();
  const record = await prisma.$transaction(async (tx) => {
    const created = await tx.apiToken.create({
      data: {
        userId: input.userId,
        name: input.name.slice(0, 60),
        tokenHash,
        prefix: token.slice(0, 10),
        tenant: input.tenant,
        expiresAt: input.expiresAt,
        source: input.source,
      },
      select: { id: true },
    });
    await enqueueBridgeOp(tx, "add", tokenHash, input.tenant);
    return created;
  });

  const flush = await flushBridgeOutbox(prisma);
  if (!flush.ok) {
    // Do not hand out a credential that the data plane cannot authenticate.
    await prisma.$transaction(async (tx) => {
      await tx.apiToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
      await enqueueBridgeOp(tx, "remove", tokenHash, input.tenant);
    });
    await flushBridgeOutbox(prisma).catch(() => undefined);
    throw new Error(flush.error ?? "cloud.json projection failed");
  }
  return { id: record.id, token, tokenHash };
}

/** DB first, then projection. A failed projection stays in BridgeOutbox for retry. */
export async function revokeMemoryToken(id: string, tokenHash: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.apiToken.update({ where: { id }, data: { revokedAt: new Date() } });
    await enqueueBridgeOp(tx, "remove", tokenHash, "");
  });
  await flushBridgeOutbox(prisma).catch(() => undefined);
}
