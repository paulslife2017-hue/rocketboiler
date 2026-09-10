import { NextRequest,NextResponse } from 'next/server';
import { earningsDb } from '../store';
import { profitCatalog } from '../../../../admin/profit';
const authorized=(r:NextRequest)=>Boolean(process.env.ADMIN_PASSWORD&&r.headers.get('authorization')===`Bearer ${process.env.ADMIN_PASSWORD}`);
export async function GET(request:NextRequest){
  if(!authorized(request))return NextResponse.json({error:'unauthorized'},{status:401});
  try{const sql=await earningsDb();const rows=await sql`SELECT sale_sku,sale_amount,store_order_id FROM boiler_leads WHERE id::text=${request.nextUrl.searchParams.get('id')||''}`;return NextResponse.json(rows[0]||{error:'상담을 찾을 수 없습니다.'},{status:rows.length?200:404,headers:{'Cache-Control':'private, no-store'}});}catch{return NextResponse.json({error:'판매 정보를 불러오지 못했습니다.'},{status:500});}
}
export async function POST(request:NextRequest){
  if(!authorized(request))return NextResponse.json({error:'unauthorized'},{status:401});
  try{const b=await request.json();if(typeof b.id!=='string'||(b.sale_sku!==null&&!profitCatalog.some(p=>p.sku===b.sale_sku))||(b.sale_amount!==null&&(!Number.isInteger(b.sale_amount)||b.sale_amount<0||b.sale_amount>100000000))||(b.store_order_id!==null&&(typeof b.store_order_id!=='string'||b.store_order_id.length>80)))return NextResponse.json({error:'판매 모델·금액·주문번호를 확인해 주세요.'},{status:400});
    const sql=await earningsDb();if(b.store_order_id){const orders=await sql`SELECT id FROM boiler_store_orders WHERE id=${b.store_order_id}`;if(!orders.length)return NextResponse.json({error:'먼저 네이버 주문을 불러온 뒤 연결해 주세요.'},{status:400});}
    const rows=await sql`UPDATE boiler_leads SET sale_sku=${b.sale_sku},sale_amount=${b.sale_amount},store_order_id=${b.store_order_id} WHERE id::text=${b.id} RETURNING id`;
    return NextResponse.json(rows.length?{ok:true}:{error:'상담을 찾을 수 없습니다.'},{status:rows.length?200:404});
  }catch{return NextResponse.json({error:'판매 정보를 저장하지 못했습니다.'},{status:500});}
}
