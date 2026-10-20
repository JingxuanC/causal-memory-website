import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkBridgeAuth } from "@/lib/bridge";
import { isCanonicalTenant } from "@/lib/tenants";

// tenant.rs tokens-file format (cloud.json): the data plane's auth layer
// reads `{ "sha256:<hex-of-presented-token>": "<tenant>" }` — exactly the
// sha256 hex the website already stores in ApiToken.tokenHash, so this
// endpoint is a straight projection, no protocol change on the engine side.
//
// Default emits the canonical `u_<userId>` namespace. Pass ?canonical=0 to
// reproduce the legacy email tenant (migration/diagnostics only).
export async function GET(request: Request) {
  if (!checkBridgeAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const canonical = url.searchParams.get("canonical") !== "0";
  const now = new Date();
  const tokens = await prisma.apiToken.findMany({
    where: {
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { tokenHash: true, userId: true, tenant: true, user: { select: { email: true } } },
  });
  const aliases = canonical ? new Map<string, string>() : new Map(
    (await prisma.tenantAlias.findMany()).map((a) => [a.legacyTenant, a.tenant]),
  );
  const file: Record<string, string> = {};
  for (const tk of tokens) {
    let tenant = `u_${tk.userId}`;
    if (!canonical) {
      if (tk.tenant && !isCanonicalTenant(tk.tenant)) tenant = aliases.get(tk.tenant) ?? tk.tenant;
      else if (tk.user.email) tenant = aliases.get(tk.user.email) ?? tk.user.email;
    }
    file[`sha256:${tk.tokenHash}`] = tenant;
  }
  return NextResponse.json(file, {
    headers: { "Cache-Control": "no-store" },
  });
}
