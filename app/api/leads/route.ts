import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = String(body.phone || "").trim();
    const region = String(body.region || "").trim().slice(0, 30);
    const customerName = String(body.name || "").trim().slice(0, 30);
    if (!region || !customerName || !/^01[016789]-?\d{3,4}-?\d{4}$/.test(phone) || body.consent !== true) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }
    const id = crypto.randomUUID();
    const sql = database();
    await sql`INSERT INTO boiler_leads (
      id, source, region, installation_type, current_brand, replace_reason,
      install_readiness, home_type, area, fuel, drain, controllers, extras,
      preferred_date, preferred_time, customer_name, phone, consent,
      recommendation, photo_names
    ) VALUES (
      ${id}, ${String(body.source || "web").slice(0, 200)}, ${region},
      ${String(body.installationType || "미선택").slice(0, 50)},
      ${String(body.currentBrand || "").slice(0, 50)}, ${String(body.replaceReason || "").slice(0, 100)},
      ${String(body.installReadiness || "").slice(0, 100)}, ${String(body.homeType || "").slice(0, 50)},
      ${Number.isFinite(Number(body.area)) ? Number(body.area) : null}, ${String(body.fuel || "").slice(0, 50)},
      ${String(body.drain || "").slice(0, 50)}, ${String(body.controllers || "").slice(0, 50)},
      ${JSON.stringify(Array.isArray(body.extras) ? body.extras.slice(0, 20) : [])}::jsonb,
      ${body.timing || null}, ${String(body.timingTime || "").slice(0, 50)},
      ${customerName}, ${phone}, true,
      ${JSON.stringify(body.recommendation || {})}::jsonb,
      ${JSON.stringify(Array.isArray(body.photoNames) ? body.photoNames.slice(0, 6).map((name: unknown) => String(name).slice(0, 200)) : [])}::jsonb
    )`;
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    console.error("lead_save_failed", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!password || supplied !== password) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sql = database();
  const leads = await sql`SELECT id, created_at, status, region, installation_type, current_brand,
    replace_reason, install_readiness, home_type, area, fuel, drain, controllers, extras,
    preferred_date, preferred_time, customer_name, phone, recommendation, photo_names
    FROM boiler_leads ORDER BY created_at DESC LIMIT 200`;
  return NextResponse.json({ leads });
}

