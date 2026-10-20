import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { memoryPublicUrl } from "@/lib/alpha-license";
import { bridgeConfigured } from "@/lib/memory-bridge";
import { createMemoryToken, revokeMemoryToken } from "@/lib/memory-tokens";
import { canonicalTenant } from "@/lib/tenants";
import { claimIdentityConfigured, signClaimIdentity } from "@/lib/quota-identity";

/**
 * Claim an approved cloud-memory application (`product=memory`).
 *
 * The request itself lives in quota-platform (bound to the website user at
 * submit time through the HMAC identity headers). The `cm_` memory token is
 * minted here, because only the website knows the tenant namespace and the
 * cloud.json bridge:
 *
 *   1. require a GitHub session (same user the request was bound to);
 *   2. read the public status and require product=memory / approved / bound;
 *   3. reserve the request in LicenseClaim (reqNo is unique) so concurrent
 *      claims cannot both mint a token;
 *   4. mint the token and project it to cloud.json (SHA-256 at rest);
 *   5. call quota's pickup endpoint with a signed identity so the request is
 *      marked as consumed exactly once;
 *   6. mark the claim issued and raise User.plan to at least `memory`.
 *
 * No license is generated for memory. Alpha Desk keeps using
 * `/api/alpha-desk/claim`, which still returns license + memoryToken.
 */

const UPSTREAM =
  process.env.KEY_REQUEST_UPSTREAM?.replace(/\/$/, "") ?? "http://127.0.0.1:3300/api/apply";
const TIMEOUT_MS = 20_000;

function memoryDays(): number {
  const raw = Number(process.env.MEMORY_LICENSE_DAYS ?? 30);
  return Number.isFinite(raw) && raw > 0 ? Math.min(3650, Math.floor(raw)) : 30;
}

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
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && (error as { code?: string }).code === "P2002");
}

type QuotaStatus = {
  status?: string;
  claimable?: boolean;
  product?: string;
  binding?: string;
  binding_required?: boolean;
  picked_at?: number | null;
  hint?: string;
  reject_reason?: unknown;
};

async function quotaStatus(
  reqNo: string,
): Promise<{ ok: true; data: QuotaStatus } | { ok: false; response: NextResponse }> {
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
        hint: "领取云端记忆密钥需要用申请时的 GitHub 账号登录。",
        signInUrl: "/api/auth/signin?callbackUrl=%2Fapply%3Fproduct%3Dmemory",
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
        hint: "网站未配置 ALPHA_CLAIM_SECRET，暂时不能领取记忆密钥。请联系管理员。",
      },
      503,
    );
  }
  if (!bridgeConfigured()) {
    return noStore(
      {
        error: "bridge_unavailable",
        hint: "云端记忆桥接未配置（CM_TOKENS_BRIDGE），为避免发出不可用的 token，本次领取已拒绝。",
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

  // A request can only ever be attached to one website user.
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
          hint: "这个申请单已经领取过记忆密钥。密钥只显示一次；如需补发请联系管理员。",
        },
        409,
      );
    }
  }

  const statusResult = await quotaStatus(reqNo);
  if (!statusResult.ok) return statusResult.response;
  const status = statusResult.data;

  if (status.product !== "memory") {
    return noStore(
      { error: "not_memory", hint: "该申请单不是云端记忆产品，不能在这里领取记忆密钥。" },
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
  if (status.binding_required || status.binding === "anonymous") {
    return noStore(
      {
        error: "claim_unbound",
        hint: "这个申请单还没有绑定网站账号，请联系管理员在管理台绑定后再领取。",
      },
      409,
    );
  }
  if (status.claimable !== true || status.picked_at) {
    return noStore(
      {
        error: "already_claimed",
        hint: "这个申请单已经领取过。记忆密钥只显示一次；如需补发请联系管理员。",
      },
      409,
    );
  }

  const expiresAt = new Date(Date.now() + memoryDays() * 86_400_000);
  const features = ["cloud-memory"];

  // Reserve the request before minting. The unique reqNo makes concurrent
  // claims deterministic; a retry by the same user may reuse the pending row.
  let claimId: string;
  let previousToken: { id: string; tokenHash: string } | null = null;
  try {
    if (existing) {
      const updated = await prisma.licenseClaim.update({
        where: { id: existing.id },
        data: {
          tenant,
          plan: "memory",
          features: JSON.stringify(features),
          memoryGranted: true,
          alphaKeyId: "",
          alphaKeyName: "",
          licenseSha256: "",
          status: "pending",
          errorCode: "",
          expiresAt,
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
          plan: "memory",
          features: JSON.stringify(features),
          memoryGranted: true,
          expiresAt,
          status: "pending",
        },
        select: { id: true },
      });
      claimId = created.id;
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return noStore(
        { error: "already_claimed", hint: "该申请单已被领取或正在被领取，请勿重复提交。" },
        409,
      );
    }
    throw error;
  }

  if (previousToken) {
    await revokeMemoryToken(previousToken.id, previousToken.tokenHash);
    await prisma.licenseClaim.update({ where: { id: claimId }, data: { memoryTokenId: null } });
  }

  let memory: { id: string; token: string; tokenHash: string };
  try {
    memory = await createMemoryToken({
      userId,
      tenant,
      name: `云端记忆 ${reqNo}`,
      expiresAt,
      source: "memory",
    });
    await prisma.licenseClaim.update({ where: { id: claimId }, data: { memoryTokenId: memory.id } });
  } catch (error) {
    await prisma.licenseClaim
      .delete({ where: { id: claimId } })
      .catch(() => undefined);
    return noStore(
      {
        error: "memory_token_failed",
        hint: `记忆密钥创建失败，本次未领取：${
          error instanceof Error ? error.message : "unknown error"
        }`,
      },
      503,
    );
  }

  // Consume the quota request only after the credential exists. If this call
  // fails the token is revoked, so we never hand out a credential whose
  // request is still claimable by someone else.
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
      ok?: boolean;
      error?: string;
      hint?: string;
    };
    if (!response.ok || data.ok === false) {
      await revokeMemoryToken(memory.id, memory.tokenHash);
      if (response.status === 410) {
        // The request really was consumed. Keep a failed row for audit, but
        // the token is revoked and was never returned to the client.
        await prisma.licenseClaim
          .update({
            where: { id: claimId },
            data: { status: "failed", errorCode: data.error || "pickup_410" },
          })
          .catch(() => undefined);
        return noStore(
          {
            error: "already_claimed",
            hint: "这个申请单的领取登记已完成或已过期，记忆密钥未签发。请联系管理员处理。",
          },
          409,
        );
      }
      // 403/409/5xx: ownership did not match or the upstream did not consume
      // the request. Delete the reservation so one user cannot permanently
      // block the real owner by racing a claim with a foreign account.
      await prisma.licenseClaim.delete({ where: { id: claimId } }).catch(() => undefined);
      return noStore(
        { error: "pickup_failed", hint: data.hint ?? "领取登记失败，请稍后再试或联系管理员。" },
        response.status === 403 || response.status === 409 ? 409 : 502,
      );
    }
  } catch {
    await revokeMemoryToken(memory.id, memory.tokenHash);
    await prisma.licenseClaim.delete({ where: { id: claimId } }).catch(() => undefined);
    return noStore({ error: "upstream_unreachable", hint: "领取服务暂时不可用，请稍后再试。" }, 502);
  }

  try {
    const current = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
    const paid = new Set(["pro", "memory", "team", "enterprise"]);
    const nextPlan = current?.plan && paid.has(current.plan) ? current.plan : "memory";

    await prisma.$transaction([
      prisma.licenseClaim.update({
        where: { id: claimId },
        data: {
          status: "issued",
          memoryTokenId: memory.id,
          features: JSON.stringify(features),
          issuedAt: new Date(),
          expiresAt,
          errorCode: "",
        },
      }),
      prisma.user.update({ where: { id: userId }, data: { plan: nextPlan } }),
    ]);

    return noStore({
      ok: true,
      product: "memory",
      memoryToken: memory.token,
      memory_url: memoryPublicUrl(),
      tenant,
      expiresAt: expiresAt.toISOString().slice(0, 10),
      request: reqNo,
      hint:
        "记忆密钥只显示这一次。请立即粘贴到插件设置（云端记忆 / Memory Token），或存入密码管理器。",
    });
  } catch (error) {
    await revokeMemoryToken(memory.id, memory.tokenHash).catch(() => undefined);
    await prisma.licenseClaim
      .update({ where: { id: claimId }, data: { status: "failed", errorCode: "issuance_failed" } })
      .catch(() => undefined);
    return noStore(
      {
        error: "issuance_failed",
        request_consumed: true,
        hint: `记忆密钥登记失败，申请单已被标记领取。请联系管理员处理：${
          error instanceof Error ? error.message : "unknown error"
        }`,
      },
      500,
    );
  }
}
