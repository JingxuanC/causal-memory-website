import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  assertLicenseVerifies,
  loadPublicKey,
  loadSigningKey,
  signAlphaLicense,
  type AlphaLicensePayload,
} from "./alpha-license";

/**
 * Supabase-authenticated 7-day Alpha Desk trial.
 *
 * The public website signs users in with the same Supabase project as LangAlpha.
 * This module verifies the Supabase access token against /auth/v1/user (no
 * service-role key), then mints one offline trial license per user. Entitlement
 * state lives in a small JSON ledger owned by the website; the product itself
 * only sees the signed ADK1 license and its expiry.
 */

export type SupabaseUser = { id: string; email: string | null };

export type TrialRecord = {
  email: string;
  startedAt: string;
  expiresAt: string;
  licenseKey: string;
};

type Ledger = { version: 1; users: Record<string, TrialRecord> };

export class TrialError extends Error {
  constructor(message: string, readonly status = 400, readonly code = "trial_error") {
    super(message);
  }
}

const LEDGER_PATH = process.env.ALPHA_TRIAL_LEDGER?.trim() || join(process.cwd(), "data", "alpha-trials.json");
const SUPABASE_URL = process.env.SUPABASE_URL?.trim().replace(/\/$/, "");
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY?.trim();

let queue: Promise<unknown> = Promise.resolve();

function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(() => undefined, () => undefined);
  return run;
}

async function readLedger(): Promise<Ledger> {
  try {
    const parsed = JSON.parse(await readFile(LEDGER_PATH, "utf8")) as Partial<Ledger>;
    return { version: 1, users: parsed.users && typeof parsed.users === "object" ? parsed.users : {} };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { version: 1, users: {} };
    throw new TrialError("trial_ledger_unreadable", 500, "trial_ledger");
  }
}

async function writeLedger(ledger: Ledger): Promise<void> {
  const temp = `${LEDGER_PATH}.${process.pid}.${Date.now()}.tmp`;
  await mkdir(dirname(LEDGER_PATH), { recursive: true });
  await writeFile(temp, JSON.stringify(ledger, null, 2), { mode: 0o600 });
  await rename(temp, LEDGER_PATH);
}

export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") ?? "";
  const allowed = (process.env.ALPHA_SITE_ORIGINS ?? "https://deepseek-alpha.com,https://www.deepseek-alpha.com,http://localhost:5173")
    .split(",").map((item) => item.trim()).filter(Boolean);
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0] ?? "https://deepseek-alpha.com",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

export async function requireSupabaseUser(request: Request): Promise<SupabaseUser> {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) throw new TrialError("请先登录", 401, "unauthorized");
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new TrialError("登录服务未配置", 503, "auth_unconfigured");
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: header, apikey: SUPABASE_ANON_KEY },
    cache: "no-store",
  });
  if (!response.ok) throw new TrialError("登录已失效，请重新登录", 401, "unauthorized");
  const user = (await response.json()) as { id?: string; email?: string };
  if (!user.id) throw new TrialError("登录用户无效", 401, "unauthorized");
  return { id: user.id, email: user.email ?? null };
}

export function trialStatus(record: TrialRecord): { daysLeft: number; active: boolean } {
  const daysLeft = Math.max(0, Math.ceil((Date.parse(record.expiresAt) - Date.now()) / 86_400_000));
  return { daysLeft, active: Date.parse(record.expiresAt) > Date.now() };
}

export async function startTrial(user: SupabaseUser): Promise<TrialRecord> {
  return serial(async () => {
    const ledger = await readLedger();
    const existing = ledger.users[user.id];
    if (existing) {
      if (Date.parse(existing.expiresAt) > Date.now()) return existing;
      throw new TrialError("该账号的 7 天试用已结束", 409, "trial_used");
    }

    const now = Math.floor(Date.now() / 1000);
    const days = Math.max(1, Math.min(30, Number(process.env.ALPHA_TRIAL_DAYS ?? 7) || 7));
    const exp = now + days * 86_400;
    const payload: AlphaLicensePayload = {
      v: 1,
      sub: `u_${user.id}`,
      ...(user.email ? { name: user.email } : {}),
      plan: "pro",
      iat: now,
      exp,
      features: ["pro", "trial"],
      request: `TRIAL-${user.id.slice(0, 8)}`,
    };
    const licenseKey = signAlphaLicense(payload, loadSigningKey());
    assertLicenseVerifies(licenseKey, loadPublicKey());
    const record: TrialRecord = {
      email: user.email ?? "",
      startedAt: new Date(now * 1000).toISOString(),
      expiresAt: new Date(exp * 1000).toISOString(),
      licenseKey,
    };
    ledger.users[user.id] = record;
    await writeLedger(ledger);
    return record;
  });
}

export async function getTrial(user: SupabaseUser): Promise<TrialRecord | null> {
  const ledger = await readLedger();
  return ledger.users[user.id] ?? null;
}

export async function requireActiveTrial(user: SupabaseUser): Promise<TrialRecord> {
  const ledger = await readLedger();
  const record = ledger.users[user.id];
  if (!record) throw new TrialError("还没有领取 7 天试用", 403, "trial_missing");
  if (Date.parse(record.expiresAt) <= Date.now()) throw new TrialError("7 天试用已结束", 403, "trial_expired");
  return record;
}

export function trialDownloadPath(): string {
  const path = process.env.ALPHA_DESK_ZIP_PATH?.trim();
  if (!path) throw new TrialError("安装包暂不可下载", 503, "download_unavailable");
  return path;
}
