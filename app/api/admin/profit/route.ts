import { NextRequest, NextResponse } from 'next/server';
import { database } from '../operations/store';
import { profitOf, type ProfitRecord } from '../../../admin/profit';

export const runtime = 'nodejs';
let initialization: Promise<unknown> | undefined;
async function db() {
  const sql=database();
  initialization ??= sql.transaction([
    sql`CREATE TABLE IF NOT EXISTS boiler_model_prices (sku TEXT PRIMARY KEY, sale INTEGER NOT NULL CHECK(sale>=0), cost INTEGER CHECK(cost>=0), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
    sql`ALTER TABLE boiler_model_prices ADD COLUMN IF NOT EXISTS cost_source TEXT NOT NULL DEFAULT ''`,
    sql`CREATE TABLE IF NOT EXISTS boiler_profit_records (id TEXT PRIMARY KEY, date DATE NOT NULL, model TEXT NOT NULL, reference TEXT NOT NULL DEFAULT '', quantity INTEGER NOT NULL CHECK(quantity>0), sale INTEGER NOT NULL CHECK(sale>=0), cost INTEGER CHECK(cost>=0), labor INTEGER NOT NULL CHECK(labor BETWEEN 80000 AND 100000), other INTEGER NOT NULL CHECK(other>=0), status TEXT NOT NULL CHECK(status IN ('estimate','actual','void')), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
  ]).catch(error=>{initialization=undefined;throw error;});
  await initialization;return sql;
}
const authorized=(r:NextRequest)=>Boolean(process.env.ADMIN_PASSWORD && r.headers.get('authorization')===`Bearer ${process.env.ADMIN_PASSWORD}`);
export async function GET(request:NextRequest) {
  if(!authorized(request))return NextResponse.json({error:'관리자 로그인이 필요합니다.'},{status:401});
  const month=request.nextUrl.searchParams.get('month')||'';
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return NextResponse.json({error:'조회 월을 확인해 주세요.'},{status:400});
  try {
    const sql=await db();
    const [prices, records, totals]=await Promise.all([
      sql`SELECT * FROM boiler_model_prices`,
      sql`SELECT * FROM boiler_profit_records WHERE date>=${month+'-01'}::date AND date<${month+'-01'}::date+INTERVAL '1 month' ORDER BY date DESC,updated_at DESC LIMIT 200`,
      sql`SELECT COUNT(*) FILTER(WHERE status='actual')::int AS count,COALESCE(SUM(sale::bigint*quantity) FILTER(WHERE status='actual'),0)::text AS revenue,COALESCE(SUM(sale::bigint*quantity-cost::bigint*quantity-labor-other) FILTER(WHERE status='actual' AND cost IS NOT NULL),0)::text AS profit,COUNT(*) FILTER(WHERE status='actual' AND cost IS NULL)::int AS missing,COUNT(*) FILTER(WHERE status='estimate')::int AS estimates FROM boiler_profit_records WHERE date>=${month+'-01'}::date AND date<${month+'-01'}::date+INTERVAL '1 month'`
    ]);
    return NextResponse.json({prices,records,totals:totals[0]},{headers:{'Cache-Control':'private, no-store'}});
  }catch{return NextResponse.json({error:'매출 정보를 불러오지 못했습니다.'},{status:500});}
}
export async function POST(request:NextRequest) {
  if(!authorized(request))return NextResponse.json({error:'관리자 로그인이 필요합니다.'},{status:401});
  try {
    const body=await request.json();const money=(v:unknown)=>typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<=100000000;
    if(!money(body.sale)||(body.cost!==null&&!money(body.cost)))return NextResponse.json({error:'금액은 0 이상의 정수로 입력해 주세요. 원가 미확인은 비워 주세요.'},{status:400});
    if(body.action==='price') {
      if(typeof body.sku!=='string'||!/^[\w.-]{1,80}$/.test(body.sku))return NextResponse.json({error:'모델을 선택해 주세요.'},{status:400});
      const source=typeof body.cost_source==='string'?body.cost_source.slice(0,300):'';
      const sql=await db();await sql`INSERT INTO boiler_model_prices(sku,sale,cost,cost_source) VALUES(${body.sku},${body.sale},${body.cost},${source}) ON CONFLICT(sku) DO UPDATE SET sale=EXCLUDED.sale,cost=EXCLUDED.cost,cost_source=EXCLUDED.cost_source,updated_at=NOW()`;
    }else if(body.action==='record') {
      const validDate=typeof body.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(body.date)&&!Number.isNaN(Date.parse(body.date))&&new Date(body.date).toISOString().slice(0,10)===body.date;
      if(!/^[0-9a-f-]{36}$/i.test(body.id||'')||!validDate||typeof body.model!=='string'||!body.model.trim()||body.model.length>150||typeof body.reference!=='string'||body.reference.length>200||!Number.isInteger(body.quantity)||body.quantity<1||body.quantity>1000||!money(body.labor)||body.labor<80000||body.labor>100000||!money(body.other)||!['estimate','actual','void'].includes(body.status))return NextResponse.json({error:'날짜·모델·수량과 기사비(8만~10만 원)를 확인해 주세요.'},{status:400});
      const sql=await db();await sql`INSERT INTO boiler_profit_records(id,date,model,reference,quantity,sale,cost,labor,other,status) VALUES(${body.id},${body.date},${body.model.trim()},${body.reference},${body.quantity},${body.sale},${body.cost},${body.labor},${body.other},${body.status}) ON CONFLICT(id) DO UPDATE SET date=EXCLUDED.date,model=EXCLUDED.model,reference=EXCLUDED.reference,quantity=EXCLUDED.quantity,sale=EXCLUDED.sale,cost=EXCLUDED.cost,labor=EXCLUDED.labor,other=EXCLUDED.other,status=EXCLUDED.status,updated_at=NOW()`;
      return NextResponse.json({ok:true,...profitOf(body as ProfitRecord)});
    }else return NextResponse.json({error:'지원하지 않는 작업입니다.'},{status:400});
    return NextResponse.json({ok:true});
  }catch{return NextResponse.json({error:'저장하지 못했습니다.'},{status:500});}
}
