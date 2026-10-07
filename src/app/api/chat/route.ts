import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decryptByokKey, isByokConfigured } from "@/lib/crypto";
import { getChapter } from "@/lib/markdown";

// Book-chapter AI chat. Signed-in users only. Key resolution order:
//   1. the user's own BYOK key (AES-256-GCM at rest, see /api/byok)
//   2. a deployment-level AI_API_KEY (paid by the site operator)
// The chapter markdown is inlined as system context so the model answers
// with the book as ground truth. OpenAI-compatible /chat/completions.
type ChatMessage = { role: "user" | "assistant"; content: string };

const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 4000;
// Chapters run ~5–20k chars; cap context so a question can't blow up tokens.
const MAX_CONTEXT_CHARS = 24000;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const slug = typeof body.slug === "string" ? body.slug : "";
  const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];
  const chapter = getChapter(slug);
  if (!chapter) return NextResponse.json({ error: "Unknown chapter" }, { status: 400 });
  if (
    messages.length === 0 ||
    messages.length > MAX_MESSAGES ||
    messages.some(
      (m) =>
        (m.role !== "user" && m.role !== "assistant") ||
        typeof m.content !== "string" ||
        !m.content.trim() ||
        m.content.length > MAX_MESSAGE_CHARS,
    )
  ) {
    return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
  }

  // Resolve the LLM key: user BYOK first, then the deployment-level key.
  let apiKey = process.env.AI_API_KEY ?? "";
  if (isByokConfigured()) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { byokKeyCiphertext: true },
    });
    if (user?.byokKeyCiphertext) {
      try {
        apiKey = decryptByokKey(user.byokKeyCiphertext);
      } catch {
        // fall through to the deployment-level key
      }
    }
  }
  if (!apiKey) {
    return NextResponse.json({ error: "no_key" }, { status: 503 });
  }

  const baseUrl = (process.env.AI_BASE_URL ?? "https://api.deepseek.com/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL ?? "deepseek-chat";
  const context = chapter.body.slice(0, MAX_CONTEXT_CHARS);

  const system = [
    "你是《高性价比人生指南》的阅读助手。用户正在读下面这一章，请基于章节内容回答用户的问题。",
    "回答用中文，简洁、说人话；章节里没有的信息可以说「本章没有讲」，并根据自己的知识补充，但要说明那不是书里的内容。",
    "不要编造出处和数字。",
    "",
    `章节标题：${chapter.title}`,
    "",
    "章节原文：",
    context,
  ].join("\n");

  const upstream = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, ...messages],
      temperature: 0.3,
      max_tokens: 1200,
    }),
  });

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    console.error("chat upstream error", upstream.status, detail.slice(0, 500));
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
  const data = await upstream.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (typeof reply !== "string" || !reply.trim()) {
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
  return NextResponse.json({ reply });
}
