import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * Small email/password account store for the Alpha Desk trial.
 *
 * This exists because the shared LangAlpha Supabase project currently has
 * signup disabled. Accounts are local to the marketing site, passwords are
 * scrypt-hashed, and the API returns an HMAC-signed bearer token. The same
 * token is accepted by /api/alpha-desk/trial, so no Supabase service role or
 * key is needed.
 */

export type AlphaUser = { id: string; email: string };
type UserRecord = AlphaUser & { salt: string; hash: string; createdAt: string };
type UserLedger = { version: 1; users: Record<string, UserRecord> };

export class AuthError extends Error {
  constructor(message: string, readonly status = 400, readonly code = "auth_error") {
    super(message);
  }
}

const USERS_PATH = process.env.ALPHA_AUTH_USERS?.trim() || join(process.cwd(), "data", "alpha-users.json");
const SECRET = process.env.ALPHA_AUTH_SECRET?.trim() || "alpha-desk-dev-secret-change-me";
const TOKEN_TTL = 7 * 86_400;

let queue: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(() => undefined, () => undefined);
  return run;
}

async function readUsers(): Promise<UserLedger> {
  try {
    const parsed = JSON.parse(await readFile(USERS_PATH, "utf8")) as Partial<UserLedger>;
    return { version: 1, users: parsed.users && typeof parsed.users === "object" ? parsed.users : {} };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { version: 1, users: {} };
    throw new AuthError("账户库不可用", 500, "users_unreadable");
  }
}

async function writeUsers(ledger: UserLedger): Promise<void> {
  const temp = `${USERS_PATH}.${process.pid}.${Date.now()}.tmp`;
  await mkdir(dirname(USERS_PATH), { recursive: true });
  await writeFile(temp, JSON.stringify(ledger, null, 2), { mode: 0o600 });
  await rename(temp, USERS_PATH);
}

const normalize = (email: string) => email.trim().toLowerCase();
const validEmail = (email: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && email.length <= 254;

function hash(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

function sign(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", SECRET).update(body).digest("base64url");
  return `ADT1.${body}.${signature}`;
}

export function issueToken(user: AlphaUser): string {
  const now = Math.floor(Date.now() / 1000);
  return sign({ sub: user.id, email: user.email, iat: now, exp: now + TOKEN_TTL });
}

export function verifyToken(token: string): AlphaUser {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "ADT1") throw new AuthError("登录已失效，请重新登录", 401, "unauthorized");
  const expected = createHmac("sha256", SECRET).update(parts[1]).digest();
  const actual = Buffer.from(parts[2], "base64url");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new AuthError("登录已失效，请重新登录", 401, "unauthorized");
  }
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as { sub?: string; email?: string; exp?: number };
  if (!payload.sub || !payload.email || Number(payload.exp ?? 0) <= Math.floor(Date.now() / 1000)) {
    throw new AuthError("登录已失效，请重新登录", 401, "unauthorized");
  }
  return { id: payload.sub, email: payload.email };
}

export function bearer(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

export async function register(emailInput: string, password: string): Promise<{ user: AlphaUser; token: string }> {
  const email = normalize(emailInput);
  if (!validEmail(email)) throw new AuthError("请输入有效邮箱", 400, "invalid_email");
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    throw new AuthError("密码至少 8 位", 400, "weak_password");
  }
  return serial(async () => {
    const ledger = await readUsers();
    if (Object.values(ledger.users).some((item) => item.email === email)) {
      throw new AuthError("该邮箱已注册，请直接登录", 409, "email_exists");
    }
    const salt = randomBytes(16).toString("hex");
    const user: UserRecord = { id: randomUUID(), email, salt, hash: hash(password, salt), createdAt: new Date().toISOString() };
    ledger.users[user.id] = user;
    await writeUsers(ledger);
    return { user: { id: user.id, email: user.email }, token: issueToken(user) };
  });
}

export async function login(emailInput: string, password: string): Promise<{ user: AlphaUser; token: string }> {
  const email = normalize(emailInput);
  const ledger = await readUsers();
  const user = Object.values(ledger.users).find((item) => item.email === email);
  if (!user) throw new AuthError("邮箱或密码错误", 401, "invalid_credentials");
  const actual = Buffer.from(hash(password, user.salt), "hex");
  const expected = Buffer.from(user.hash, "hex");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new AuthError("邮箱或密码错误", 401, "invalid_credentials");
  }
  return { user: { id: user.id, email: user.email }, token: issueToken(user) };
}
