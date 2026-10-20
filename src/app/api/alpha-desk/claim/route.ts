import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  assertLicenseVerifies,
  licenseDays,
  loadPublicKey,
  loadSigningKey,
  memoryPublicUrl,
  signAlphaLicense,
  type AlphaLicensePayload,
} from "@/lib/alpha-license";
import { bridgeConfigured } from "@/lib/memory-bridge";
import { createMemoryToken, revokeMemoryToken } from "@/lib/memory-tokens";
import { canonicalTenant } from "@/lib/tenants";
import { claimIdentityConfigured, signClaimIdentity } from "@/lib/quota-identity";

/**
 * Claim an approved Alpha Desk application.
 *
 * Security model (audit P0-3 / P1-1):
 *  - requires a GitHub session;
 *  - quota-platform is called with an HMAC identity proof, so calling the
 *    public /quota/api/apply/<reqNo>/pickup endpoint directly cannot bypass
 *    the website or claim someone else's request;
 *  - `LicenseClaim.reqNo` is unique, so one request can only be bound to one
 *    website user even under concurrent claims;
 *  - the request must be product=alpha-desk;
 *  - a tenant-bound `cm_` memory token is minted and projected to cloud.json
 *    in the same flow; only its SHA-256 is stored. The plaintext is returned
 *    once, both inside the signed license and as `memoryToken`.
 *
 * The legacy `cloud_key` (mcphub key) is still embedded for old clients and
 * for /hub/mcp/memory compatibility; new clients prefer memory_url +
 * memory_token.
 */

const UPSTREAM =
  process.env.KEY_REQUEST_UPSTREAM?.replace(/\/$/, "") ?? "http://127.0.0.1:3300/api/apply";
const TIMEOUT_MS = 20_000;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5_000;

function pruneBuckets(now: number) {
  if (buckets.size <= MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function limited(ip: string): boolean {
  const now = Date.now();
  pruneBuckets(now);
  const current = buckets.get(ip);
  if (!current || current.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 10;
}

function clientIp(request: Request): string {
  // nginx appends the real peer to X-Forwarded-For; the left-most value is
  // user-controlled. Match quota-platform and use the last hop.
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const last = forwarded.split(",").pop()?.trim();
    if (last) return last;
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

function noStore(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && (error as { code?: string }).code === "P2002");
}

type QuotaStatus = {
  status?: string;
  claimable?: boolean;
  product?: string;
  name?: string;
  granted_groups?: unknown;
  reject_reason?: unknown;
  hint?: string;
  binding?: string;
  binding_required?: boolean;
};

async function quotaStatus(reqNo: string): Promise<{ ok: true; data: QuotaStatus } | { ok: false; response: NextResponse }> {
  try {
    const response = await fetch(`${UPSTREAM}/${encodeURIComponent(reqNo)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { hint?: string };
      return {
        ok: false,
        response: noStore(
          { error: "request_not_found", hint: data.hint ?? "申请单号不存在或查询失败" },
          response.status === 404 ? 404 : 502,
        ),
      };
    }
    return { ok: true, data: (await response.json()) as QuotaStatus };
  } catch {
    return {
      ok: false,
      response: noStore({ error: "upstream_unreachable", hint: "申请服务暂时不可用，请稍后再试" }, 502),
    };
  }
}

export async function POST(request: Request) {
  if (limited(clientIp(request))) {
    return noStore({ error: "rate_limited", hint: "操作过于频繁，请一分钟后再试" }, 429);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return noStore(
      {
        error: "login_required",
        hint: "领取 Pro license 需要用申请时的 GitHub 账号登录。",
        signInUrl: "/api/auth/signin?callbackUrl=/alpha-desk",
      },
      401,
    );
  }
  const userId = session.user.id;
  const tenant = canonicalTenant(userId);

  if (!claimIdentityConfigured()) {
    return noStore(
      {
        error: "identity_unavailable",
        hint: "网站未配置 ALPHA_CLAIM_SECRET，暂时不能领取 license。请联系管理员。",
      },
      503,
    );
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

  // A request can only ever be bound to one website user.
  const existing = await prisma.licenseClaim.findUnique({ where: { reqNo } });
  if (existing) {
    if (existing.userId !== userId) {
      return noStore(
        { error: "request_bound_to_other_user", hint: "该申请单已绑定其他账号，不能由当前账号领取。" },
        403,
      );
    }
    if (existing.status === "issued") {
      return noStore(
        {
          error: "already_claimed",
          hint: "这个申请单已经领取过。license 不会再次显示；如需补发请联系管理员。",
        },
        409,
      );
    }
    // A `failed` claim may be retried after an admin reissue: quota's
    // claimable flag below is the authority for whether a fresh one-shot key
    // exists. If it is still false, the request is returned as 410 and the
    // claim stays failed for audit.
  }

  const statusResult = await quotaStatus(reqNo);
  if (!statusResult.ok) return statusResult.response;
  const status = statusResult.data;

  if (status.product !== "alpha-desk") {
    return noStore(
      { error: "not_alpha_desk", hint: "该申请单不是 Alpha Desk 产品，不能生成 Pro license。" },
      409,
    );
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
    if (status.binding_required) {
      return noStore(
        {
          error: "claim_unbound",
          hint: "这个申请单还没有绑定网站账号，请联系管理员在管理台绑定后再领取。",
        },
        409,
      );
    }
    if (existing) {
      await prisma.licenseClaim
        .update({ where: { id: existing.id }, data: { status: "failed", errorCode: "not_claimable" } })
        .catch(() => undefined);
    }
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
  if (hasMemory && !bridgeConfigured()) {
    return noStore(
      {
        error: "bridge_unavailable",
        hint: "云端记忆桥接未配置（CM_TOKENS_BRIDGE），为避免发出不可用的 token，本次领取已拒绝。",
      },
      503,
    );
  }

  const plan = hasMemory ? "memory" : "pro";
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + licenseDays() * 86_400;
  const expiresAt = new Date(exp * 1000);
  const features = [
    "reports",
    ...(hasAlpha ? ["cloud-alpha"] : []),
    ...(hasMemory ? ["cloud-memory"] : []),
  ];

  // Reserve the reqNo before consuming the one-shot pickup. Retries by the
  // same user reuse a pending row; concurrent users lose on the unique index.
  let claimId: string;
  let reservationCreated = false;
  let previousToken: { id: string; tokenHash: string } | null = null;
  try {
    if (existing) {
      const updated = await prisma.licenseClaim.update({
        where: { id: existing.id },
        data: {
          tenant,
          plan,
          features: JSON.stringify(features),
          memoryGranted: hasMemory,
          expiresAt,
          status: "pending",
          errorCode: "",
        },
        select: { id: true, memoryTokenId: true },
      });
      claimId = updated.id;
      if (updated.memoryTokenId) {
        const old = await prisma.apiToken.findUnique({
          where: { id: updated.memoryTokenId },
          select: { id: true, tokenHash: true },
        });
        if (old) previousToken = old;
      }
    } else {
      const created = await prisma.licenseClaim.create({
        data: {
          reqNo,
          userId,
          tenant,
          plan,
          features: JSON.stringify(features),
          memoryGranted: hasMemory,
          expiresAt,
          status: "pending",
        },
        select: { id: true },
      });
      claimId = created.id;
      reservationCreated = true;
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return noStore(
        { error: "request_bound_to_other_user", hint: "该申请单已被其他账号领取，请勿重复提交。" },
        409,
      );
    }
    throw error;
  }

  if (previousToken) {
    await revokeMemoryToken(previousToken.id, previousToken.tokenHash);
    await prisma.licenseClaim.update({ where: { id: claimId }, data: { memoryTokenId: null } });
  }

  let memory: { id: string; token: string; tokenHash: string } | null = null;
  if (hasMemory) {
    try {
      memory = await createMemoryToken({
        userId,
        tenant,
        name: `Alpha Desk ${reqNo}`,
        expiresAt,
        source: "alpha-desk",
      });
      await prisma.licenseClaim.update({ where: { id: claimId }, data: { memoryTokenId: memory.id } });
    } catch (error) {
      if (memory) await revokeMemoryToken(memory.id, memory.tokenHash).catch(() => undefined);
      if (reservationCreated) {
        await prisma.licenseClaim.delete({ where: { id: claimId } }).catch(() => undefined);
      }
      return noStore(
        {
          error: "memory_token_failed",
          hint: `云端记忆 token 创建失败，未领取云端 key：${
            error instanceof Error ? error.message : "unknown error"
          }`,
        },
        503,
      );
    }
  }

  // The pickup is one-shot: after this call the cloud key exists only here.
  let pickup: { token?: string; groups?: string[]; key_id?: string; key_name?: string };
  try {
    const identity = signClaimIdentity("pickup", userId, reqNo);
    const response = await fetch(`${UPSTREAM}/${encodeURIComponent(reqNo)}/pickup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...identity },
      body: "{}",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = (await response.json().catch(() => ({}))) as {
      token?: string;
      hint?: string;
      groups?: string[];
      key_id?: string;
      key_name?: string;
    };
    if (!response.ok || !data.token) {
      if (memory) await revokeMemoryToken(memory.id, memory.tokenHash);
      if (response.status === 410) {
        await prisma.licenseClaim
          .update({ where: { id: claimId }, data: { status: "failed", errorCode: "pickup_consumed" } })
          .catch(() => undefined);
        return noStore(
          {
            error: "already_claimed",
            hint: "这个申请单的 key 已被领取或已过期。若丢失，请联系管理员重新发放。",
          },
          410,
        );
      }
      await prisma.licenseClaim.delete({ where: { id: claimId } }).catch(() => undefined);
      return noStore(
        { error: "pickup_failed", hint: data.hint ?? "领取失败，请联系管理员重新发放" },
        response.status === 403 ? 403 : 502,
      );
    }
    pickup = data;
  } catch {
    if (memory) await revokeMemoryToken(memory.id, memory.tokenHash);
    await prisma.licenseClaim.delete({ where: { id: claimId } }).catch(() => undefined);
    return noStore({ error: "upstream_unreachable", hint: "领取服务暂时不可用，请稍后再试" }, 502);
  }

  const payload: AlphaLicensePayload = {
    v: 1,
    sub: tenant,
    name: String(status.name ?? "user"),
    plan,
    iat,
    exp,
    features,
    cloud_key: pickup.token,
    alpha_key: pickup.token,
    ...(hasMemory
      ? { memory_url: memoryPublicUrl(), memory_token: memory?.token, tenant }
      : { tenant }),
    request: reqNo,
  };

  try {
    const license = signAlphaLicense(payload, privateKey);
    assertLicenseVerifies(license, publicKey);
    const licenseSha256 = createHash("sha256").update(license).digest("hex");

    const current = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
    const paid = new Set(["pro", "memory", "team", "enterprise"]);
    const nextPlan = current?.plan && paid.has(current.plan) ? current.plan : "pro";

    await prisma.$transaction([
      prisma.licenseClaim.update({
        where: { id: claimId },
        data: {
          status: "issued",
          memoryTokenId: memory?.id ?? null,
          alphaKeyId: pickup.key_id ?? "",
          alphaKeyName: pickup.key_name ?? "",
          licenseSha256,
          features: JSON.stringify(features),
          issuedAt: new Date(iat * 1000),
          expiresAt,
          errorCode: "",
        },
      }),
      prisma.user.update({ where: { id: userId }, data: { plan: nextPlan } }),
    ]);

    return noStore({
      ok: true,
      license,
      plan,
      features,
      groups,
      tenant,
      request: reqNo,
      memoryGranted: hasMemory,
      memoryToken: memory?.token ?? null,
      memoryUrl: hasMemory ? memoryPublicUrl() : null,
      issuedAt: new Date(iat * 1000).toISOString(),
      expiresAt: new Date(exp * 1000).toISOString().slice(0, 10),
      downloadUrl: "/api/alpha-desk/download",
      hint:
        "license 与 memory token 只显示这一次。请立即粘贴到 设置 → Alpha Desk，或存入密码管理器。",
    });
  } catch (error) {
    if (memory) await revokeMemoryToken(memory.id, memory.tokenHash).catch(() => undefined);
    await prisma.licenseClaim
      .update({ where: { id: claimId }, data: { status: "failed", errorCode: "sign_failed" } })
      .catch(() => undefined);
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
