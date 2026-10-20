// Control-plane → data-plane bridge auth (productization §3.1).
// The bridge is a trusted internal channel guarded by a shared secret;
// it fails CLOSED: no secret configured means no bridge access at all.

import { timingSafeEqual } from "node:crypto";

export function checkBridgeAuth(request: Request): boolean {
  const secret = process.env.BRIDGE_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  if (!header) return false;
  const expected = Buffer.from(`Bearer ${secret}`, "utf8");
  const actual = Buffer.from(header, "utf8");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
