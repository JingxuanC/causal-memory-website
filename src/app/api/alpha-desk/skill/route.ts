import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { basename, isAbsolute } from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";

/**
 * Download the alpha-desk-install skill folder as a zip.
 *
 * The skill itself is tiny; the actual Alpha Desk release zip is downloaded by
 * scripts/install.py after the user drops this folder into their skills root.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const file = process.env.ALPHA_DESK_SKILL_PATH?.trim();
  if (file && isAbsolute(file)) {
    try {
      const info = await stat(file);
      if (info.isFile()) {
        const name = process.env.ALPHA_DESK_SKILL_NAME?.trim() || basename(file);
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
      // fall through
    }
  }

  return NextResponse.json(
    {
      error: "skill_unavailable",
      hint: "安装 skill 暂时不可下载。请稍后再试，或从 Alpha Desk release 获取 alpha-desk-install-skill.zip。",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
