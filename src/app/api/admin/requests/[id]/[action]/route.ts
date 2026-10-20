import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { postQuotaAction, type QuotaAction } from "@/lib/quota-admin";

type Ctx = { params: Promise<{ id: string; action: string }> };

const ACTIONS = ["approve", "reject", "reissue", "bind"] as const;

const ALLOWED_FIELDS: Record<QuotaAction, readonly string[]> = {
  approve: ["groups", "tier"],
  reject: ["reason"],
  reissue: ["groups", "tier"],
  bind: ["user_id", "tenant"],
};

function isQuotaAction(value: string): value is QuotaAction {
  return (ACTIONS as readonly string[]).includes(value);
}

function json(payload: unknown, status: number): NextResponse {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function invalidPayload(hint: string): NextResponse {
  return json({ error: "invalid_payload", hint }, 400);
}

/**
 * Server-side proxy for admin request actions.
 *
 * Browser -> this handler (NextAuth session + ADMIN_EMAILS check) -> quota
 * platform (X-Admin-Token from server env). The token is never returned, logged
 * or sent to the client.
 */
export async function POST(request: Request, ctx: Ctx): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    // Hide the endpoint from signed-out visitors.
    return json(
      { error: "not_found", hint: "登录状态已失效，请刷新页面后重新登录。" },
      404,
    );
  }
  if (!isAdmin(session)) {
    return json({ error: "forbidden", hint: "仅管理员可以执行此操作。" }, 403);
  }

  const { id: rawId, action } = await ctx.params;
  if (!/^\d+$/.test(rawId) || !isQuotaAction(action)) {
    return json({ error: "not_found" }, 404);
  }
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return json({ error: "not_found" }, 404);
  }

  const raw = await request.text();
  if (raw.length > 32_000) {
    return json({ error: "payload_too_large" }, 413);
  }

  let parsed: unknown = {};
  if (raw.trim()) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return json({ error: "invalid_json", hint: "请求体不是合法 JSON。" }, 400);
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return json({ error: "invalid_json", hint: "请求体必须是 JSON 对象。" }, 400);
  }

  const source = parsed as Record<string, unknown>;
  const payload: Record<string, unknown> = {};
  for (const field of ALLOWED_FIELDS[action]) {
    if (source[field] !== undefined) payload[field] = source[field];
  }

  if (action === "approve" || action === "reissue") {
    if (
      payload.groups !== undefined &&
      (!Array.isArray(payload.groups) || payload.groups.some((group) => typeof group !== "string"))
    ) {
      return invalidPayload("groups 必须是字符串数组。");
    }
    if (payload.tier !== undefined && typeof payload.tier !== "string") {
      return invalidPayload("tier 必须是字符串。");
    }
  }

  if (action === "reject" && payload.reason !== undefined && typeof payload.reason !== "string") {
    return invalidPayload("reason 必须是字符串。");
  }

  if (action === "bind") {
    if (payload.user_id !== undefined && typeof payload.user_id !== "string") {
      return invalidPayload("user_id 必须是字符串。");
    }
    if (payload.tenant !== undefined && typeof payload.tenant !== "string") {
      return invalidPayload("tenant 必须是字符串。");
    }

    const tenant = typeof payload.tenant === "string" ? payload.tenant.trim() : "";
    const rawUserId = typeof payload.user_id === "string" ? payload.user_id.trim() : "";
    const userId = rawUserId || (tenant.startsWith("u_") ? tenant.slice(2) : tenant);
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(userId)) {
      return invalidPayload("user_id 只能包含字母、数字、下划线和连字符（1–64 位）。");
    }
    payload.user_id = userId;
    payload.tenant = tenant || `u_${userId}`;
  }

  const result = await postQuotaAction(id, action, payload);
  return new NextResponse(result.body, {
    status: result.status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
