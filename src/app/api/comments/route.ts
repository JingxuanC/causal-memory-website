import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { postSlug, body } = await request.json().catch(() => ({}));
  if (typeof postSlug !== "string" || typeof body !== "string" || !body.trim() || body.length > 2000) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const comment = await prisma.comment.create({
    data: { postSlug, body: body.trim(), userId: session.user.id },
  });
  return NextResponse.json({ id: comment.id }, { status: 201 });
}
