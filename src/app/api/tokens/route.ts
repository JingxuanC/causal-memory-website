import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { bridgeConfigured } from "@/lib/memory-bridge";
import { createMemoryToken } from "@/lib/memory-tokens";
import { getMemoryEntitlement } from "@/lib/entitlements";
import { canonicalTenant, resolveTenant } from "@/lib/tenants";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tokens = await prisma.apiToken.findMany({
    where: { userId: session.user.id, revokedAt: null },
    select: {
      id: true,
      userId: true,
      name: true,
      prefix: true,
      tenant: true,
      source: true,
      expiresAt: true,
      createdAt: true,
      lastUsedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  // Read-time compatibility: a legacy row may still carry an email tenant
  // until the Phase-2 backfill; expose the canonical u_<id> to clients.
  const resolved = await Promise.all(
    tokens.map(async (token) => {
      const { userId, ...rest } = token;
      return { ...rest, tenant: await resolveTenant(prisma, { userId, tenant: token.tenant }) };
    }),
  );
  return NextResponse.json({ tokens: resolved });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Paid plan or a still-valid Alpha Desk claim; free accounts cannot mint
  // hosted-memory credentials (audit P1-6).
  const entitlement = await getMemoryEntitlement(prisma, session.user.id);
  if (!entitlement.allowed) {
    return NextResponse.json(
      {
        error: "plan_required",
        hint:
          entitlement.reason === "claim-expired"
            ? "云端记忆授权已过期，请续费或重新申请 Pro。"
            : "云端记忆仅对 Pro / Team / Enterprise 或已购买云端记忆的账号开放。",
      },
      { status: 403 },
    );
  }

  const active = await prisma.apiToken.count({
    where: {
      userId: session.user.id,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
  if (active >= 5) return NextResponse.json({ error: "Token limit reached (5)" }, { status: 429 });

  if (!bridgeConfigured()) {
    return NextResponse.json(
      {
        error: "bridge_unavailable",
        hint: "云端记忆桥接未配置（CM_TOKENS_BRIDGE），暂时不能签发 token。",
      },
      { status: 503 },
    );
  }

  const { name } = (await request.json().catch(() => ({}))) as { name?: string };
  const tenant = canonicalTenant(session.user.id);
  try {
    const record = await createMemoryToken({
      userId: session.user.id,
      tenant,
      name: typeof name === "string" && name.trim() ? name.trim() : "default",
      expiresAt: entitlement.expiresAt,
      source: "dashboard",
    });
    // The plaintext token is returned exactly once — we only store its hash.
    return NextResponse.json(
      { id: record.id, token: record.token, tenant, expiresAt: entitlement.expiresAt },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "bridge_write_failed",
        hint: `token 未签发：${error instanceof Error ? error.message : "cloud.json 写入失败"}`,
      },
      { status: 503 },
    );
  }
}
