import type { PrismaClient } from "@prisma/client";

/**
 * Tenant namespace: `u_<User.id>` everywhere. Email is display/notification
 * data only and must never become a tenant or a filesystem path again.
 */
export const TENANT_PREFIX = "u_";
const USER_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

export function isSafeUserId(userId: string): boolean {
  return USER_ID_RE.test(userId);
}

export function canonicalTenant(userId: string): string {
  if (!isSafeUserId(userId)) throw new Error("unsafe user id");
  return `${TENANT_PREFIX}${userId}`;
}

export function isCanonicalTenant(tenant: string): boolean {
  return tenant.startsWith(TENANT_PREFIX) && isSafeUserId(tenant.slice(TENANT_PREFIX.length));
}

/**
 * Read-time compatibility: legacy rows may still carry an email (or an older
 * alias). Resolve them to the canonical tenant, falling back to `u_<userId>`
 * only when nothing better is known.
 */
export async function resolveTenant(
  prisma: PrismaClient,
  token: { userId: string; tenant: string },
): Promise<string> {
  if (isCanonicalTenant(token.tenant)) return token.tenant;
  if (token.tenant) {
    const alias = await prisma.tenantAlias.findUnique({ where: { legacyTenant: token.tenant } });
    if (alias) return alias.tenant;
  }
  return canonicalTenant(token.userId);
}
