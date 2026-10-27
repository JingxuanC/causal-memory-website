import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { basename } from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { corsHeaders, requireActiveTrial, requireSupabaseUser, TrialError, trialDownloadPath } from "@/lib/alpha-trial";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function GET(request: Request) {
  const cors = corsHeaders(request);
  try {
    const user = await requireSupabaseUser(request);
    await requireActiveTrial(user);
    const path = trialDownloadPath();
    const info = await stat(path);
    if (!info.isFile()) throw new TrialError("安装包暂不可下载", 503, "download_unavailable");
    const name = process.env.ALPHA_DESK_ZIP_NAME?.trim() || basename(path);
    const stream = Readable.toWeb(createReadStream(path)) as ReadableStream;
    return new Response(stream, {
      headers: {
        ...cors,
        "Content-Type": "application/zip",
        "Content-Length": String(info.size),
        "Content-Disposition": `attachment; filename="${name.replace(/[^0-9A-Za-z._-]/g, "_")}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const status = error instanceof TrialError ? error.status : 500;
    const code = error instanceof TrialError ? error.code : "download_error";
    return NextResponse.json(
      { ok: false, error: code, message: error instanceof Error ? error.message : String(error) },
      { status, headers: { ...cors, "Cache-Control": "no-store" } },
    );
  }
}
