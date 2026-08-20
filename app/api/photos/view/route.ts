import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!process.env.ADMIN_PASSWORD || supplied !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const pathname = request.nextUrl.searchParams.get("pathname");
  if (!pathname || !pathname.startsWith("leads/")) return NextResponse.json({ error: "invalid_path" }, { status: 400 });
  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode !== 200) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(result.stream, {
    headers: {
      "content-type": result.blob.contentType || "image/jpeg",
      "cache-control": "private, max-age=300",
      "x-content-type-options": "nosniff",
    },
  });
}

