import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkBridgeAuth } from "@/lib/bridge";

// tenant.rs tokens-file format (cloud.json): the data plane's auth layer
// reads `{ "sha256:<hex-of-presented-token>": "<tenant>" }` — exactly the
// sha256 hex the website already stores in ApiToken.tokenHash, so this
// endpoint is a straight projection, no protocol change on the engine side.
export async function GET(request: Request) {
  if (!checkBridgeAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const tokens = await prisma.apiToken.findMany({
    where: { revokedAt: null },
    select: { tokenHash: true, userId: true },
  });
  const file: Record<string, string> = {};
  for (const tk of tokens) {
    // Tenant namespace: `u_<userId>` (cuid is filename-safe).
    file[`sha256:${tk.tokenHash}`] = `u_${tk.userId}`;
  }
  return NextResponse.json(file, {
    headers: { "Cache-Control": "no-store" },
  });
}
