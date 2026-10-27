import { NextResponse } from "next/server";
import { AuthError, register } from "@/lib/alpha-auth";
import { corsHeaders } from "@/lib/alpha-trial";

export const dynamic = "force-dynamic";
export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
export async function POST(request: Request) {
  const cors = corsHeaders(request);
  try {
    const body = await request.json().catch(() => ({})) as { email?: string; password?: string };
    const result = await register(String(body.email ?? ""), String(body.password ?? ""));
    return NextResponse.json({ ok: true, ...result }, { headers: { ...cors, "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 500;
    const code = error instanceof AuthError ? error.code : "register_error";
    return NextResponse.json({ ok: false, error: code, message: error instanceof Error ? error.message : String(error) }, { status, headers: { ...cors, "Cache-Control": "no-store" } });
  }
}
