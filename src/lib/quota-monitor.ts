/**
 * Server-only reader for quota-platform's usage monitoring API.
 *
 * `/admin/monitor` renders this data; the browser never sees the admin token.
 */
const DEFAULT_BASE = "http://127.0.0.1:3300";
const TIMEOUT_MS = 15_000;

export type QuotaSeriesPoint = {
  date: string;
  total: number;
  heavy: number;
  blocked: number;
};

export type QuotaGroupUsage = { group_name: string; calls: number; heavy: number };

export type QuotaBlock = {
  ts: number;
  key_name: string;
  group_name: string;
  reason: string;
};

export type QuotaCall = {
  id: number;
  ts: number;
  key_name: string;
  group_name: string;
  tool: string;
  latency_ms: number;
  status: string;
  reason: string;
};

export type QuotaState = {
  today_calls: number;
  today_heavy: number;
  today_keys: number;
  month_calls: number;
  blocks_24h: number;
  today_success_rate: number | null;
  today_latency: { p50: number | null; p95: number | null };
  series_7d: QuotaSeriesPoint[];
  group_usage: QuotaGroupUsage[];
  recent_blocks: QuotaBlock[];
  pending_requests: number;
  claimable_tokens: number;
  inventory: unknown[];
};

export type QuotaMonitorResult =
  | { ok: true; state: QuotaState; calls: QuotaCall[] }
  | { ok: false; status: number; error: string; hint: string };

function quotaBase(): string {
  return (process.env.QUOTA_BASE?.trim() || DEFAULT_BASE).replace(/\/+$/, "");
}

function adminToken(): string | null {
  const token = process.env.QUOTA_ADMIN_TOKEN?.trim();
  return token ? token : null;
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function numOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function series(value: unknown): QuotaSeriesPoint[] {
  if (!Array.isArray(value)) return [];
  return value.map((row) => {
    const item = (row ?? {}) as Record<string, unknown>;
    return {
      date: str(item.date),
      total: num(item.total),
      heavy: num(item.heavy),
      blocked: num(item.blocked),
    };
  });
}

function groups(value: unknown): QuotaGroupUsage[] {
  if (!Array.isArray(value)) return [];
  return value.map((row) => {
    const item = (row ?? {}) as Record<string, unknown>;
    return { group_name: str(item.group_name), calls: num(item.calls), heavy: num(item.heavy) };
  });
}

function blocks(value: unknown): QuotaBlock[] {
  if (!Array.isArray(value)) return [];
  return value.map((row) => {
    const item = (row ?? {}) as Record<string, unknown>;
    return {
      ts: num(item.ts),
      key_name: str(item.key_name),
      group_name: str(item.group_name),
      reason: str(item.reason),
    };
  });
}

function calls(value: unknown): QuotaCall[] {
  if (!Array.isArray(value)) return [];
  return value.map((row) => {
    const item = (row ?? {}) as Record<string, unknown>;
    return {
      id: num(item.id),
      ts: num(item.ts),
      key_name: str(item.key_name),
      group_name: str(item.group_name),
      tool: str(item.tool),
      latency_ms: num(item.latency_ms),
      status: str(item.status),
      reason: str(item.reason),
    };
  });
}

async function request(path: string): Promise<{ status: number; body: string }> {
  const token = adminToken();
  if (!token) {
    return { status: 503, body: JSON.stringify({ error: "quota_token_missing" }) };
  }
  const response = await fetch(`${quotaBase()}${path}`, {
    headers: { "X-Admin-Token": token, accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return { status: response.status, body: await response.text() };
}

function errorHint(status: number, error: string): { error: string; hint: string } {
  if (status === 503) {
    return {
      error: "quota_token_missing",
      hint: "服务端未配置 QUOTA_ADMIN_TOKEN，监控数据不可用。",
    };
  }
  if (status === 401 || status === 403) {
    return {
      error: "quota_auth_failed",
      hint: "quota-platform 拒绝了管理令牌，请检查 QUOTA_ADMIN_TOKEN 是否与 /opt/mcp-suite/.env 一致。",
    };
  }
  if (error === "timeout") {
    return { error: "quota_timeout", hint: "quota-platform 响应超时（15s），请检查服务状态。" };
  }
  return {
    error: error || "quota_unavailable",
    hint: "无法连接 quota-platform（127.0.0.1:3300），请确认容器在运行。",
  };
}

export async function fetchQuotaMonitor(): Promise<QuotaMonitorResult> {
  try {
    const [stateRes, callsRes] = await Promise.all([
      request("/api/state"),
      request("/api/calls?limit=60"),
    ]);
    if (stateRes.status !== 200) {
      return { ok: false, status: stateRes.status, ...errorHint(stateRes.status, "quota_state_failed") };
    }
    const raw = JSON.parse(stateRes.body) as Record<string, unknown>;
    const state: QuotaState = {
      today_calls: num(raw.today_calls),
      today_heavy: num(raw.today_heavy),
      today_keys: num(raw.today_keys),
      month_calls: num(raw.month_calls),
      blocks_24h: num(raw.blocks_24h),
      today_success_rate: numOrNull(raw.today_success_rate),
      today_latency: {
        p50: numOrNull((raw.today_latency as { p50?: unknown } | undefined)?.p50),
        p95: numOrNull((raw.today_latency as { p95?: unknown } | undefined)?.p95),
      },
      series_7d: series(raw.series_7d),
      group_usage: groups(raw.group_usage),
      recent_blocks: blocks(raw.recent_blocks),
      pending_requests: num(raw.pending_requests),
      claimable_tokens: num(raw.claimable_tokens),
      inventory: Array.isArray(raw.inventory) ? raw.inventory : [],
    };
    let recent: QuotaCall[] = [];
    if (callsRes.status === 200) {
      const parsed = JSON.parse(callsRes.body) as Record<string, unknown>;
      recent = calls(parsed.calls);
    }
    return { ok: true, state, calls: recent };
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    const detail = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      status: 502,
      ...errorHint(502, name === "TimeoutError" ? "timeout" : detail.toLowerCase()),
    };
  }
}

export function formatTime(ts: number): string {
  if (!ts) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(ts * 1000));
}
