import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { claimIdentityConfigured, signClaimIdentity } from "@/lib/quota-identity";

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
 * Alpha Desk 的申请在代理层要求登录，并附带 ALPHA_CLAIM_SECRET 签名的身份
 * 头；quota-platform 收到后把申请单绑定到该 user id。这样即使有人直接访问
 * 公网的 /quota/api/apply/<reqNo>/pickup，也无法领走别人的申请。
 */
const UPSTREAM =
  process.env.KEY_REQUEST_UPSTREAM?.replace(/\/$/, "") ?? "http://127.0.0.1:3300/api/apply";
const TIMEOUT_MS = 20_000;

type Ctx = { params: Promise<{ path?: string[] }> };

function noStore(body: unknown, status: number): NextResponse {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function isAlphaDeskApply(segs: string[], body: string): boolean {
  if (segs.length !== 0) return false;
  try {
    const parsed = JSON.parse(body) as { product?: unknown };
    return String(parsed?.product ?? "").toLowerCase() === "alpha-desk";
  } catch {
    return false;
  }
}

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

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Alpha Desk Pro 申请：必须登录，并把身份绑定到申请单。
  if (request.method === "POST" && body && isAlphaDeskApply(segs, body)) {
    const session = await auth();
    if (!session?.user?.id) {
      return noStore(
        {
          error: "login_required",
          hint: "申请 Alpha Desk Pro 需要先用 GitHub 登录，申请单才能绑定到你的账号。",
          signInUrl: "/api/auth/signin?callbackUrl=/alpha-desk",
        },
        401,
      );
    }
    if (!claimIdentityConfigured()) {
      return noStore(
        {
          error: "identity_unavailable",
          hint: "网站未配置 ALPHA_CLAIM_SECRET，暂时不能提交 Pro 申请。请联系管理员。",
        },
        503,
      );
    }
    Object.assign(headers, signClaimIdentity("apply", session.user.id));
  }

  // 兼容路径：登录用户通过代理领取时也带身份（claim 路由本身直连 quota，
  // 不依赖这里；generic apply 页面匿名领取仍走旧行为）。
  if (request.method === "POST" && segs.length === 2 && segs[1] === "pickup") {
    const session = await auth();
    if (session?.user?.id && claimIdentityConfigured()) {
      Object.assign(headers, signClaimIdentity("pickup", session.user.id, segs[0].toUpperCase()));
    }
  }

  try {
    const res = await fetch(target, {
      method: request.method,
      headers,
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
    return noStore({ error: "upstream_unreachable", hint: "申请服务暂时不可用，请稍后再试" }, 502);
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
