import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encryptByokKey, isByokConfigured, keyHint } from "@/lib/crypto";

// BYOK LLM key management (productization §2.2/§3.5): users store their own
// DeepSeek/OpenAI key; we persist only AES-256-GCM ciphertext + a display
// hint. POST saves, DELETE clears. Both require a signed-in user.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isByokConfigured()) {
    return NextResponse.json(
      { error: "BYOK storage is not configured on this deployment (BYOK_SECRET missing)" },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const key = typeof body.key === "string" ? body.key.trim() : "";
  if (!key) return NextResponse.json({ error: "key is required" }, { status: 400 });
  if (key.length > 200) return NextResponse.json({ error: "key too long (max 200 chars)" }, { status: 400 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      byokKeyCiphertext: encryptByokKey(key),
      byokKeyHint: keyHint(key),
    },
  });
  return NextResponse.json({ ok: true, hint: keyHint(key) });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.user.update({
    where: { id: session.user.id },
    data: { byokKeyCiphertext: null, byokKeyHint: null },
  });
  return NextResponse.json({ ok: true });
}
