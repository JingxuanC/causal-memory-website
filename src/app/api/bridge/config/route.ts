import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkBridgeAuth } from "@/lib/bridge";
import { isByokConfigured } from "@/lib/crypto";

// Per-plan quotas from the productization §2.3 table.
// null = unlimited (free writes are BYOK-only, enterprise is unmetered).
const PLAN_QUOTAS: Record<
  string,
  { monthlyWriteEvents: number | null; monthlyQueryEvents: number | null; storageMB: number | null }
> = {
  free: { monthlyWriteEvents: null, monthlyQueryEvents: 5000, storageMB: 100 },
  pro: { monthlyWriteEvents: 50000, monthlyQueryEvents: 50000, storageMB: 2048 },
  memory: { monthlyWriteEvents: 50000, monthlyQueryEvents: 50000, storageMB: 2048 },
  team: { monthlyWriteEvents: 200000, monthlyQueryEvents: 250000, storageMB: 10240 },
  enterprise: { monthlyWriteEvents: null, monthlyQueryEvents: null, storageMB: null },
};

// Sidecar config for the data plane (productization §3.1): per-tenant plan,
// quotas and BYOK *availability*. This endpoint used to decrypt and return
// plaintext BYOK keys to any holder of the shared BRIDGE_SECRET (audit P1-8);
// it no longer does. The data plane must never receive another user's LLM key
// over a static shared secret.
export async function GET(request: Request) {
  if (!checkBridgeAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const wanted = url.searchParams.get("tenant");
  if (wanted && !/^u_[A-Za-z0-9_-]{1,64}$/.test(wanted)) {
    return NextResponse.json({ error: "invalid_tenant" }, { status: 400 });
  }

  const now = new Date();
  const users = await prisma.user.findMany({
    where: {
      ...(wanted ? { id: wanted.slice(2) } : {}),
      apiTokens: {
        some: {
          revokedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      },
    },
    select: { id: true, plan: true, byokKeyCiphertext: true },
  });

  const tenants = users.map((u) => {
    const byokConfigured = Boolean(u.byokKeyCiphertext) && isByokConfigured();
    return {
      tenant: `u_${u.id}`,
      plan: u.plan,
      quotas: PLAN_QUOTAS[u.plan] ?? PLAN_QUOTAS.free,
      // Availability only. Neither ciphertext, plaintext nor a hint crosses
      // the shared-secret bridge; the dashboard is the only place that shows
      // the user their own hint.
      byokConfigured,
    };
  });
  return NextResponse.json(tenants, {
    headers: { "Cache-Control": "no-store" },
  });
}
