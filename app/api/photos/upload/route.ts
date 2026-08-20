import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  const size = Number(request.headers.get("content-length") || 0);
  if (!allowed.includes(contentType) || !request.body || size > 4_200_000) {
    return NextResponse.json({ error: "invalid_photo" }, { status: 400 });
  }
  const original = request.nextUrl.searchParams.get("filename") || "boiler-photo.jpg";
  const safeName = original.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const blob = await put(`leads/${crypto.randomUUID()}-${safeName}.jpg`, request.body, {
    access: "private",
    contentType,
    addRandomSuffix: false,
  });
  return NextResponse.json({ pathname: blob.pathname });
}

