import { createHmac } from "node:crypto";
import { isSafeUserId } from "@/lib/tenants";

/**
 * Identity proof for quota-platform's public apply/pickup endpoints.
 *
 * quota-platform is reachable directly at /quota/api/apply/...; requiring a
 * website session in the Next.js route alone would leave a bypass. Both
 * services therefore share ALPHA_CLAIM_SECRET and quota verifies this HMAC.
 *
 * Message: alpha-desk:v1:<action>:<userId>:<reqNo-or-dash>:<unix-seconds>
 */
export type ClaimAction = "apply" | "pickup";

export class ClaimIdentityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClaimIdentityError";
  }
}

export function claimIdentityConfigured(): boolean {
  return Boolean(process.env.ALPHA_CLAIM_SECRET?.trim());
}

export function signClaimIdentity(
  action: ClaimAction,
  userId: string,
  reqNo = "",
): Record<string, string> {
  const secret = process.env.ALPHA_CLAIM_SECRET?.trim();
  if (!secret) throw new ClaimIdentityError("ALPHA_CLAIM_SECRET is not configured");
  if (!isSafeUserId(userId)) throw new ClaimIdentityError("unsafe user id");
  const ts = Math.floor(Date.now() / 1000).toString();
  const request = reqNo ? reqNo.toUpperCase() : "-";
  const message = `alpha-desk:v1:${action}:${userId}:${request}:${ts}`;
  const signature = createHmac("sha256", secret).update(message, "utf8").digest("hex");
  return {
    "X-Alpha-User-Id": userId,
    "X-Alpha-User-Ts": ts,
    "X-Alpha-User-Sig": signature,
  };
}
