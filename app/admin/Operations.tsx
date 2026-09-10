"use client";

import { useEffect, useState } from 'react';
import { koreaDate } from './shared';
import s from './admin.module.css';

type Product = { sku: string; brand: string; model: string; on_hand: number; reserved: number };
type Order = { id: string; ordered_at: string; customer: string; phone: string; product: string; option_name: string; seller_code: string; sku: string | null; quantity: number; status: string; dispatched: boolean };
type Data = { inventory: Product[]; orders: Order[]; naverConnected: boolean; movements: { id: string; model: string; delta: number; reason: string; created_at: string }[] };
const names: Record<string,string> = { PAYED: '결제 완료', PAYMENT_WAITING: '결제 대기', DELIVERING: '배송 중', DELIVERED: '배송 완료', PURCHASE_DECIDED: '구매 확정', CANCELED: '취소 완료', RETURNED: '반품 완료', EXCHANGED: '교환 완료', CANCELED_BY_NOPAYMENT: '미입금 취소' };
const cancelled = ['CANCELED','RETURNED','CANCELED_BY_NOPAYMENT','취소','취소완료','반품완료'];

export default function Operations({ session, view }: { session: string; view: 'orders' | 'inventory' }) {
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [date, setDate] = useState(koreaDate());
  const [search, setSearch] = useState('');
  const [setup, setSetup] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('경동나비엔');
  const [model, setModel] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [adjustSku, setAdjustSku] = useState('');
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');

  async function reload() { const response = await fetch('/api/admin/operations', { headers: { authorization: `Bearer ${session}` }, cache: 'no-store' }); const result = await response.json(); if (!response.ok) throw new Error(result.error || '조회하지 못했습니다.'); setData(result); }
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/operations', { headers: { authorization: `Bearer ${session}` }, cache: 'no-store', signal: controller.signal }).then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.error || '조회하지 못했습니다.'); setData(result); }).catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [session]);
  async function perform(body: object, endpoint = '/api/admin/operations') {
    setBusy(true); setError(''); setMessage('');
    try { const response = await fetch(endpoint, { method: 'POST', headers: { authorization: `Bearer ${session}`, 'content-type': 'application/json' }, body: JSON.stringify(body) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || '저장하지 못했습니다.'); await reload(); setMessage(result.count !== undefined ? `${result.count}개 상품 주문을 불러왔습니다. 같은 주문은 중복 추가하지 않습니다.` : '반영했습니다.'); return true; }
    catch(error) { setError(error instanceof Error ? error.message : '연결 오류'); return false; }
    finally { setBusy(false); }
  }
  const orders = data?.orders.filter(order => `${order.id} ${order.customer} ${order.product} ${order.option_name}`.toLowerCase().includes(search.toLowerCase())) || [];
  const products = data?.inventory || [];
  const waiting = data?.orders.filter(order => !order.dispatched && !cancelled.includes(order.status) && order.status !== 'PAYMENT_WAITING') || [];
  return <>
    {error && <div role="alert" className={s.error}>{error}</div>}{message && <p role="status" className={s.saveMessage}>{message}</p>}{busy && <p role="status" className={s.loading}>처리 중입니다…</p>}
    <div className={s.metrics}><article><span>{view === 'orders' ? '불러온 상품 주문' : '등록 모델'}</span><strong>{data ? (view === 'orders' ? data.orders.length : products.length) : '—'}</strong><em>{view === 'orders' ? '상품주문번호 기준 · 최대 1,000건 표시' : '브랜드·모델별 관리'}</em></article><article data-accent="gold"><span>출고 반영 대기</span><strong>{data ? waiting.length : '—'}<small>건</small></strong><em>결제 완료 주문 · 재고 확인 필요</em></article><article><span>모델 연결 필요</span><strong>{data ? waiting.filter(order => !order.sku).length : '—'}<small>건</small></strong><em>모델을 연결해야 재고 예약에 반영</em></article><article data-accent="green"><span>보유 재고</span><strong>{data ? products.reduce((sum, item) => sum + item.on_hand, 0) : '—'}<small>대</small></strong><em>등록·입고·출고 반영 기준</em></article></div>
    {view === 'orders' ? <>
      <section className={s.panel}><div className={s.sectionTitle}><h2>네이버 스마트스토어 <span>{data?.naverConnected ? '연결됨' : '연결 필요'}</span></h2><button onClick={() => setSetup(!setup)}>{setup ? '접기' : 'API 연결 설정'}</button></div>
      {setup && <form className={s.setupForm} onSubmit={async event => { event.preventDefault(); if (await perform({ action: 'connect', clientId, clientSecret }, '/api/admin/naver')) { setClientSecret(''); setClientId(''); setSetup(false); } }}><p>스마트스토어 커머스API의 ‘내 스토어용’ 애플리케이션을 연결합니다. 주문 조회 권한이 필요합니다.</p><label className={s.field}>애플리케이션 ID<input required autoComplete="off" value={clientId} onChange={event => setClientId(event.target.value)} /></label><label className={s.field}>애플리케이션 시크릿<input required type="password" autoComplete="new-password" value={clientSecret} onChange={event => setClientSecret(event.target.value)} /></label><button className={s.primary} disabled={busy}>연결 확인·저장</button><a href="https://apicenter.commerce.naver.com/" target="_blank" rel="noreferrer">네이버 커머스API 센터 ↗</a><p>연결 정보는 암호화해 저장하며 화면에 다시 표시하지 않습니다.</p></form>}
      <form className={s.syncForm} onSubmit={event => { event.preventDefault(); void perform({ action: 'sync', date }, '/api/admin/naver'); }}><label className={s.dateFilter}>결제일<input type="date" required value={date} max={koreaDate()} onChange={event => setDate(event.target.value)} /></label><button className={s.primary} disabled={busy || !data?.naverConnected}>주문 불러오기</button></form><p className={s.hint}>선택한 날짜에 결제된 주문 내역을 불러옵니다. 취소·반품 상태를 갱신하려면 해당 결제일을 다시 조회해 주세요. 네이버 발송·취소 처리는 변경하지 않습니다.</p></section>
      <section className={s.panel}><div className={s.sectionTitle}><h2>스마트스토어 주문</h2><input className={s.orderSearch} aria-label="주문 검색" placeholder="주문번호 · 고객 · 상품 검색" value={search} onChange={event => setSearch(event.target.value)} /></div><div className={s.tableScroll}><table className={s.table}><thead><tr><th>상품주문번호·고객</th><th>상품·옵션</th><th>수량</th><th>네이버 상태</th><th>재고 모델 연결</th><th>재고 반영</th></tr></thead><tbody>{orders.map(order => <tr key={order.id}><td><b>{order.customer || '고객명 없음'}</b><small>{order.id}</small><small>{order.phone}</small></td><td><span className={s.productName}>{order.product}</span><small className={s.productName}>{order.option_name}</small><small>{order.ordered_at.slice(0,10)}</small></td><td>{order.quantity}</td><td><span className={s.badge}>{names[order.status] || order.status}</span></td><td><select aria-label={`${order.id} 재고 모델`} disabled={busy || order.dispatched} value={order.sku || ''} onChange={event => { if(event.target.value) void perform({ action: 'map', id: order.id, sku: event.target.value }); }}><option value="">모델 선택</option>{products.map(product => <option key={product.sku} value={product.sku}>{product.model} ({product.sku})</option>)}</select></td><td>{order.dispatched ? cancelled.includes(order.status) ? <button className={s.ghost} disabled={busy} onClick={() => perform({ action: 'return', id: order.id })}>회수 재고 반영</button> : <span className={s.badge} data-status="completed">출고 반영됨</span> : !cancelled.includes(order.status) && order.status !== 'PAYMENT_WAITING' ? <button className={s.primary} disabled={busy || !order.sku} onClick={() => perform({ action: 'dispatch', id: order.id })}>출고 반영</button> : <span>예약 제외</span>}</td></tr>)}</tbody></table></div>{!orders.length && <div className={s.empty}><span>N</span><h3>{data?.naverConnected ? '불러온 주문이 없습니다' : '스마트스토어를 연결해 주세요'}</h3><p>API 연결 후 날짜를 선택하면 주문을 이곳에서 함께 볼 수 있습니다.</p></div>}<p className={s.hint}>실제 제품을 내보낸 뒤 ‘출고 반영’을 누르면 보유 재고가 차감됩니다. 취소·반품된 출고 건은 실물 회수 후 ‘회수 재고 반영’을 눌러 주세요.</p></section>
    </> : <>
      <div className={s.adGrid}><section className={s.panel}><div className={s.sectionTitle}><h2>보일러 모델 등록</h2></div><form className={s.setupForm} onSubmit={async event => { event.preventDefault(); if (await perform({ action: 'product', sku, brand, model, quantity: Number(quantity) })) { setSku(''); setModel(''); setQuantity('0'); } }}><div className={s.dateInputs}><label className={s.field}>브랜드<select value={brand} onChange={event => setBrand(event.target.value)}><option>경동나비엔</option><option>귀뚜라미</option><option>린나이</option><option>기타</option></select></label><label className={s.field}>관리 코드<input required pattern="[A-Za-z0-9_.-]{1,80}" placeholder="예: NAV-24" value={sku} onChange={event => setSku(event.target.value)} /></label></div><label className={s.field}>모델명·용량<input required maxLength={150} placeholder="실제 보유한 모델과 용량" value={model} onChange={event => setModel(event.target.value)} /></label><label className={s.field}>현재 보유 수량<input required type="number" min="0" max="100000" step="1" value={quantity} onChange={event => setQuantity(event.target.value)} /></label><button disabled={busy} className={s.primary}>모델 등록</button></form></section><section className={s.panel}><div className={s.sectionTitle}><h2>입고·재고 조정</h2></div><form className={s.setupForm} onSubmit={async event => { event.preventDefault(); if (await perform({ action: 'adjust', sku: adjustSku, delta: Number(delta), reason })) { setDelta(''); setReason(''); } }}><label className={s.field}>보일러 모델<select required value={adjustSku} onChange={event => setAdjustSku(event.target.value)}><option value="">모델 선택</option>{products.map(product => <option key={product.sku} value={product.sku}>{product.brand} {product.model}</option>)}</select></label><label className={s.field}>변경 수량<input required type="number" step="1" min="-100000" max="100000" placeholder="입고 +5 / 차감 -2" value={delta} onChange={event => setDelta(event.target.value)} /></label><label className={s.field}>변경 사유<input required maxLength={300} placeholder="입고, 실사 조정, 홈페이지 상담 출고 등" value={reason} onChange={event => setReason(event.target.value)} /></label><button className={s.primary} disabled={busy}>재고 반영</button></form></section></div>
      <section className={s.panel}><div className={s.sectionTitle}><h2>모델별 재고</h2><span>보유 − 주문 예약 = 판매 가능</span></div><div className={s.tableScroll}><table className={s.table}><thead><tr><th>브랜드·모델</th><th>관리 코드</th><th>보유</th><th>주문 예약</th><th>판매 가능</th></tr></thead><tbody>{products.map(product => <tr key={product.sku}><td><b>{product.model}</b><small>{product.brand}</small></td><td>{product.sku}</td><td>{product.on_hand}대</td><td>{product.reserved}대</td><td><span className={s.badge} data-status={product.on_hand-product.reserved <= 0 ? 'cancelled' : 'completed'}>{product.on_hand-product.reserved}대 {product.on_hand-product.reserved < 0 ? '· 재고 부족' : ''}</span></td></tr>)}</tbody></table></div>{!products.length && <div className={s.empty}><h3>등록된 모델이 없습니다</h3><p>실제 보유한 보일러 모델과 수량부터 등록해 주세요.</p></div>}<p className={s.hint}>주문 예약은 모델을 연결한 스마트스토어 주문 기준입니다. 홈페이지 상담 출고는 입고·재고 조정에서 수량을 반영해 주세요.</p></section>
      <section className={s.panel}><div className={s.sectionTitle}><h2>최근 재고 변경</h2><span>최근 30건</span></div>{data?.movements.map(item => <div className={s.movement} key={item.id}><span><b>{item.model}</b><small>{item.reason}</small></span><strong>{item.delta > 0 ? '+' : ''}{item.delta}대</strong><small>{item.created_at.slice(0,10)}</small></div>)}{!data?.movements.length && <div className={s.smallEmpty}>재고 변경 내역이 없습니다.</div>}</section>
    </>}
  </>;
}
