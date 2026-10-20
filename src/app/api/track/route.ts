import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 2 * 1024;
const MAX_PATH = 300;
const BOT_RE = /bot|crawler|spider|preview|monitor|curl|wget|headless|facebookexternalhit|slackbot|telegrambot/i;

function salt(): string {
  return process.env.TRACK_SALT?.trim() || process.env.AUTH_SECRET?.trim() || "pageview-salt-v1";
}

function hash(value: string): string {
  return createHash("sha256").update(`${salt()}:${value}`).digest("hex").slice(0, 32);
}

function deviceOf(ua: string): string {
  if (/ipad|tablet|kindle|playbook/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua)) return "mobile";
  return "desktop";
}

function cleanPath(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const path = input.trim();
  if (!path.startsWith("/") || path.length > MAX_PATH) return null;
  if (path.startsWith("/admin") || path.startsWith("/api") || path.startsWith("/_next")) return null;
  return path.split("?")[0] || "/";
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.text();
    if (!body || body.length > MAX_BODY) return new NextResponse(null, { status: 204 });
    const payload = JSON.parse(body) as { path?: unknown; referrer?: unknown };
    const path = cleanPath(payload.path);
    const ua = request.headers.get("user-agent") ?? "";
    if (!path || BOT_RE.test(ua)) return new NextResponse(null, { status: 204 });

    const forwarded = request.headers.get("x-forwarded-for") ?? "";
    const ip = forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown";
    const referrer = typeof payload.referrer === "string" ? payload.referrer.slice(0, 300) : "";
    const country = (request.headers.get("cf-ipcountry") ?? request.headers.get("x-country") ?? "").toUpperCase().slice(0, 2);

    await prisma.pageview.create({
      data: {
        path,
        referrer,
        device: deviceOf(ua),
        country,
        uaHash: hash(ua),
        ipHash: hash(ip),
      },
    });
  } catch {
    // Analytics must never break a page or leak an error to the visitor.
  }
  return new NextResponse(null, { status: 204 });
}
