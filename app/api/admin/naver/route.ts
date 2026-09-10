import { NextRequest, NextResponse } from 'next/server';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { amountOf } from '../../../admin/earnings';
import { hash } from 'bcryptjs';
import { database, initialize } from '../operations/store';

export const runtime = 'nodejs';
export const maxDuration = 60;
const origin = 'https://api.commerce.naver.com/external';
type Credentials = { clientId: string; clientSecret: string };
function key() { return createHash('sha256').update(process.env.NAVER_ENCRYPTION_KEY || process.env.DATABASE_URL!).digest(); }
function encrypt(value: Credentials) { const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', key(), iv); const data = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]); return [iv, cipher.getAuthTag(), data].map((part) => part.toString('base64')).join('.'); }
function decrypt(value: string): Credentials { const [iv, tag, data] = value.split('.').map((part) => Buffer.from(part, 'base64')); const cipher = createDecipheriv('aes-256-gcm', key(), iv); cipher.setAuthTag(tag); return JSON.parse(Buffer.concat([cipher.update(data), cipher.final()]).toString()); }
async function token(credentials: Credentials) {
  const timestamp = Date.now();
  const signed = Buffer.from(await hash(`${credentials.clientId}_${timestamp}`, credentials.clientSecret)).toString('base64');
  const body = new URLSearchParams({ client_id: credentials.clientId, timestamp: String(timestamp), client_secret_sign: signed, grant_type: 'client_credentials', type: 'SELF' });
  const response = await fetch(`${origin}/v1/oauth2/token`, { method: 'POST', body, signal: AbortSignal.timeout(15000), cache: 'no-store' });
  if (!response.ok) throw new Error('네이버 인증에 실패했습니다. 애플리케이션 ID·시크릿과 API 권한을 확인해 주세요.');
  const data = await response.json();
  if (!data.access_token) throw new Error('네이버 인증 응답을 확인할 수 없습니다.');
  return data.access_token as string;
}
export async function POST(request: NextRequest) {
  if (!process.env.ADMIN_PASSWORD || request.headers.get('authorization') !== `Bearer ${process.env.ADMIN_PASSWORD}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const body = await request.json(); await initialize(); const sql = database();
    if (body.action === 'connect') {
      if (typeof body.clientId !== 'string' || !body.clientId.trim() || body.clientId.length > 200 || typeof body.clientSecret !== 'string' || body.clientSecret.length > 200) return NextResponse.json({ error: '애플리케이션 ID와 시크릿을 입력해 주세요.' }, { status: 400 });
      const credentials = { clientId: body.clientId.trim(), clientSecret: body.clientSecret.trim() };
      await token(credentials);
      await sql`INSERT INTO boiler_integrations(name,encrypted) VALUES('naver',${encrypt(credentials)}) ON CONFLICT(name) DO UPDATE SET encrypted=EXCLUDED.encrypted,updated_at=NOW()`;
      return NextResponse.json({ ok: true });
    }
    if (body.action !== 'sync' || typeof body.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.date) || Number.isNaN(Date.parse(body.date))) return NextResponse.json({ error: '조회 날짜를 확인해 주세요.' }, { status: 400 });
    const rows = await sql`SELECT encrypted FROM boiler_integrations WHERE name='naver'`;
    if (!rows.length) return NextResponse.json({ error: '스마트스토어 API 연결을 먼저 완료해 주세요.' }, { status: 409 });
    const accessToken = await token(decrypt(String(rows[0].encrypted)));
    const all: Record<string, unknown>[] = [];
    let completed = false;
    const started = Date.now();
    for (let page = 1; page <= 20; page++) {
      if (Date.now() - started > 35000) throw new Error('주문 조회 시간이 초과됐습니다. 저장하지 않았으니 다시 시도해 주세요.');
      const params = new URLSearchParams({ from: `${body.date}T00:00:00.000+09:00`, to: `${body.date}T23:59:59.999+09:00`, rangeType: 'PAYED_DATETIME', page: String(page), pageSize: '100' });
      const response = await fetch(`${origin}/v1/pay-order/seller/product-orders?${params}`, { headers: { authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15000), cache: 'no-store' });
      if (!response.ok) throw new Error('네이버 주문 조회에 실패했습니다. 주문 조회 권한과 허용 IP를 확인해 주세요.');
      const result = await response.json();
      const contents = result.data?.contents;
      if (!Array.isArray(contents)) throw new Error('네이버 주문 응답 형식이 다릅니다. 기존 주문은 유지했습니다.');
      all.push(...contents);
      if (contents.length < 100 || result.data?.pagination?.hasNext === false) { completed = true; break; }
    }
    if (!completed) throw new Error('하루 주문이 조회 한도를 넘었습니다. 데이터 누락 방지를 위해 저장하지 않았습니다.');
    const parsed = all.map((item) => {
      const content = (item.content || item) as Record<string, Record<string, unknown>>;
      const product = content.productOrder || {}; const order = content.order || {};
      const id = String(product.productOrderId || item.productOrderId || ''); const quantity = Number(product.quantity);
      if (!id || !Number.isInteger(quantity) || quantity <= 0 || !product.productName) throw new Error('주문 번호·수량을 확인할 수 없는 항목이 있습니다. 저장하지 않았습니다.');
      return { amount: amountOf(product.remainPaymentAmount ?? product.totalPaymentAmount), remaining: amountOf(product.remainQuantity), paid: String(order.paymentDate || order.orderDate || body.date), id, quantity, product: String(product.productName).slice(0,300), option: String(product.productOption || '').slice(0,300), code: String(product.optionManageCode || product.sellerProductCode || '').slice(0,80), customer: String(order.ordererName || '').slice(0,100), phone: String(order.ordererTel || '').slice(0,40), date: String(order.orderDate || body.date), status: String(product.productOrderStatus || 'UNKNOWN') };
    });
    if (parsed.length) await sql.transaction(parsed.map((item) => sql`INSERT INTO boiler_store_orders(id,ordered_at,customer,phone,product,option_name,seller_code,quantity,status,payment_amount,remaining_quantity,payment_date)
      VALUES(${item.id},${item.date},${item.customer},${item.phone},${item.product},${item.option},${item.code},${item.quantity},${item.status},${item.amount},${item.remaining},${item.paid})
      ON CONFLICT(id) DO UPDATE SET customer=EXCLUDED.customer,phone=EXCLUDED.phone,product=EXCLUDED.product,option_name=EXCLUDED.option_name,seller_code=EXCLUDED.seller_code,status=EXCLUDED.status,payment_amount=EXCLUDED.payment_amount,remaining_quantity=EXCLUDED.remaining_quantity,payment_date=EXCLUDED.payment_date,
        quantity=CASE WHEN boiler_store_orders.dispatched THEN boiler_store_orders.quantity ELSE EXCLUDED.quantity END,updated_at=NOW()`));
    return NextResponse.json({ ok: true, count: parsed.length });
  } catch (error) { return NextResponse.json({ error: error instanceof Error && /네이버|주문|조회|저장하지/.test(error.message) ? error.message : '연결 정보를 확인하고 다시 시도해 주세요.' }, { status: 500 }); }
}
