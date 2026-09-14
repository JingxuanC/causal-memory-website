import { NextResponse } from "next/server";

/**
 * API key 申请服务的同源代理。
 *
 * 为什么不让浏览器直接调用后端：后端是内部的配额管控台，路径形如 `/quota/api/apply`。
 * 把那个路径暴露给公网既难看也泄漏内部结构。这里由 Next 服务端转发，
 * 浏览器只看到 `https://causal-memory.com/api/key-request/...`。
 *
 * 路径映射（纯前缀替换）：
 *   /api/key-request            → /api/apply
 *   /api/key-request/meta       → /api/apply/meta
 *   /api/key-request/REQ-XXXX   → /api/apply/REQ-XXXX
 *   /api/key-request/REQ-XXXX/pickup → /api/apply/REQ-XXXX/pickup
 *
 * 上游地址用 KEY_REQUEST_UPSTREAM 覆盖（默认本机 3300，与本仓库同机部署）。
 */
const UPSTREAM =
  process.env.KEY_REQUEST_UPSTREAM?.replace(/\/$/, "") ?? "http://127.0.0.1:3300/api/apply";
const TIMEOUT_MS = 20_000;

type Ctx = { params: Promise<{ path?: string[] }> };

async function forward(request: Request, segs: string[]): Promise<NextResponse> {
  const url = new URL(request.url);
  // 逐段 encodeURIComponent：单号是字母数字，但别给未来留注入空间
  const suffix = segs.length ? "/" + segs.map(encodeURIComponent).join("/") : "";
  const target = `${UPSTREAM}${suffix}${url.search}`;

  const noBody = request.method === "GET" || request.method === "HEAD";
  let body: string | undefined;
  if (!noBody) {
    body = await request.text();
    if (!body) body = "{}";
  }

  try {
    const res = await fetch(target, {
      method: request.method,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        // 申请状态/密钥不该被任何中间层缓存
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "upstream_unreachable", hint: "申请服务暂时不可用，请稍后再试" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function GET(request: Request, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return forward(request, path);
}

export async function POST(request: Request, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return forward(request, path);
}
