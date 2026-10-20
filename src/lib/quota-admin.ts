import type {
  AdminRequestRow,
  AdminStatusFilter,
  QuotaListPayload,
  QuotaRequest,
} from "@/lib/quota-types";

/**
 * Server-only access to quota-platform's admin API.
 *
 * The browser never talks to quota-platform and never sees QUOTA_ADMIN_TOKEN:
 * server components read the list, and the /api/admin route handler proxies
 * mutations. Both paths keep `cache: "no-store"` and a hard timeout.
 */
const DEFAULT_BASE = "http://127.0.0.1:3200";
const LIST_TIMEOUT_MS = 15_000;
const ACTION_TIMEOUT_MS = 25_000;

export type QuotaAction = "approve" | "reject" | "reissue" | "bind";

export type QuotaListResult =
  | { ok: true; data: QuotaListPayload }
  | { ok: false; status: number; error: string; hint: string };

export type QuotaActionResponse = { status: number; body: string };

function quotaBase(): string {
  const raw = process.env.QUOTA_BASE?.trim() || DEFAULT_BASE;
  return raw.replace(/\/+$/, "");
}

function adminToken(): string | null {
  const token = process.env.QUOTA_ADMIN_TOKEN?.trim();
  return token ? token : null;
}

function jsonResponse(status: number, payload: unknown): QuotaActionResponse {
  return { status, body: JSON.stringify(payload) };
}

/** `status` tab from the URL. Unknown/absent values fall back to the pending queue. */
export function parseAdminStatus(value: string | string[] | undefined): AdminStatusFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "pending" || raw === "approved" || raw === "rejected" || raw === "all"
    ? raw
    : "pending";
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function numberOrZero(value: unknown): number {
  return numberOrNull(value) ?? 0;
}

function normaliseListPayload(raw: unknown): QuotaListPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.requests)) return null;

  return {
    requests: obj.requests as QuotaRequest[],
    pending_count: numberOrZero(obj.pending_count),
    claimable_count: numberOrZero(obj.claimable_count),
    apply_groups: stringList(obj.apply_groups),
    tiers: stringList(obj.tiers),
    default_tier: stringValue(obj.default_tier),
  };
}

function upstreamError(raw: unknown, fallback: string): { error: string; hint: string } {
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    return {
      error: stringValue(obj.error) || fallback,
      hint: stringValue(obj.hint) || fallback,
    };
  }
  return { error: fallback, hint: fallback };
}

export async function fetchQuotaRequests(
  status: AdminStatusFilter = "all",
): Promise<QuotaListResult> {
  const token = adminToken();
  if (!token) {
    return {
      ok: false,
      status: 503,
      error: "quota_not_configured",
      hint: "服务端未配置 QUOTA_ADMIN_TOKEN，暂时无法加载申请列表。",
    };
  }

  const query = status === "all" ? "?limit=300" : `?status=${status}&limit=300`;

  let response: Response;
  try {
    response = await fetch(`${quotaBase()}/api/requests${query}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Admin-Token": token,
      },
      signal: AbortSignal.timeout(LIST_TIMEOUT_MS),
    });
  } catch {
    return {
      ok: false,
      status: 502,
      error: "upstream_unreachable",
      hint: "无法连接审批服务，请确认 quota-platform 正在运行。",
    };
  }

  const text = await response.text().catch(() => null);
  if (text === null) {
    return {
      ok: false,
      status: 502,
      error: "upstream_unreachable",
      hint: "读取审批服务响应失败，请稍后再试。",
    };
  }
  let raw: unknown = null;
  try {
    raw = text ? JSON.parse(text) : null;
  } catch {
    raw = null;
  }

  if (!response.ok) {
    const parsed = upstreamError(raw, `审批服务返回 HTTP ${response.status}`);
    const hint =
      response.status === 401 || response.status === 403
        ? "审批服务拒绝了管理令牌，请检查 QUOTA_ADMIN_TOKEN。"
        : parsed.hint;
    return { ok: false, status: response.status, error: parsed.error, hint };
  }

  const data = normaliseListPayload(raw);
  if (!data) {
    return {
      ok: false,
      status: 502,
      error: "upstream_invalid_response",
      hint: "审批服务返回了无法解析的数据。",
    };
  }

  return { ok: true, data };
}

/** POST /api/requests/<id>/<action> with the admin token. Token never leaves the server. */
export async function postQuotaAction(
  id: number,
  action: QuotaAction,
  payload: Record<string, unknown>,
): Promise<QuotaActionResponse> {
  const token = adminToken();
  if (!token) {
    return jsonResponse(503, {
      error: "quota_not_configured",
      hint: "服务端未配置 QUOTA_ADMIN_TOKEN，暂时无法执行审批操作。",
    });
  }

  let response: Response;
  try {
    response = await fetch(`${quotaBase()}/api/requests/${id}/${action}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Admin-Token": token,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(ACTION_TIMEOUT_MS),
    });
  } catch {
    return jsonResponse(502, {
      error: "upstream_unreachable",
      hint: "审批服务暂时不可用，请稍后再试。",
    });
  }

  if (response.status === 401 || response.status === 403) {
    return jsonResponse(502, {
      error: "quota_auth_failed",
      hint: "审批服务拒绝了管理令牌，请检查 QUOTA_ADMIN_TOKEN。",
    });
  }

  const text = await response.text().catch(() => null);
  if (text === null) {
    return jsonResponse(502, {
      error: "upstream_unreachable",
      hint: "读取审批服务响应失败，请稍后再试。",
    });
  }
  if (!text.trim()) {
    return jsonResponse(
      response.ok ? 200 : response.status,
      response.ok ? { ok: true } : { error: `upstream_http_${response.status}` },
    );
  }

  try {
    JSON.parse(text);
  } catch {
    return jsonResponse(502, {
      error: "upstream_invalid_response",
      hint: `审批服务返回了非 JSON 响应（HTTP ${response.status}）。`,
    });
  }

  return { status: response.status, body: text };
}

/** Map quota rows to the small, client-safe shape rendered by the table. */
export function toAdminRows(requests: QuotaRequest[]): AdminRequestRow[] {
  return requests.map((request) => ({
    id: numberOrZero(request.id),
    reqNo: stringValue(request.req_no),
    name: stringValue(request.name),
    contact: stringValue(request.contact),
    purpose: stringValue(request.purpose),
    product: stringValue(request.product) || "api",
    status: stringValue(request.status),
    createdAt: numberOrZero(request.created_at),
    decidedAt: numberOrNull(request.decided_at),
    rejectReason: stringValue(request.reject_reason),
    boundUserId: stringValue(request.bound_user_id),
    tenant: stringValue(request.tenant),
    requestedGroups: stringList(request.want_groups),
    grantedGroups: stringList(request.granted_groups),
    volume: stringValue(request.volume),
    mcKeyName: stringValue(request.mc_key_name),
    tokenPending: request.token_pending === true,
    pickedAt: numberOrNull(request.picked_at),
  }));
}
