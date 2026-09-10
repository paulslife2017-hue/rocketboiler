"use client";
import { useEffect, useRef, useState } from 'react';
import { boilerCatalog } from '../boiler-catalog';
import s from './admin.module.css';

type Product = { sku: string; brand: string; model: string; on_hand: number; reserved: number };
type Row = { sku: string; brand: string; model: string; type?: string; check?: boolean; stock?: Product };
const normalize = (value: string) => value.replace(/[\s-]/g, '').toUpperCase();
export default function InventoryManager({ products, loaded, busy, perform }: { products: Product[]; loaded: boolean; busy: boolean; perform: (body: object) => Promise<boolean> }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Row | null>(null);
  const [mode, setMode] = useState('register');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [model, setModel] = useState('');
  const [brand, setBrand] = useState('');
  const [failure, setFailure] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const used = new Set<string>();
  const rows: Row[] = boilerCatalog.map(item => {
    const stock = products.find(product => product.sku === item.sku || (product.brand === item.brand && normalize(product.model) === normalize(item.model)));
    if (stock) used.add(stock.sku);
    return { ...item, ...(stock ? { sku: stock.sku, model: stock.model, brand: stock.brand } : {}), stock };
  });
  rows.push(...products.filter(product => !used.has(product.sku)).map(stock => ({ ...stock, stock })));
  const shown = rows.filter(row => `${row.brand} ${row.model} ${row.sku} ${row.type || ''}`.toLowerCase().includes(search.toLowerCase()) && (filter === 'all' || (filter === 'registered' && row.stock) || (filter === 'unregistered' && !row.stock) || (filter === 'low' && row.stock && row.stock.on_hand - row.stock.reserved <= 0)));
  useEffect(() => { if (selected) dialog.current?.showModal(); }, [selected]);
  function open(row: Row, action: string) { setSelected(row); setMode(action); setAmount(action === 'stocktake' ? String(row.stock?.on_hand || 0) : ''); setReason(''); setModel(row.model); setBrand(row.brand); setFailure(''); }
  function close() { if (busy) return; dialog.current?.close(); setSelected(null); }
  const title = mode === 'register' ? '초기 수량 등록' : mode === 'incoming' ? '입고' : mode === 'outgoing' ? '출고' : '실사 수량 수정';
  return <section className={`${s.panel} ${s.inventoryPanel}`}>
    <div className={s.sectionTitle}><div><span className={s.inventoryEyebrow}>PRODUCT INVENTORY</span><h2>모델별 재고 <span>{rows.length}종</span></h2></div><button className={s.ghost} disabled={!loaded || busy} onClick={() => open({ sku: `CUSTOM-${crypto.randomUUID()}`, brand: '경동나비엔', model: '' }, 'register')}>+ 목록에 없는 모델</button></div>
    <p className={s.hint}>보유한 모델의 수량을 등록하고, 입고부터 출고까지 한곳에서 관리하세요.</p>
    <div className={s.inventoryToolbar}><label className={s.inventorySearch}><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></svg><input aria-label="재고 모델 검색" placeholder="모델명, 용량 또는 브랜드 검색" value={search} onChange={event => setSearch(event.target.value)} /></label><span className={s.resultCount}>검색 결과 <b>{shown.length}</b>종</span></div>
    <div className={s.inventoryFilters} role="group" aria-label="재고 표시 조건">{[{id:'all',label:'전체 모델',count:rows.length},{id:'registered',label:'등록 완료',count:rows.filter(row=>row.stock).length},{id:'unregistered',label:'수량 미등록',count:rows.filter(row=>!row.stock).length},{id:'low',label:'재고 확인 필요',count:rows.filter(row=>row.stock && row.stock.on_hand-row.stock.reserved<=0).length}].map(item=><button key={item.id} aria-pressed={filter===item.id} onClick={()=>setFilter(item.id)}>{item.label}<span>{item.count}</span></button>)}</div>
    {!loaded ? <p className={s.hint}>재고를 불러오는 중입니다…</p> : <div className={s.tableScroll}><table className={`${s.table} ${s.inventoryTable}`}><thead><tr><th>브랜드·모델</th><th>보유</th><th>주문 예약</th><th>판매 가능</th><th>수량 관리</th></tr></thead><tbody>{shown.map(row => <tr key={row.sku}><td className={s.modelCell}><b>{row.model}</b><small>{row.brand} · {row.type || '직접 등록'}</small>{row.check && !row.stock && <small>홈페이지 표기 · 제품 라벨 확인 필요</small>}</td><td data-label="보유" className={s.stockNumber}>{row.stock ? <>{row.stock.on_hand}<small>대</small></> : <span className={s.unregistered}>미등록</span>}</td><td data-label="주문 예약" className={s.stockNumber}>{row.stock ? <>{row.stock.reserved}<small>대</small></> : <span className={s.stockDash}>—</span>}</td><td data-label="판매 가능">{row.stock ? <span className={s.badge} data-status={row.stock.on_hand - row.stock.reserved <= 0 ? 'cancelled' : 'completed'}>{row.stock.on_hand - row.stock.reserved}대</span> : '—'}</td><td><div className={s.stockActions}>{row.stock ? <><button className={s.ghost} disabled={busy} onClick={() => open(row, 'incoming')}>+ 입고</button><button className={s.ghost} disabled={busy} onClick={() => open(row, 'outgoing')}>− 출고</button><button className={s.ghost} disabled={busy} onClick={() => open(row, 'stocktake')}>실사 수정</button></> : <button className={s.registerStock} disabled={busy} onClick={() => open(row, 'register')}>+ 수량 등록</button>}</div></td></tr>)}</tbody></table>{!shown.length && <div className={s.smallEmpty}>검색 조건에 맞는 모델이 없습니다.</div>}</div>}
    <p className={s.hint}>미등록 모델은 재고가 확인되지 않은 상태입니다. 판매 가능 수량은 보유 수량에서 주문 예약을 뺀 값이며, 스마트스토어 출고는 주문 화면에서 반영하세요.</p>
    <dialog ref={dialog} className={s.dialog} onCancel={event => { event.preventDefault(); close(); }}>{selected && <><header className={s.detailHead}><div><h2>{title}</h2><p>{selected.model || '새 보일러 모델'}</p></div><button className={s.close} disabled={busy} aria-label="재고 수량 창 닫기" onClick={close}>×</button></header><form className={s.detailBody} onSubmit={async event => {
      event.preventDefault(); setFailure('');
      const value = Number(amount);
      const body = mode === 'register' ? { action: 'product', sku: selected.sku, brand, model, quantity: value } : mode === 'stocktake' ? { action: 'stocktake', sku: selected.sku, quantity: value, expected: selected.stock?.on_hand, reason } : { action: 'adjust', sku: selected.sku, delta: mode === 'outgoing' ? -value : value, reason: `${mode === 'incoming' ? '입고' : '출고'} · ${reason}` };
      if (await perform(body)) { dialog.current?.close(); setSelected(null); } else setFailure('반영하지 못했습니다. 현재 재고와 입력값을 확인해 주세요. 실사 중 재고가 바뀐 경우 창을 닫고 다시 열어 주세요.');
    }}>
      {mode === 'register' && <><label className={s.field}>브랜드<select value={brand} disabled={busy} onChange={event => setBrand(event.target.value)}><option>경동나비엔</option><option>귀뚜라미</option><option>린나이</option><option>기타</option></select></label><label className={s.field}>모델명·용량<input required maxLength={150} value={model} disabled={busy} onChange={event => setModel(event.target.value)} /></label>{selected.check && <p className={s.hint}>홈페이지 표기의 용량을 확인해야 하는 모델입니다. 실제 제품 라벨과 다르면 모델명을 수정한 뒤 등록하세요.</p>}</>}
      {selected.stock && <p>현재 보유 {selected.stock.on_hand}대 · 주문 예약 {selected.stock.reserved}대</p>}
      <label className={s.field}>{mode === 'register' || mode === 'stocktake' ? '실제 보유 수량' : `${title} 수량`}<input required type="number" min={mode === 'register' || mode === 'stocktake' ? 0 : 1} max="100000" step="1" value={amount} disabled={busy} onChange={event => setAmount(event.target.value)} /></label>
      {mode !== 'register' && <label className={s.field}>변경 사유<input required maxLength={250} value={reason} disabled={busy} placeholder={mode === 'outgoing' ? '예: 홈페이지 상담 설치 출고' : '예: 매입 입고 / 창고 실사'} onChange={event => setReason(event.target.value)} /></label>}
      {failure && <p role="alert" className={s.error}>{failure}</p>}<button className={s.primary} disabled={busy}>{busy ? '저장 중…' : `${title} 저장`}</button>
    </form></>}</dialog>
  </section>;
}
