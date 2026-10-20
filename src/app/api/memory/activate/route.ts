import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "login_required", hint: "请先登录，再激活订阅。" }, { status: 401 });
  }
  let body: { subscriptionId?: unknown };
  try {
    body = (await request.json()) as { subscriptionId?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const subscriptionId = typeof body.subscriptionId === "string" ? body.subscriptionId.trim() : "";
  if (!/^I-[A-Z0-9]{6,40}$/.test(subscriptionId)) {
    return NextResponse.json({ error: "invalid_subscription", hint: "订阅号格式不对（I- 开头）。" }, { status: 400 });
  }
  const record = await prisma.memorySubscription.findUnique({ where: { subscriptionId } });
  if (!record) {
    return NextResponse.json({ error: "not_found", hint: "没有找到这个订阅，确认订阅号或稍等几分钟再试。" }, { status: 404 });
  }
  if (record.status !== "ACTIVE") {
    return NextResponse.json({ error: "not_active", hint: `订阅当前状态是 ${record.status}，未激活。` }, { status: 409 });
  }
  if (record.userId && record.userId !== session.user.id) {
    return NextResponse.json({ error: "bound_to_other_user", hint: "这个订阅已经绑定到其他账号。" }, { status: 409 });
  }
  await prisma.memorySubscription.update({ where: { subscriptionId }, data: { userId: session.user.id } });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
  if (!user || user.plan === "free" || user.plan === "") {
    await prisma.user.update({ where: { id: session.user.id }, data: { plan: "memory" } });
  }
  return NextResponse.json({ ok: true, plan: "memory" });
}
