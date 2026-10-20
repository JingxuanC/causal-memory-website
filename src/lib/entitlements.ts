import type { PrismaClient } from "@prisma/client";

/** Paid plans that unlock hosted cloud memory. */
export const PAID_PLANS = new Set(["pro", "memory", "team", "enterprise"]);
const UNMETERED_PLANS = new Set(["team", "enterprise"]);

export function isPaidPlan(plan: string | null | undefined): boolean {
  return Boolean(plan && PAID_PLANS.has(plan));
}

export type MemoryEntitlement = {
  allowed: boolean;
  plan: string;
  reason: "paid-plan" | "license-claim" | "free" | "claim-expired" | "claim-revoked";
  expiresAt: Date | null;
  claimId: string | null;
};

/**
 * Token creation is gated on a paid plan or a still-valid Alpha Desk claim.
 * A claim sets `User.plan = "pro"`, so the plan alone would never expire;
 * therefore the latest memory claim's expiry/revocation also gates `pro`
 * users. Team/enterprise are contract plans and are not tied to a claim.
 */
export async function getMemoryEntitlement(
  prisma: PrismaClient,
  userId: string,
): Promise<MemoryEntitlement> {
  const [user, claim] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }),
    prisma.licenseClaim.findFirst({
      where: { userId, memoryGranted: true },
      orderBy: { expiresAt: "desc" },
    }),
  ]);
  const plan = user?.plan ?? "free";
  const unmetered = UNMETERED_PLANS.has(plan);
  const now = Date.now();

  if (claim && !unmetered) {
    if (claim.revokedAt) {
      return { allowed: false, plan, reason: "claim-revoked", expiresAt: claim.expiresAt, claimId: claim.id };
    }
    if (claim.expiresAt.getTime() <= now) {
      return { allowed: false, plan, reason: "claim-expired", expiresAt: claim.expiresAt, claimId: claim.id };
    }
  }

  if (isPaidPlan(plan)) {
    return {
      allowed: true,
      plan,
      reason: "paid-plan",
      expiresAt: claim?.expiresAt ?? null,
      claimId: claim?.id ?? null,
    };
  }
  if (!claim) {
    return { allowed: false, plan, reason: "free", expiresAt: null, claimId: null };
  }
  return {
    allowed: true,
    plan,
    reason: "license-claim",
    expiresAt: claim.expiresAt,
    claimId: claim.id,
  };
}
