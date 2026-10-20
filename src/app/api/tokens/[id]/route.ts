import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { enqueueBridgeOp, flushBridgeOutbox } from "@/lib/bridge-outbox";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const token = await prisma.apiToken.findUnique({ where: { id } });
  if (!token || token.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // DB is the source of truth: write revokedAt + outbox in one transaction,
  // then try the projection. If cloud.json is unavailable the outbox row stays
  // pending and reconciliation retries it; the API reports that state instead
  // of pretending the file write succeeded.
  await prisma.$transaction(async (tx) => {
    await tx.apiToken.update({ where: { id }, data: { revokedAt: new Date() } });
    await enqueueBridgeOp(tx, "remove", token.tokenHash, token.tenant);
    await tx.licenseClaim.updateMany({
      where: { memoryTokenId: id, revokedAt: null },
      data: { revokedAt: new Date(), status: "revoked" },
    });
  });

  const flush = await flushBridgeOutbox(prisma);
  return NextResponse.json({
    ok: true,
    bridgeSync: flush.ok ? "applied" : "pending",
    ...(flush.ok ? {} : { warning: "cloud.json 暂未更新，已进入重试队列；对账任务会继续处理。" }),
  });
}
