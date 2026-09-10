"use client";
import { useEffect, useState } from 'react';
import { koreaDate } from './shared';
import { profitOf, profitCatalog, referencePrices, type ProfitRecord } from './profit';
import s from './admin.module.css';
type Data={prices:{sku:string;sale:number;cost:number|null}[];records:ProfitRecord[];totals:{count:number;revenue:string;profit:string;missing:number;estimates:number}};
const won=(n:number)=>n.toLocaleString('ko-KR')+'원';
const fresh=()=>({id:crypto.randomUUID(),date:koreaDate(),model:'',reference:'',quantity:1,sale:0,cost:null,labor:90000,other:0,status:'estimate'} as ProfitRecord);
export default function ProfitManager({session}:{session:string}) {
  const [month,setMonth]=useState(koreaDate().slice(0,7));const [data,setData]=useState<Data|null>(null);
  const [row,setRow]=useState<ProfitRecord|null>(null);const [sku,setSku]=useState('');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('');
  const endpoint='/api/admin/profit?month='+month;
  const newRow=()=>({...fresh(),date:month===koreaDate().slice(0,7)?koreaDate():month+'-01'});
  useEffect(()=>{
    const controller=new AbortController();
    fetch(endpoint,{headers:{authorization:`Bearer ${session}`},cache:'no-store',signal:controller.signal}).then(async response=>{const result=await response.json();if(!response.ok)throw new Error(result.error);setData(result);}).catch(error=>{if(!controller.signal.aborted)setError(error.message);});
    return()=>controller.abort();
  },[endpoint,session]);
  async function save(action:'price'|'record') {
    if(!row)return;setBusy(true);setError('');setMessage('');
    try {
      const response=await fetch('/api/admin/profit',{method:'POST',headers:{authorization:`Bearer ${session}`,'content-type':'application/json'},body:JSON.stringify({action,...row,sku})});
      const result=await response.json();if(!response.ok)throw new Error(result.error);
      const refreshed=await fetch(endpoint,{headers:{authorization:`Bearer ${session}`},cache:'no-store'});if(!refreshed.ok)throw new Error('저장은 완료됐습니다. 목록을 새로고침해 주세요.');setData(await refreshed.json());setMessage(action==='price'?'모델 기본 단가를 저장했습니다. 기존 수익 기록은 변경되지 않습니다.':'수익 기록을 저장했습니다. 같은 기록을 다시 저장하면 수정됩니다.');
    }catch(error){setError(error instanceof Error?error.message:'저장 오류');}finally{setBusy(false);}
  }
  function choose(value:string){setSku(value);const model=profitCatalog.find(item=>item.sku===value);const prices=data?.prices.find(item=>item.sku===value);setRow({...newRow(),model:model?`${model.brand} ${model.model}`:'',sale:prices?.sale??referencePrices[value]??0,cost:prices?.cost??null});setMessage('');}
  const result=row?profitOf(row):null;
  return <div className={s.profitWorkspace}>
    <section className={s.panel}><div className={s.sectionTitle}><h2>매출·수익 현황</h2><label className={s.dateFilter}>조회 월<input aria-label="매출 조회 월" type="month" value={month} onChange={event=>{if(event.target.value){setMonth(event.target.value);setData(null);}}}/></label></div><p className={s.hint}>직접 등록한 ‘확정 매출’만 집계합니다. 상담·스마트스토어 주문은 자동으로 매출에 포함되지 않습니다.</p></section>
    {error&&<p className={s.error} role="alert">{error}</p>}{message&&<p className={s.saveMessage} role="status">{message}</p>}
    <div className={s.metrics}><article><span>확정 매출</span><strong>{data?Number(data.totals.revenue).toLocaleString():'—'}<small>원</small></strong><em>{data?.totals.count??0}건 · 취소·예상 제외</em></article><article data-accent="gold"><span>직접비 차감 이익</span><strong>{data?Number(data.totals.profit).toLocaleString():'—'}<small>원</small></strong><em>원가를 입력한 확정 건만 합산</em></article><article><span>원가 확인 필요</span><strong>{data?.totals.missing??'—'}<small>건</small></strong><em>해당 건의 이익은 합계에서 제외</em></article><article><span>예상 견적</span><strong>{data?.totals.estimates??'—'}<small>건</small></strong><em>확정 매출로 전환 전</em></article></div>
    <section className={s.panel}><div className={s.sectionTitle}><h2>설치 건별 수익 계산</h2><button className={s.ghost} disabled={busy} onClick={()=>{setRow(newRow());setSku('');setMessage('');}}>+ 새 기록</button></div>
      <div className={s.setupForm}><label className={s.field}>모델 선택<select aria-label="수익 계산 모델" value={sku} disabled={busy||!data} onChange={event=>choose(event.target.value)}><option value="">직접 입력 / 모델 선택</option>{profitCatalog.map(item=><option key={item.sku} value={item.sku}>{item.brand} {item.model}</option>)}</select></label>
      <p className={s.hint}>저장된 단가가 없으면 2026-08-21 사진의 경동·귀뚜라미·린나이 견적표의 금액을 판매 참고가로 표시합니다. 매입 원가표는 아니며 실제 판매 조건과 모델 표기를 확인한 뒤 수정하세요. 원가 미입력 건은 이익을 확정하지 않습니다.</p>
      {row&&<form onSubmit={event=>{event.preventDefault();void save('record');}}><div className={s.dateInputs}>
        <label className={s.field}>정산 날짜<input required type="date" disabled={busy} value={row.date} onChange={event=>setRow({...row,date:event.target.value})}/></label>
        <label className={s.field}>집계 구분<select disabled={busy} value={row.status} onChange={event=>setRow({...row,status:event.target.value as ProfitRecord['status']})}><option value="estimate">예상 견적</option><option value="actual">확정 매출</option><option value="void">취소·집계 제외</option></select></label>
        <label className={s.field}>모델명<input required maxLength={150} disabled={busy} value={row.model} onChange={event=>setRow({...row,model:event.target.value})}/></label>
        <label className={s.field}>상담·주문번호 / 메모<input maxLength={200} disabled={busy} value={row.reference} onChange={event=>setRow({...row,reference:event.target.value})}/></label>
        <label className={s.field}>제품 수량<input required type="number" min="1" max="1000" step="1" disabled={busy} value={row.quantity} onChange={event=>setRow({...row,quantity:Number(event.target.value)})}/></label>
        <label className={s.field}>판매 단가 · 원<input required type="number" min="0" max="100000000" step="1" disabled={busy} value={row.sale} onChange={event=>setRow({...row,sale:Number(event.target.value)})}/></label>
        <label className={s.field}>제품 매입 단가 · 원<input type="number" min="0" max="100000000" step="1" placeholder="원가 미확인" disabled={busy} value={row.cost??''} onChange={event=>setRow({...row,cost:event.target.value===''?null:Number(event.target.value)})}/></label>
        <label className={s.field}>기사 비용 · 이 설치 건 전체<input required type="number" min="80000" max="100000" step="1000" disabled={busy} value={row.labor} onChange={event=>setRow({...row,labor:Number(event.target.value)})}/></label>
      </div><div className={s.stockActions}>{[80000,90000,100000].map(value=><button type="button" className={s.ghost} aria-pressed={row.labor===value} disabled={busy} key={value} onClick={()=>setRow({...row,labor:value})}>기사비 {value/10000}만 원</button>)}</div>
      <label className={s.field}>기타 비용 · 이 설치 건 전체<input required type="number" min="0" max="100000000" step="1" disabled={busy} value={row.other} onChange={event=>setRow({...row,other:Number(event.target.value)})}/><small>자재·운송·플랫폼 수수료·해당 건 광고비 등을 합산해 입력하세요.</small></label>
      <div className={s.notice}><div><b>판매금액 {won(result?.revenue||0)}</b><p>직접비 차감 이익: {result?.profit==null?'원가 입력 후 계산':won(result.profit)}{result?.margin!=null?` · 이익률 ${result.margin.toFixed(1)}%`:''}</p>{row.cost!==null&&<p>기사비 8만 원일 때 {won(profitOf({...row,labor:80000}).profit!)} / 10만 원일 때 {won(profitOf({...row,labor:100000}).profit!)}</p>}</div></div>
      <p className={s.hint}>판매단가 × 수량 − 매입단가 × 수량 − 기사비 − 기타 비용입니다. 입력 금액 기준의 직접비 차감액이며, 별도로 입력하지 않은 세금·고정비는 포함하지 않습니다. 기사비는 제품 수량과 별개로 설치 1건 전체 금액입니다.</p>
      <div className={s.stockActions}><button className={s.primary} disabled={busy}>{busy?'저장 중…':'수익 기록 저장'}</button><button type="button" className={s.ghost} disabled={busy||!sku} onClick={()=>void save('price')}>모델 기본 단가 저장</button></div></form>}
      {!row&&<p className={s.hint}>모델을 선택하거나 ‘새 기록’을 눌러 시작하세요.</p>}</div>
    </section>
    <section className={s.panel}><div className={s.sectionTitle}><h2>월별 수익 기록</h2><span>최근 200건 · 합계는 해당 월 전체</span></div><div className={s.tableScroll}><table className={`${s.table} ${s.mobileCards}`}><thead><tr><th>모델·날짜</th><th>구분</th><th>판매금액</th><th>기사비</th><th>이익</th><th>관리</th></tr></thead><tbody>{data?.records.map(item=><tr key={item.id}><td data-label="모델"><b>{item.model}</b><small>{item.date.slice(0,10)} · {item.quantity}대</small><small>{item.reference}</small></td><td data-label="구분">{item.status==='actual'?'확정 매출':item.status==='estimate'?'예상 견적':'취소'}</td><td data-label="판매금액">{won(profitOf(item).revenue)}</td><td data-label="기사비">{won(item.labor)}</td><td data-label="직접비 차감 이익">{profitOf(item).profit===null?'원가 미입력':won(profitOf(item).profit!)}</td><td data-label="관리"><button className={s.ghost} disabled={busy} onClick={()=>{setRow({...item,date:item.date.slice(0,10)});setSku('');setMessage('기록을 불러왔습니다. 위 계산 화면에서 수정 후 저장하세요.');}}>수정</button></td></tr>)}</tbody></table></div>{!data?.records.length&&<div className={s.smallEmpty}>해당 월에 저장된 수익 기록이 없습니다.</div>}</section>
  </div>;
}
