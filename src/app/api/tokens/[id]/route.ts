import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { bridgeTokenRemove } from "@/lib/memory-bridge";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const token = await prisma.apiToken.findUnique({ where: { id } });
  if (!token || token.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.apiToken.update({ where: { id }, data: { revokedAt: new Date() } });
  bridgeTokenRemove(token.tokenHash);
  return NextResponse.json({ ok: true });
}
