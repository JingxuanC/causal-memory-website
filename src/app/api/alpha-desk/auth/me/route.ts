import { NextResponse } from "next/server";
import { AuthError, bearer, verifyToken } from "@/lib/alpha-auth";
import { corsHeaders } from "@/lib/alpha-trial";

export const dynamic = "force-dynamic";
export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
export async function GET(request: Request) {
  const cors = corsHeaders(request);
  try {
    const token = bearer(request);
    if (!token) throw new AuthError("请先登录", 401, "unauthorized");
    return NextResponse.json({ ok: true, user: verifyToken(token) }, { headers: { ...cors, "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 500;
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "auth_error" }, { status, headers: { ...cors, "Cache-Control": "no-store" } });
  }
}
