import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

function authorized(request: NextRequest) {
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(process.env.ADMIN_PASSWORD && supplied === process.env.ADMIN_PASSWORD);
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
      recommendation, photo_names, photo_paths
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
      ${JSON.stringify(Array.isArray(body.photoNames) ? body.photoNames.slice(0, 6).map((name: unknown) => String(name).slice(0, 200)) : [])}::jsonb,
      ${JSON.stringify(Array.isArray(body.photoPaths) ? body.photoPaths.slice(0, 6).map((path: unknown) => String(path).slice(0, 500)) : [])}::jsonb
    )`;
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    console.error("lead_save_failed", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const search = request.nextUrl.searchParams.get("search")?.trim().slice(0, 80) || "";
  const status = request.nextUrl.searchParams.get("status")?.trim().slice(0, 30) || "";
  const region = request.nextUrl.searchParams.get("region")?.trim().slice(0, 30) || "";
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;
  const pattern = `%${search}%`;
  const sql = database();
  const countRows = await sql`SELECT COUNT(*)::int AS count FROM boiler_leads
    WHERE (${search} = '' OR customer_name ILIKE ${pattern} OR phone ILIKE ${pattern} OR region ILIKE ${pattern})
      AND (${status} = '' OR status = ${status})
      AND (${region} = '' OR region ILIKE ${`%${region}%`})`;
  const leads = await sql`SELECT id, created_at, status, source, region, installation_type, current_brand,
    replace_reason, install_readiness, home_type, area, fuel, drain, controllers, extras,
    preferred_date, preferred_time, customer_name, phone, recommendation, photo_names, photo_paths, notes
    FROM boiler_leads
    WHERE (${search} = '' OR customer_name ILIKE ${pattern} OR phone ILIKE ${pattern} OR region ILIKE ${pattern})
      AND (${status} = '' OR status = ${status})
      AND (${region} = '' OR region ILIKE ${`%${region}%`})
    ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
  const total = Number(countRows[0]?.count || 0);
  return NextResponse.json({ leads, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}

export async function PATCH(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await request.json();
  const allowed = ["new", "contacted", "scheduled", "completed", "cancelled", "sample"];
  if (!allowed.includes(body.status) || !/^[0-9a-f-]{36}$/i.test(String(body.id || ""))) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const sql = database();
  await sql`UPDATE boiler_leads SET status = ${body.status} WHERE id = ${body.id}`;
  return NextResponse.json({ ok: true });
}

