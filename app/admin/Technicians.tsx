"use client";
import { useEffect, useState } from 'react';
import { statusNames } from './shared';
import s from './admin.module.css';

type Technician = { id: string; name: string; phone: string; region: string; active: boolean; pending: number };
type Assignment = { lead_id: string; technician_id: string; customer_name: string; region: string; preferred_date: string; preferred_time: string; status: string };
type Data = { technicians: Technician[]; assignments: Assignment[] };
const empty = { id: '', name: '', phone: '', region: '', active: true };
export default function Technicians({ session, leadId = '' }: { session: string; leadId?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [form, setForm] = useState(empty);
  const [chosen, setChosen] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const endpoint = `/api/admin/technicians?leadId=${encodeURIComponent(leadId)}`;
  useEffect(() => {
    const controller = new AbortController();
    fetch(endpoint, { headers: { authorization: `Bearer ${session}` }, cache: 'no-store', signal: controller.signal }).then(async response => {
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      setData(result); setChosen(result.assignments.find((a: Assignment) => a.lead_id === leadId)?.technician_id || '');
    }).catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [endpoint, session, leadId]);
  async function save(body: object) {
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/admin/technicians', { method: 'POST', headers: { authorization: `Bearer ${session}`, 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      setMessage('저장했습니다.'); if (!leadId) setForm(empty);
      const refreshed = await fetch(endpoint, { headers: { authorization: `Bearer ${session}` }, cache: 'no-store' });
      if (!refreshed.ok) throw new Error('저장은 완료됐지만 목록 갱신에 실패했습니다. 새로고침해 주세요.');
      setData(await refreshed.json());
    } catch (error) { setError(error instanceof Error ? error.message : '연결을 확인해 주세요.'); }
    finally { setBusy(false); }
  }
  return <section className={leadId ? s.detailSection : s.panel}>
    <div className={s.sectionTitle}><h2>{leadId ? '담당 설치 기사' : '설치 기사 관리'}</h2>{!leadId && <span>{data?.technicians.filter(t => t.active).length || 0}명 활동 중</span>}</div>
    {error && <p role="alert" className={s.error}>{error}</p>}{message && <p role="status" className={s.saveMessage}>{message}</p>}
    {!data ? <p className={s.hint}>{error ? '새로고침 후 다시 확인해 주세요.' : '기사 정보를 불러오고 있습니다…'}</p> : leadId ? <form onSubmit={event => { event.preventDefault(); void save({ action: 'assign', leadId, technicianId: chosen }); }}>
      <label className={s.field}>배정 기사<select value={chosen} disabled={busy} onChange={event => setChosen(event.target.value)}><option value="">미배정</option>{data.technicians.filter(t => t.active || t.id === chosen).map(t => <option key={t.id} value={t.id} disabled={!t.active}>{t.name} · {t.region || '지역 미등록'}{!t.active ? ' (활동 중지)' : ''}</option>)}</select></label>
      {data.technicians.find(t => t.id === chosen) && <p className={s.hint}>연락처: {data.technicians.find(t => t.id === chosen)?.phone}</p>}
      <p className={s.hint}>기사 관리에서 등록한 기사를 선택하세요. 배정은 관리자 기록에 저장되며 기사에게 자동 발송되지는 않습니다.</p><button className={s.primary} disabled={busy}>{busy ? '저장 중…' : '기사 배정 저장'}</button>
    </form> : <>
      <form className={s.technicianForm} onSubmit={event => { event.preventDefault(); void save({ action: 'save', ...form }); }}>
        <h3>{form.id ? '기사 정보 수정' : '기사 등록'}</h3><div className={s.dateInputs}>
          <label className={s.field}>기사 이름<input required maxLength={40} value={form.name} disabled={busy} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
          <label className={s.field}>기사 연락처<input required type="tel" maxLength={15} placeholder="010-0000-0000" value={form.phone} disabled={busy} onChange={event => setForm({ ...form, phone: event.target.value })} /></label>
          <label className={s.field}>담당 지역<input maxLength={100} placeholder="예: 서울 송파·강동" value={form.region} disabled={busy} onChange={event => setForm({ ...form, region: event.target.value })} /></label>
          <label className={s.field}>활동 상태<select value={String(form.active)} disabled={busy} onChange={event => setForm({ ...form, active: event.target.value === 'true' })}><option value="true">활동 중</option><option value="false">활동 중지</option></select></label>
        </div><button className={s.primary} disabled={busy}>{busy ? '저장 중…' : form.id ? '기사 정보 저장' : '기사 등록'}</button>{form.id && <button type="button" className={s.ghost} disabled={busy} onClick={() => setForm(empty)}>수정 취소</button>}
      </form>
      <p className={s.hint}>상담 접수 → 상세 → 담당 설치 기사에서 배정합니다. 활동 중지 후에도 기존 배정 기록은 보존됩니다.</p>
      <div className={s.tableScroll}><table className={`${s.table} ${s.mobileCards}`}><thead><tr><th>기사</th><th>연락처</th><th>담당 지역</th><th>진행 중 상담</th><th>활동 상태</th><th>관리</th></tr></thead><tbody>{data.technicians.map(t => <tr key={t.id}><td data-label="기사">{t.name}</td><td data-label="연락처"><a href={`tel:${t.phone}`}>{t.phone}</a></td><td data-label="담당 지역">{t.region || '미등록'}</td><td data-label="진행 중 상담">{t.pending}건</td><td data-label="활동 상태">{t.active ? '활동 중' : '활동 중지'}</td><td data-label="관리"><button className={s.ghost} disabled={busy} onClick={() => { setForm(t); setMessage(''); }}>수정</button></td></tr>)}</tbody></table></div>
      {!data.technicians.length && <div className={s.smallEmpty}>등록된 기사가 없습니다. 실제 설치 기사 정보를 등록해 주세요.</div>}
      <div className={s.sectionTitle}><h2>최근 기사 배정</h2><span>최근 배정·변경 200건</span></div><div className={s.tableScroll}><table className={`${s.table} ${s.mobileCards}`}><thead><tr><th>담당 기사</th><th>고객·지역</th><th>방문 일정</th><th>상태</th></tr></thead><tbody>{data.assignments.map(a => <tr key={a.lead_id}><td data-label="담당 기사">{data.technicians.find(t => t.id === a.technician_id)?.name || '확인 필요'}</td><td data-label="고객·지역">{a.customer_name}<small>{a.region}</small></td><td data-label="방문 일정">{a.preferred_date?.slice(0, 10) || '날짜 협의'}<small>{a.preferred_time || '시간 협의'}</small></td><td data-label="상태">{statusNames[a.status] || a.status}</td></tr>)}</tbody></table></div>{!data.assignments.length && <div className={s.smallEmpty}>배정된 상담이 없습니다.</div>}
    </>}
  </section>;
}
