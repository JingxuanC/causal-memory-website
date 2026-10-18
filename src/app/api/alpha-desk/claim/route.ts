import { NextResponse } from "next/server";
import {
  assertLicenseVerifies,
  licenseDays,
  loadPublicKey,
  loadSigningKey,
  signAlphaLicense,
  type AlphaLicensePayload,
} from "@/lib/alpha-license";

/**
 * Claim an approved Alpha Desk application.
 *
 * The approval itself lives in quota-platform: the admin approves the request
 * and mcphub mints a group-scoped cloud key (kept in memory until pickup). This
 * route picks that key up exactly once, embeds it into a signed offline
 * license, and never stores either secret.
 *
 * A cloud key is consumed by the pickup call, so the signing key is validated
 * with a throwaway payload *before* the request is touched. If signing still
 * fails afterwards, the response says the cloud key may have been consumed.
 */

const UPSTREAM =
  process.env.KEY_REQUEST_UPSTREAM?.replace(/\/$/, "") ?? "http://127.0.0.1:3300/api/apply";
const TIMEOUT_MS = 20_000;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function limited(ip: string): boolean {
  const now = Date.now();
  const current = buckets.get(ip);
  if (!current || current.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 10;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function noStore(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  if (limited(clientIp(request))) {
    return noStore({ error: "rate_limited", hint: "操作过于频繁，请一分钟后再试" }, 429);
  }

  let body: { reqNo?: string };
  try {
    body = (await request.json()) as { reqNo?: string };
  } catch {
    return noStore({ error: "invalid_json", hint: "请求体不是 JSON" }, 400);
  }
  const reqNo = String(body.reqNo ?? "").trim().toUpperCase();
  if (!/^REQ-[A-Z0-9]{8}$/.test(reqNo)) {
    return noStore({ error: "invalid_req_no", hint: "请输入正确的申请单号（REQ-XXXXXXXX）" }, 400);
  }

  // Validate the signing key before touching the one-shot cloud key.
  let privateKey: string;
  let publicKey: string | null;
  try {
    privateKey = loadSigningKey();
    publicKey = loadPublicKey();
    const probe = signAlphaLicense(
      {
        v: 1,
        sub: "alpha-desk-signing-probe",
        plan: "pro",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60,
        features: [],
      },
      privateKey,
    );
    assertLicenseVerifies(probe, publicKey);
  } catch (error) {
    return noStore(
      {
        error: "signing_unavailable",
        hint: error instanceof Error ? error.message : "license 签名服务未配置",
      },
      503,
    );
  }

  let status: Record<string, unknown>;
  try {
    const response = await fetch(`${UPSTREAM}/${encodeURIComponent(reqNo)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { hint?: string };
      return noStore(
        { error: "request_not_found", hint: data.hint ?? "申请单号不存在或查询失败" },
        response.status === 404 ? 404 : 502,
      );
    }
    status = (await response.json()) as Record<string, unknown>;
  } catch {
    return noStore({ error: "upstream_unreachable", hint: "申请服务暂时不可用，请稍后再试" }, 502);
  }

  if (status.status !== "approved") {
    return noStore(
      {
        error: "not_approved",
        status: status.status,
        hint:
          status.status === "pending"
            ? "申请仍在审批中，通过后再来领取"
            : status.status === "rejected"
              ? `申请未通过${status.reject_reason ? `：${String(status.reject_reason)}` : ""}`
              : "该申请当前不可领取",
      },
      409,
    );
  }
  if (status.claimable !== true) {
    return noStore(
      {
        error: "already_claimed",
        hint: "这个申请单的 key 已领取或已过期。若丢失，请联系管理员重新发放。",
      },
      410,
    );
  }

  const groups = Array.isArray(status.granted_groups)
    ? status.granted_groups.map((item) => String(item))
    : [];
  const hasAlpha = groups.includes("alpha");
  const hasMemory = groups.includes("memory");
  if (!hasAlpha && !hasMemory) {
    return noStore(
      { error: "not_pro", hint: "该申请未授权 alpha / memory 分组，不能生成 Pro license" },
      409,
    );
  }

  // The pickup is one-shot: after this call the cloud key exists only here.
  let pickup: { token?: string; groups?: string[] };
  try {
    const response = await fetch(`${UPSTREAM}/${encodeURIComponent(reqNo)}/pickup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = (await response.json().catch(() => ({}))) as { token?: string; hint?: string; groups?: string[] };
    if (!response.ok || !data.token) {
      return noStore(
        { error: "pickup_failed", hint: data.hint ?? "领取失败，请联系管理员重新发放" },
        response.status === 410 ? 410 : 502,
      );
    }
    pickup = data;
  } catch {
    return noStore({ error: "upstream_unreachable", hint: "领取服务暂时不可用，请稍后再试" }, 502);
  }

  const plan = hasMemory ? "memory" : "pro";
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + licenseDays() * 86_400;
  const features = [
    "reports",
    ...(hasAlpha ? ["cloud-alpha"] : []),
    ...(hasMemory ? ["cloud-memory"] : []),
  ];
  const payload: AlphaLicensePayload = {
    v: 1,
    sub: `Alpha Desk · ${String(status.name ?? "user")}`,
    plan,
    iat,
    exp,
    features,
    cloud_key: pickup.token,
  };

  try {
    const license = signAlphaLicense(payload, privateKey);
    assertLicenseVerifies(license, publicKey);
    return noStore({
      ok: true,
      license,
      plan,
      features,
      groups,
      issuedAt: new Date(iat * 1000).toISOString(),
      expiresAt: new Date(exp * 1000).toISOString().slice(0, 10),
      downloadUrl: "/api/alpha-desk/download",
      hint: "license 只显示这一次。请立即粘贴到 设置 → Alpha Desk，或存入密码管理器。",
    });
  } catch (error) {
    return noStore(
      {
        error: "sign_failed",
        cloud_key_consumed: true,
        hint: `license 签名失败，cloud key 已被领取。请联系管理员重新发放：${
          error instanceof Error ? error.message : "unknown error"
        }`,
      },
      500,
    );
  }
}
