import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import { join, extname, basename } from "node:path";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif"
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  const { filename } = await context.params;

  // Prevent path traversal: only allow a plain filename with no slashes or dots-segments
  const safe = basename(filename);
  if (!safe || safe !== filename || safe.startsWith(".")) {
    return new NextResponse(null, { status: 400 });
  }

  const filePath = join(process.cwd(), "uploads", safe);

  try {
    const info = await stat(filePath);
    if (!info.isFile()) return new NextResponse(null, { status: 404 });

    const buf = await readFile(filePath);
    const mime = MIME[extname(safe).toLowerCase()] ?? "application/octet-stream";

    return new NextResponse(buf, {
      headers: {
        "Content-Type": mime,
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
