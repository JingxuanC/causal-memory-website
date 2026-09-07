import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { bridgeTokenAdd } from "@/lib/memory-bridge";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tokens = await prisma.apiToken.findMany({
    where: { userId: session.user.id, revokedAt: null },
    select: { id: true, name: true, prefix: true, createdAt: true, lastUsedAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ tokens });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const active = await prisma.apiToken.count({ where: { userId: session.user.id, revokedAt: null } });
  if (active >= 5) return NextResponse.json({ error: "Token limit reached (5)" }, { status: 429 });

  const { name } = await request.json().catch(() => ({}));
  const token = `cm_${randomBytes(24).toString("hex")}`;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const record = await prisma.apiToken.create({
    data: {
      userId: session.user.id,
      name: typeof name === "string" && name.trim() ? name.trim().slice(0, 60) : "default",
      tokenHash,
      prefix: token.slice(0, 10),
    },
  });
  // Make the token live on the hosted MCP endpoint: the bridge file carries
  // only the hash, the server matches sha256(presented token).
  bridgeTokenAdd(tokenHash, session.user.email ?? session.user.id);
  // The plaintext token is returned exactly once — we only store its hash.
  return NextResponse.json({ id: record.id, token }, { status: 201 });
}
