import { NextResponse } from "next/server";
import { corsHeaders, getTrial, requireSupabaseUser, startTrial, TrialError, trialStatus } from "@/lib/alpha-trial";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}


export async function GET(request: Request) {
  const cors = corsHeaders(request);
  try {
    const user = await requireSupabaseUser(request);
    const record = await getTrial(user);
    return NextResponse.json(
      { ok: true, trial: record ? { ...record, ...trialStatus(record) } : null },
      { headers: { ...cors, "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const status = error instanceof TrialError ? error.status : 500;
    const code = error instanceof TrialError ? error.code : "trial_error";
    return NextResponse.json(
      { ok: false, error: code, message: error instanceof Error ? error.message : String(error) },
      { status, headers: { ...cors, "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: Request) {
  const cors = corsHeaders(request);
  try {
    const user = await requireSupabaseUser(request);
    const record = await startTrial(user);
    return NextResponse.json(
      { ok: true, ...record, ...trialStatus(record) },
      { headers: { ...cors, "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const status = error instanceof TrialError ? error.status : 500;
    const code = error instanceof TrialError ? error.code : "trial_error";
    return NextResponse.json(
      { ok: false, error: code, message: error instanceof Error ? error.message : String(error) },
      { status, headers: { ...cors, "Cache-Control": "no-store" } },
    );
  }
}
