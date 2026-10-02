import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkBridgeAuth } from "@/lib/bridge";
import { decryptByokKey, isByokConfigured } from "@/lib/crypto";

// Per-plan quotas from the productization §2.3 table.
// null = unlimited (free writes are BYOK-only, enterprise is unmetered).
const PLAN_QUOTAS: Record<
  string,
  { monthlyWriteEvents: number | null; monthlyQueryEvents: number | null; storageMB: number | null }
> = {
  free: { monthlyWriteEvents: null, monthlyQueryEvents: 5000, storageMB: 100 },
  pro: { monthlyWriteEvents: 50000, monthlyQueryEvents: 50000, storageMB: 2048 },
  team: { monthlyWriteEvents: 200000, monthlyQueryEvents: 250000, storageMB: 10240 },
  enterprise: { monthlyWriteEvents: null, monthlyQueryEvents: null, storageMB: null },
};

// Sidecar config for the data plane (productization §3.1): per-tenant plan,
// quotas, and BYOK LLM key. The bridge is a trusted internal channel
// (BRIDGE_SECRET), so decrypted keys may cross it; tenants without a BYOK
// key get null and fall back to the platform key pool (paid plans).
export async function GET(request: Request) {
  if (!checkBridgeAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const users = await prisma.user.findMany({
    where: { apiTokens: { some: { revokedAt: null } } },
    select: { id: true, plan: true, byokKeyCiphertext: true },
  });
  const tenants = users.map((u) => {
    let byokLlmKey: string | null = null;
    if (u.byokKeyCiphertext && isByokConfigured()) {
      try {
        byokLlmKey = decryptByokKey(u.byokKeyCiphertext);
      } catch {
        // Undecryptable (secret rotated / corrupted) — treat as no key
        // rather than failing the whole config push.
        byokLlmKey = null;
      }
    }
    return {
      tenant: `u_${u.id}`,
      plan: u.plan,
      quotas: PLAN_QUOTAS[u.plan] ?? PLAN_QUOTAS.free,
      byokLlmKey,
    };
  });
  return NextResponse.json(tenants, {
    headers: { "Cache-Control": "no-store" },
  });
}
