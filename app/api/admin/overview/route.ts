import { neon } from '@neondatabase/serverless';
import { NextRequest, NextResponse } from 'next/server';
import { channelOf } from '../../../admin/shared';

export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  const password = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const [counts, sources, schedule] = await Promise.all([
      sql`SELECT status, COUNT(*)::int AS count,
        COUNT(*) FILTER (WHERE (created_at AT TIME ZONE 'Asia/Seoul')::date = (NOW() AT TIME ZONE 'Asia/Seoul')::date)::int AS today
        FROM boiler_leads GROUP BY status`,
      sql`SELECT source, status, COUNT(*)::int AS count FROM boiler_leads
        WHERE status <> 'sample' AND created_at >= NOW() - INTERVAL '30 days' GROUP BY source, status`,
      sql`SELECT id, created_at, status, source, region, installation_type, customer_name, phone, preferred_date, preferred_time,
        home_type, area, current_brand, replace_reason, install_readiness, fuel, drain, controllers, extras, recommendation, photo_names, photo_paths, notes
        FROM boiler_leads WHERE status = 'scheduled' ORDER BY preferred_date ASC NULLS LAST, created_at DESC LIMIT 100`
    ]);
    const channels: Record<string, { count: number; completed: number }> = { naver: { count: 0, completed: 0 }, google: { count: 0, completed: 0 }, unknown: { count: 0, completed: 0 } };
    for (const row of sources) { const channel = channels[channelOf(String(row.source || ''))]; channel.count += Number(row.count); if (row.status === 'completed') channel.completed += Number(row.count); }
    return NextResponse.json({ counts, channels, schedule, updatedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ error: 'load_failed' }, { status: 500 }); }
}
