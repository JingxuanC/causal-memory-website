import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { basename, isAbsolute } from "node:path";
import { Readable } from "node:stream";

export const dynamic = "force-dynamic";

export async function GET() {
  const file = process.env.ALPHA_DESK_BUNDLE_PATH?.trim();
  if (file && isAbsolute(file)) {
    try {
      const info = await stat(file);
      if (info.isFile()) {
        const name = process.env.ALPHA_DESK_BUNDLE_NAME?.trim() || basename(file);
        const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;
        return new Response(stream, {
          headers: {
            "Content-Type": "application/gzip",
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
  return Response.json(
    { error: "bundle_unavailable", hint: "bundle 暂时不可下载，请从 Alpha Desk release 获取。" },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
