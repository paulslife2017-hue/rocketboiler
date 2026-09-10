import { NextRequest, NextResponse } from 'next/server';
import { earningsDb } from './store';
import { amountOf, calculateSale, matchSku, totalsOf, websiteQuote, type Sale, type Price } from '../../../admin/earnings';
import { profitCatalog } from '../../../admin/profit';
import { koreaDate } from '../../../admin/shared';
export const runtime='nodejs';
const authorized=(r:NextRequest)=>Boolean(process.env.ADMIN_PASSWORD&&r.headers.get('authorization')===`Bearer ${process.env.ADMIN_PASSWORD}`);
const cancelled=['CANCELED','RETURNED','CANCELED_BY_NOPAYMENT','취소','취소완료','반품완료'];
export async function GET(request:NextRequest){
  if(!authorized(request))return NextResponse.json({error:'관리자 로그인이 필요합니다.'},{status:401});
  const month=request.nextUrl.searchParams.get('month')||koreaDate().slice(0,7);
  if(!/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(month))return NextResponse.json({error:'조회 월을 확인해 주세요.'},{status:400});
  try{
    const sql=await earningsDb();
    const [prices,settings,leads,orders,connections,latestOrders]=await Promise.all([
      sql`SELECT sku,cost,cost_source FROM boiler_model_prices`,sql`SELECT labor FROM boiler_earnings_settings WHERE id=1`,
      sql`SELECT id,created_at,status,recommendation,sale_sku,sale_amount,store_order_id,completed_at,preferred_date FROM boiler_leads WHERE status!='sample' AND to_char(COALESCE(completed_at,preferred_date::timestamp AT TIME ZONE 'Asia/Seoul',created_at) AT TIME ZONE 'Asia/Seoul','YYYY-MM')=${month}`,
      sql`SELECT * FROM boiler_store_orders WHERE substring(COALESCE(NULLIF(payment_date,''),ordered_at),1,7)=${month}`,
      sql`SELECT name FROM boiler_integrations WHERE name='naver'`,
      sql`SELECT DISTINCT ON (COALESCE(sku,NULLIF(seller_code,''),product||option_name)) sku,seller_code,product,option_name,payment_amount,remaining_quantity,quantity FROM boiler_store_orders WHERE status IN ('PAYED','DELIVERING','DELIVERED','PURCHASE_DECIDED') AND payment_amount IS NOT NULL ORDER BY COALESCE(sku,NULLIF(seller_code,''),product||option_name),ordered_at DESC`
    ]);
    const defaultLabor=Number(settings[0].labor);const priceMap=new Map((prices as Price[]).map(p=>[p.sku,p]));
    const rows:Sale[]=[];
    for(const lead of leads){
      const rec=lead.recommendation||{};
      // Historical finder model labels can conflict with the selected brand; only an explicit sold model is authoritative.
      const sku=lead.sale_sku||null;
      const model=profitCatalog.find(p=>p.sku===sku)?.model||String(rec.model||'판매 모델 확인 필요');
      const status:Sale['status']=lead.store_order_id?'linked':lead.status==='cancelled'?'cancelled':lead.status==='completed'?'sold':'pending';
      const note=lead.store_order_id?'네이버 주문 '+lead.store_order_id+'에서 집계':lead.sale_amount==null?'상담 예상가 '+String(rec.estimatedTotal||rec.price||'미정')+' · 실제 판매가 확인 필요':'상담에 저장된 판매 확정액';
      rows.push(calculateSale({id:'web:'+lead.id,channel:'web',date:koreaDate(lead.completed_at||lead.preferred_date||lead.created_at),model,sku,quantity:1,amount:amountOf(lead.sale_amount),cost:priceMap.get(sku)?.cost??null,labor:defaultLabor,status,note}));
    }
    for(const order of orders){
      const sku=matchSku(String(order.sku||order.seller_code||''),order.product+' '+order.option_name);
      const quantity=order.remaining_quantity??order.quantity;
      const status:Sale['status']=cancelled.includes(order.status)||quantity===0?'cancelled':['PAYED','DELIVERING','DELIVERED','PURCHASE_DECIDED'].includes(order.status)?'sold':'pending';
      rows.push(calculateSale({id:'naver:'+order.id,channel:'naver',date:String(order.payment_date||order.ordered_at).slice(0,10),model:profitCatalog.find(p=>p.sku===sku)?.model||order.product,sku,quantity,amount:order.payment_amount===null?null:amountOf(Number(order.payment_amount)),cost:priceMap.get(sku||'')?.cost??null,labor:defaultLabor,status,note:'네이버 상품주문 '+order.id+' · 할인·부분 취소 반영 결제액'}));
    }
    // One snapshot per source ID. Repeated reads never create a second sale or reset technician edits.
    const sold=rows.filter(r=>r.status==='sold');
    for(let i=0;i<sold.length;i+=100)await sql.transaction(sold.slice(i,i+100).map(r=>sql`INSERT INTO boiler_sale_costs(id,sku,cost,labor) VALUES(${r.id},${r.sku},${r.cost},${defaultLabor}) ON CONFLICT(id) DO UPDATE SET sku=EXCLUDED.sku,cost=CASE WHEN boiler_sale_costs.sku IS DISTINCT FROM EXCLUDED.sku THEN EXCLUDED.cost ELSE COALESCE(boiler_sale_costs.cost,EXCLUDED.cost) END`));
    const snapshots=rows.length?await sql`SELECT * FROM boiler_sale_costs WHERE id=ANY(${rows.map(r=>r.id)}::text[])`:[];
    const snapshotMap=new Map(snapshots.map(s=>[s.id,s]));
    const sales=rows.map(r=>{const snapshot=snapshotMap.get(r.id);return calculateSale({...r,cost:snapshot?snapshot.cost:r.cost,labor:snapshot?snapshot.labor:r.labor});}).sort((a,b)=>b.date.localeCompare(a.date));
    const recent=new Map<string,number>();
    for(const order of latestOrders){const sku=matchSku(String(order.sku||order.seller_code||''),order.product+' '+order.option_name);const qty=order.remaining_quantity??order.quantity;if(sku&&qty>0&&!recent.has(sku))recent.set(sku,Number(order.payment_amount)/qty);}
    const models=profitCatalog.map(p=>{const cost=priceMap.get(p.sku)?.cost??null;const web=websiteQuote(p.sku);return {...p,cost,costSource:priceMap.get(p.sku)?.cost_source||'',web,naver:recent.get(p.sku)??null,webProfit:cost===null||!web?null:{min:web.min-cost-defaultLabor,max:web.max-cost-defaultLabor}};});
    return NextResponse.json({defaultLabor,naverConnected:connections.length>0,sales:sales.slice(0,200),totals:totalsOf(sales),models,updatedAt:new Date().toISOString()},{headers:{'Cache-Control':'private, no-store'}});
  }catch(error){console.error('earnings_load_failed',error instanceof Error?error.message:'unknown');return NextResponse.json({error:'자동 수익 정보를 불러오지 못했습니다.'},{status:500});}
}
export async function POST(request:NextRequest){
  if(!authorized(request))return NextResponse.json({error:'관리자 로그인이 필요합니다.'},{status:401});
  try{const body=await request.json();if(!Number.isInteger(body.labor)||body.labor<80000||body.labor>100000)return NextResponse.json({error:'기사비는 8만~10만 원으로 입력해 주세요.'},{status:400});const sql=await earningsDb();
    if(body.action==='default')await sql`UPDATE boiler_earnings_settings SET labor=${body.labor} WHERE id=1`;
    else if(body.action==='labor'&&typeof body.id==='string'){const rows=await sql`UPDATE boiler_sale_costs SET labor=${body.labor} WHERE id=${body.id} RETURNING id`;if(!rows.length)return NextResponse.json({error:'판매 내역을 새로고침해 주세요.'},{status:404});}
    else return NextResponse.json({error:'지원하지 않는 작업입니다.'},{status:400});return NextResponse.json({ok:true});
  }catch{return NextResponse.json({error:'기사비를 저장하지 못했습니다.'},{status:500});}
}
