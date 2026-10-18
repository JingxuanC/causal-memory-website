import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { basename, isAbsolute } from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";

/**
 * Alpha Desk package download.
 *
 * The release zip stays on the server's data volume (or an object-store URL)
 * instead of being committed to this repository. Set one of:
 *
 *   ALPHA_DESK_ZIP_PATH=/app/data/alpha-desk-0.1.2-dev.zip
 *   ALPHA_DESK_DOWNLOAD_URL=https://cdn.example.com/alpha-desk.zip
 *
 * A missing configuration answers 503 with an explicit hint rather than a
 * broken 404 in the middle of the purchase flow.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const file = process.env.ALPHA_DESK_ZIP_PATH?.trim();
  if (file && isAbsolute(file)) {
    try {
      const info = await stat(file);
      if (info.isFile()) {
        const name = process.env.ALPHA_DESK_ZIP_NAME?.trim() || basename(file);
        const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;
        return new Response(stream, {
          headers: {
            "Content-Type": "application/zip",
            "Content-Length": String(info.size),
            "Content-Disposition": `attachment; filename="${name.replace(/[^0-9A-Za-z._-]/g, "_")}"`,
            "Cache-Control": "public, max-age=300",
          },
        });
      }
    } catch {
      // Fall through to the object-store URL / error below.
    }
  }

  const url = process.env.ALPHA_DESK_DOWNLOAD_URL?.trim();
  if (url) {
    return NextResponse.redirect(url, 302);
  }

  return NextResponse.json(
    {
      error: "download_unavailable",
      hint: "安装包暂时不可下载。请稍后再试，或联系管理员获取 alpha-desk zip。",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
