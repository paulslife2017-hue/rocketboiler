import { NextRequest, NextResponse } from 'next/server';
import { database } from '../operations/store';

export const runtime = 'nodejs';
let initialization: Promise<unknown> | undefined;
async function initialize() {
  const sql = database();
  initialization ??= sql.transaction([
    sql`CREATE TABLE IF NOT EXISTS boiler_technicians (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, region TEXT NOT NULL DEFAULT '', active BOOLEAN NOT NULL DEFAULT TRUE, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
    sql`CREATE TABLE IF NOT EXISTS boiler_assignments (lead_id TEXT PRIMARY KEY, technician_id TEXT NOT NULL REFERENCES boiler_technicians(id), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
  ]).catch(error => { initialization = undefined; throw error; });
  await initialization;
  return sql;
}
function authorized(request: NextRequest) { return Boolean(process.env.ADMIN_PASSWORD && request.headers.get('authorization') === `Bearer ${process.env.ADMIN_PASSWORD}`); }
export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: '관리자 로그인이 필요합니다.' }, { status: 401 });
  try {
    const sql = await initialize();
    const leadId = request.nextUrl.searchParams.get('leadId') || '';
    const [technicians, assignments] = await Promise.all([
      sql`SELECT t.*, (SELECT COUNT(*)::int FROM boiler_assignments a JOIN boiler_leads l ON l.id::text = a.lead_id WHERE a.technician_id = t.id AND l.status NOT IN ('completed','cancelled','sample')) AS pending FROM boiler_technicians t ORDER BY active DESC, name`,
      sql`SELECT a.lead_id, a.technician_id, l.customer_name, l.region, l.preferred_date, l.preferred_time, l.status FROM boiler_assignments a JOIN boiler_leads l ON l.id::text = a.lead_id WHERE (${leadId} = '' OR a.lead_id = ${leadId}) ORDER BY a.updated_at DESC LIMIT 200`
    ]);
    return NextResponse.json({ technicians, assignments }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ error: '기사 정보를 불러오지 못했습니다.' }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: '관리자 로그인이 필요합니다.' }, { status: 401 });
  try {
    const body = await request.json();
    const uuid = (value: unknown) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    if (body.action === 'save') {
      if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 40 || typeof body.phone !== 'string' || !/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(body.phone) || typeof body.region !== 'string' || body.region.length > 100 || typeof body.active !== 'boolean' || (body.id && !uuid(body.id))) return NextResponse.json({ error: '이름·연락처·담당 지역을 확인해 주세요.' }, { status: 400 });
      const sql = await initialize();
      if (body.id) {
        const rows = await sql`UPDATE boiler_technicians SET name=${body.name.trim()},phone=${body.phone},region=${body.region.trim()},active=${body.active},updated_at=NOW() WHERE id=${body.id} RETURNING id`;
        if (!rows.length) return NextResponse.json({ error: '기사를 찾을 수 없습니다.' }, { status: 404 });
      } else await sql`INSERT INTO boiler_technicians (id,name,phone,region,active) VALUES (${crypto.randomUUID()},${body.name.trim()},${body.phone},${body.region.trim()},${body.active})`;
    } else if (body.action === 'assign') {
      if (!uuid(body.leadId) || (body.technicianId !== '' && !uuid(body.technicianId))) return NextResponse.json({ error: '배정 정보를 확인해 주세요.' }, { status: 400 });
      const sql = await initialize();
      if (!body.technicianId) await sql`DELETE FROM boiler_assignments WHERE lead_id=${body.leadId}`;
      else {
        const rows = await sql`INSERT INTO boiler_assignments (lead_id,technician_id) SELECT l.id::text,t.id FROM boiler_leads l CROSS JOIN boiler_technicians t WHERE l.id::text=${body.leadId} AND t.id=${body.technicianId} AND t.active ON CONFLICT (lead_id) DO UPDATE SET technician_id=EXCLUDED.technician_id,updated_at=NOW() RETURNING lead_id`;
        if (!rows.length) return NextResponse.json({ error: '상담 또는 활동 중인 기사를 찾을 수 없습니다.' }, { status: 409 });
      }
    } else return NextResponse.json({ error: '지원하지 않는 작업입니다.' }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: '저장하지 못했습니다. 다시 시도해 주세요.' }, { status: 500 }); }
}
