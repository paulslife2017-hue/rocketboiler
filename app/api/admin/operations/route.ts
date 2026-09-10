import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { database, initialize } from './store';

export const runtime = 'nodejs';
function authorized(request: NextRequest) { return Boolean(process.env.ADMIN_PASSWORD && request.headers.get('authorization') === `Bearer ${process.env.ADMIN_PASSWORD}`); }
export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    await initialize(); const sql = database();
    const [inventory, orders, integrations, movements] = await Promise.all([
      sql`SELECT i.*, COALESCE(SUM(o.quantity) FILTER (WHERE NOT o.dispatched AND o.status NOT IN ('CANCELED','RETURNED','CANCELED_BY_NOPAYMENT','취소','취소완료','반품완료','PAYMENT_WAITING')),0)::int AS reserved
        FROM boiler_inventory i LEFT JOIN boiler_store_orders o ON o.sku = i.sku GROUP BY i.sku ORDER BY i.brand, i.model`,
      sql`SELECT * FROM boiler_store_orders ORDER BY ordered_at DESC, id DESC LIMIT 1000`,
      sql`SELECT name, updated_at FROM boiler_integrations`,
      sql`SELECT m.*, i.model FROM boiler_stock_movements m JOIN boiler_inventory i ON i.sku=m.sku ORDER BY m.created_at DESC LIMIT 30`
    ]);
    return NextResponse.json({ inventory, orders, movements, naverConnected: integrations.some((row) => row.name === 'naver'), updatedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ error: '주문·재고를 불러오지 못했습니다.' }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const body = await request.json(); await initialize(); const sql = database();
    if (body.action === 'product') {
      if (typeof body.sku !== 'string' || !/^[\w.-]{1,80}$/.test(body.sku) || typeof body.model !== 'string' || !body.model.trim() || body.model.length > 150 || !Number.isInteger(body.quantity) || body.quantity < 0 || body.quantity > 100000) return NextResponse.json({ error: '모델명, 관리 코드와 수량을 확인해 주세요.' }, { status: 400 });
      const rows = await sql`INSERT INTO boiler_inventory(sku,brand,model,on_hand) VALUES(${body.sku},${String(body.brand || '').slice(0,50)},${body.model.trim()},${body.quantity}) ON CONFLICT DO NOTHING RETURNING sku`;
      if (!rows.length) return NextResponse.json({ error: '이미 등록된 관리 코드입니다. 입고·조정 기능을 사용해 주세요.' }, { status: 409 });
    } else if (body.action === 'adjust') {
      if (!Number.isInteger(body.delta) || !body.delta || Math.abs(body.delta) > 100000 || typeof body.reason !== 'string' || !body.reason.trim()) return NextResponse.json({ error: '변경 수량과 사유를 입력해 주세요.' }, { status: 400 });
      const rows = await sql`WITH changed AS (UPDATE boiler_inventory SET on_hand=on_hand+${body.delta},updated_at=NOW() WHERE sku=${body.sku} AND on_hand+${body.delta}>=0 RETURNING sku)
        INSERT INTO boiler_stock_movements(id,sku,delta,reason) SELECT ${randomUUID()},sku,${body.delta},${body.reason.slice(0,300)} FROM changed RETURNING id`;
      if (!rows.length) return NextResponse.json({ error: '재고가 부족하거나 모델을 찾을 수 없습니다.' }, { status: 409 });
    } else if (body.action === 'map') {
      const rows = await sql`UPDATE boiler_store_orders SET sku=${body.sku},updated_at=NOW() WHERE id=${body.id} AND NOT dispatched RETURNING id`;
      if (!rows.length) return NextResponse.json({ error: '출고 반영 전 주문만 모델을 변경할 수 있습니다.' }, { status: 409 });
    } else if (body.action === 'dispatch') {
      const rows = await sql`WITH target AS (SELECT * FROM boiler_store_orders WHERE id=${body.id} AND NOT dispatched AND status NOT IN ('CANCELED','RETURNED','CANCELED_BY_NOPAYMENT','취소','취소완료','반품완료','PAYMENT_WAITING') FOR UPDATE),
        stock AS (UPDATE boiler_inventory i SET on_hand=i.on_hand-t.quantity, updated_at=NOW() FROM target t WHERE i.sku=t.sku AND i.on_hand>=t.quantity RETURNING i.sku,t.quantity,t.id),
        movement AS (INSERT INTO boiler_stock_movements(id,sku,delta,reason) SELECT ${randomUUID()},sku,-quantity,'스마트스토어 주문 출고 '||id FROM stock RETURNING sku)
        UPDATE boiler_store_orders SET dispatched=TRUE,updated_at=NOW() WHERE id IN (SELECT id FROM stock) RETURNING id`;
      if (!rows.length) return NextResponse.json({ error: '이미 출고됐거나 재고·모델 연결을 확인해야 하는 주문입니다.' }, { status: 409 });
    } else if (body.action === 'return') {
      const rows = await sql`WITH target AS (SELECT * FROM boiler_store_orders WHERE id=${body.id} AND dispatched AND status IN ('CANCELED','RETURNED','취소','취소완료','반품완료') FOR UPDATE),
        stock AS (UPDATE boiler_inventory i SET on_hand=i.on_hand+t.quantity, updated_at=NOW() FROM target t WHERE i.sku=t.sku RETURNING i.sku,t.quantity,t.id),
        movement AS (INSERT INTO boiler_stock_movements(id,sku,delta,reason) SELECT ${randomUUID()},sku,quantity,'스마트스토어 반품 회수 '||id FROM stock RETURNING sku)
        UPDATE boiler_store_orders SET dispatched=FALSE,updated_at=NOW() WHERE id IN (SELECT id FROM stock) RETURNING id`;
      if (!rows.length) return NextResponse.json({ error: '출고된 취소·반품 주문의 회수만 반영할 수 있습니다.' }, { status: 409 });
    } else return NextResponse.json({ error: '지원하지 않는 작업입니다.' }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: '저장하지 못했습니다. 입력과 연결을 확인해 주세요.' }, { status: 500 }); }
}
