// Control-plane → data-plane bridge auth (productization §3.1).
// The bridge is a trusted internal channel guarded by a shared secret;
// it fails CLOSED: no secret configured means no bridge access at all.

export function checkBridgeAuth(request: Request): boolean {
  const secret = process.env.BRIDGE_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}
