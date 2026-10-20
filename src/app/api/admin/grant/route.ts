import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLANS = new Set(["free", "memory", "pro", "team", "enterprise"]);

function json(payload: unknown, status: number): NextResponse {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) return json({ error: "not_found" }, 404);
  if (!isAdmin(session)) return json({ error: "forbidden" }, 403);

  let body: { email?: unknown; plan?: unknown };
  try {
    body = (await request.json()) as { email?: unknown; plan?: unknown };
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const plan = typeof body.plan === "string" ? body.plan.trim().toLowerCase() : "";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: "invalid_email", hint: "邮箱格式不对" }, 400);
  }
  if (!PLANS.has(plan)) {
    return json({ error: "invalid_plan", hint: "plan 只能是 free/memory/pro/team/enterprise" }, 400);
  }

  const exact = await prisma.user.findFirst({ where: { email }, select: { id: true, email: true, plan: true } });
  let user = exact;
  if (!user) {
    const rows = await prisma.$queryRaw<{ id: string; email: string; plan: string | null }[]>`
      SELECT id, email, plan FROM User WHERE lower(email) = ${email} LIMIT 1
    `;
    const row = rows[0];
    if (row) user = { id: row.id, email: row.email, plan: row.plan ?? "free" };
  }
  if (!user) {
    return json({ error: "user_not_found", hint: "这个邮箱还没有在官网登录过，让客户先用 GitHub 登录一次再开通。" }, 404);
  }

  await prisma.user.update({ where: { id: user.id }, data: { plan } });
  return json({ ok: true, userId: user.id, email: user.email, plan, previousPlan: user.plan }, 200);
}
