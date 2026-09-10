"use client";

import { useEffect, useRef, useState } from 'react';
import { channelNames, channelOf, statusNames, type Lead } from './shared';
import Link from "next/link";
import s from './admin.module.css';
import Operations from './Operations';
import Technicians from './Technicians';
import LeadSale from './LeadSale';
import ProfitManager from './ProfitManager';

type Overview = { counts: { status: string; count: number; today: number }[]; channels: Record<string, { count: number; completed: number }>; schedule: Lead[]; updatedAt: string };
type Tab = 'overview' | 'leads' | 'schedule' | 'ads' | 'orders' | 'inventory' | 'technicians' | 'profit';
const tabs: { id: Tab; name: string; icon: string }[] = [{ id: 'overview', name: '전체 현황', icon: '◫' }, { id: 'leads', name: '상담 접수', icon: '☷' }, { id: 'schedule', name: '설치 일정', icon: '▦' }, { id: 'technicians', name: '기사 관리', icon: '♙' }, { id: 'orders', name: '스마트스토어 주문', icon: 'N' }, { id: 'inventory', name: '보일러 재고', icon: '▤' }, { id: 'profit', name: '매출·수익', icon: '₩' }, { id: 'ads', name: '광고 현황', icon: '↗' }];
const number = (n: number) => n.toLocaleString('ko-KR');
const dateLabel = (value?: string) => value ? new Date(value).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric' }) : '일정 협의';
function Badge({ status }: { status: string }) { return <span className={s.badge} data-status={status}>{statusNames[status] || status}</span>; }

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [session, setSession] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<Lead | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const requestId = useRef(0);
  const photosId = useRef(0);

  async function load(targetPage = 1, key = session, nextStatus = status) {
    const id = ++requestId.current;
    setBusy(true); setMessage('');
    try {
      const headers = { authorization: `Bearer ${key}` };
      const params = new URLSearchParams({ page: String(targetPage), search, region, status: nextStatus });
      const [listResponse, summaryResponse] = await Promise.all([fetch(`/api/leads?${params}`, { headers, cache: 'no-store' }), fetch('/api/admin/overview', { headers, cache: 'no-store' })]);
      if (listResponse.status === 401 || summaryResponse.status === 401) throw new Error('관리자 비밀번호를 확인해 주세요.');
      if (!listResponse.ok || !summaryResponse.ok) throw new Error('데이터를 불러오지 못했습니다. 잠시 후 다시 조회해 주세요.');
      const [list, summary] = await Promise.all([listResponse.json(), summaryResponse.json()]);
      if (id !== requestId.current) return;
      setSession(key); setPassword(''); setLeads(list.leads); setTotal(list.total); setPages(list.pages); setPage(list.page); setOverview(summary);
    } catch (error) { if (id === requestId.current) setMessage(error instanceof Error ? error.message : '연결을 확인해 주세요.'); }
    finally { if (id === requestId.current) setBusy(false); }
  }
  function logout() { ++requestId.current; ++photosId.current; setSession(''); setPassword(''); setLeads([]); setOverview(null); setSelected(null); setPhotoUrls([]); setMessage(''); setBusy(false); }
  function filterStatus(value: string) { setStatus(value); setTab('leads'); void load(1, session, value); }
  function closeDetail() { if (saving) return; ++photosId.current; dialog.current?.close(); setSelected(null); setPhotoUrls([]); }
  useEffect(() => { if (selected && !dialog.current?.open) dialog.current?.showModal(); }, [selected]);
  useEffect(() => () => photoUrls.forEach((url) => URL.revokeObjectURL(url)), [photoUrls]);

  async function openLead(lead: Lead) {
    const id = ++photosId.current;
    setSelected(lead); setNotes(lead.notes || ''); setScheduleDate(lead.preferred_date?.slice(0, 10) || ''); setScheduleTime(lead.preferred_time || '');
    setPhotoUrls([]); setPhotoError(''); setSaveMessage(''); setPhotosLoading(true);
    const urls: string[] = [];
    try {
      for (const path of lead.photo_paths || []) {
        const response = await fetch(`/api/photos/view?pathname=${encodeURIComponent(path)}`, { headers: { authorization: `Bearer ${session}` } });
        if (!response.ok) throw new Error('현장 사진을 불러오지 못했습니다. 다시 열어 주세요.');
        urls.push(URL.createObjectURL(await response.blob()));
      }
      if (id === photosId.current) setPhotoUrls(urls); else urls.forEach((url) => URL.revokeObjectURL(url));
    } catch (error) { urls.forEach((url) => URL.revokeObjectURL(url)); if (id === photosId.current) setPhotoError(error instanceof Error ? error.message : '사진 조회 오류'); }
    finally { if (id === photosId.current) setPhotosLoading(false); }
  }
  async function saveLead(changes: Partial<Lead>) {
    if (!selected || saving) return;
    const leadId = selected.id;
    setSaving(true); setSaveMessage('');
    try {
      const response = await fetch('/api/leads', { method: 'PATCH', headers: { 'content-type': 'application/json', authorization: `Bearer ${session}` }, body: JSON.stringify({ id: leadId, ...changes }) });
      if (!response.ok) throw new Error('저장하지 못했습니다. 입력값과 연결을 확인하고 다시 시도해 주세요.');
      setSelected((current) => current?.id === leadId ? { ...current, ...changes } : current);
      setSaveMessage('저장했습니다.'); await load(page);
    } catch (error) { setSaveMessage(error instanceof Error ? error.message : '저장 오류'); }
    finally { setSaving(false); }
  }
  const count = (value: string) => overview?.counts.find((row) => row.status === value)?.count || 0;
  const realTotal = overview?.counts.filter((row) => row.status !== 'sample').reduce((sum, row) => sum + row.count, 0) || 0;
  const today = overview?.counts.filter((row) => row.status !== 'sample').reduce((sum, row) => sum + row.today, 0) || 0;
  const schedule = (overview?.schedule || []).filter((lead) => !scheduleFilter || lead.preferred_date?.slice(0, 10) === scheduleFilter);

  if (!session) return <main className={s.login}><form className={s.loginCard} onSubmit={(event) => { event.preventDefault(); void load(1, password); }}><div className={s.logo}>R<span>↗</span></div><span className={s.eyebrow}>ROCKET BOILER</span><h1>로켓보일러 운영 관리</h1><p>상담 접수부터 설치 일정까지 한곳에서.</p><label htmlFor="admin-password">관리자 비밀번호</label><input id="admin-password" type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호를 입력하세요" /><button className={s.primary} disabled={busy}>{busy ? '확인 중…' : '관리자로 입장 →'}</button>{message && <p role="alert" className={s.error}>{message}</p>}<Link href="/">← 로켓보일러 홈페이지</Link></form></main>;

  return <main className={s.shell}>
    <aside className={s.sidebar}><a className={s.brand} href="/admin"><div className={s.logo}>R<span>↗</span></div><div><b>로켓보일러</b><small>운영 관리</small></div></a><div className={s.topActions}><span>관리자</span><button className={s.ghost} onClick={logout}>로그아웃</button></div><div className={s.sideLabel}>WORKSPACE</div><nav className={s.navigation} aria-label="관리 메뉴">{tabs.map((item) => <button key={item.id} aria-current={tab === item.id ? 'page' : undefined} onClick={() => setTab(item.id)}><span>{item.icon}</span>{item.name}{item.id === 'leads' && count('new') > 0 && <b>{count('new')}</b>}</button>)}</nav><label className={s.mobileNav}>관리 메뉴<select aria-label="관리 메뉴 선택" value={tab} onChange={event => setTab(event.target.value as Tab)}>{tabs.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div className={s.sidebarBottom}><a href="/" target="_blank" rel="noreferrer">홈페이지 보기 ↗</a><span>서울·경기·인천</span><small>보일러 설치·교체 상담</small></div></aside>
    <div className={s.workspace}><header className={s.topbar}><span>운영 관리 <i>/</i> {tabs.find((item) => item.id === tab)?.name}</span><div><span className={s.online}>관리자</span><button className={s.ghost} onClick={logout}>로그아웃</button></div></header>
    <div className={s.content}><div className={s.heading}><div><span className={s.eyebrow}>ROCKET BOILER · OPERATIONS</span><h1>{tabs.find((item) => item.id === tab)?.name}</h1><p>{tab === 'profit' ? '판매 채널별 자동 매출·수익 집계' : tab === 'technicians' ? '설치 기사 등록·담당 지역·상담 배정 현황' : tab === 'ads' ? '네이버·구글 광고 유입과 상담 성과' : tab === 'schedule' ? '설치 예정으로 등록된 상담 일정' : tab === 'orders' ? '스마트스토어 주문과 출고 현황' : tab === 'inventory' ? '보일러 모델별 보유·예약·판매 가능 수량' : '접수된 상담과 다음 설치 일정을 확인하세요.'}</p></div><div className={s.refresh}><small>{overview ? new Date(overview.updatedAt).toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit' }) + ' 기준' : ''}</small><button className={s.ghost} disabled={busy} onClick={() => load(page)}>{busy ? '조회 중…' : '↻ 새로고침'}</button></div></div>
    {message && <div className={s.error} role="alert">{message}</div>}{busy && <p className={s.loading} role="status">최신 접수 현황을 불러오고 있습니다…</p>}
    {(tab === 'overview' || tab === 'leads') && <>
      <div className={s.metrics}><button onClick={() => filterStatus('')}><span>전체 상담</span><strong>{number(realTotal)}<small>건</small></strong><em>샘플 제외 · 전체 기간</em></button><button data-accent="gold" onClick={() => filterStatus('new')}><span>연락 대기</span><strong>{number(count('new'))}<small>건</small></strong><em>신규 접수 · 우선 확인</em></button><button onClick={() => setTab('schedule')}><span>설치 예정</span><strong>{number(count('scheduled'))}<small>건</small></strong><em>일정 및 현장 조건 확인</em></button><button data-accent="green" onClick={() => filterStatus('completed')}><span>설치 완료</span><strong>{number(count('completed'))}<small>건</small></strong><em>전체 기간 완료 상담</em></button></div>
      {tab === 'overview' && <><div className={s.notice}><span className={s.noticeIcon}>↗</span><div><b>오늘 {today}건이 접수됐습니다.</b><p>{count('new') ? `아직 연락하지 않은 상담 ${count('new')}건을 확인해 주세요.` : '새로운 상담은 새로고침 후 확인할 수 있습니다.'}</p></div><button onClick={() => filterStatus('new')}>연락 대기 보기 →</button></div><div className={s.overviewGrid}><section className={s.panel}><div className={s.sectionTitle}><h2>상담 진행 현황</h2><span>전체 기간 · 샘플 제외</span></div><div className={s.pipeline}>{['new', 'contacted', 'scheduled', 'completed'].map((value) => <button key={value} onClick={() => filterStatus(value)}><span>{statusNames[value]}</span><b>{number(count(value))}</b><div><i style={{ width: `${realTotal ? count(value) / realTotal * 100 : 0}%` }} /></div></button>)}</div></section><section className={s.panel}><div className={s.sectionTitle}><h2>설치 일정</h2><button onClick={() => setTab('schedule')}>전체 보기 →</button></div>{overview?.schedule.length ? overview.schedule.slice(0, 3).map((lead) => <button className={s.miniSchedule} key={lead.id} onClick={() => openLead(lead)}><time>{dateLabel(lead.preferred_date)}</time><span><b>{lead.customer_name} · {lead.region}</b><small>{lead.preferred_time || '시간 협의'}</small></span><span>→</span></button>) : <div className={s.smallEmpty}>등록된 설치 예정 상담이 없습니다.</div>}</section></div></>}
      <section className={s.panel}><div className={s.sectionTitle}><h2>상담 목록 <span>{number(total)}</span></h2><span>최근 접수순</span></div><form className={s.filters} onSubmit={(event) => { event.preventDefault(); void load(1); }}><input aria-label="고객 검색" placeholder="이름 · 전화번호 · 지역 검색" value={search} onChange={(event) => setSearch(event.target.value)} /><input aria-label="설치 지역" placeholder="설치 지역" value={region} onChange={(event) => setRegion(event.target.value)} /><select aria-label="상담 상태" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">전체 상태</option>{Object.entries(statusNames).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><button className={s.primary} disabled={busy}>조회</button></form>
      <div className={s.tableScroll}><table className={`${s.table} ${s.mobileCards}`}><thead><tr><th>고객·접수일</th><th>설치 지역·유형</th><th>희망 일정</th><th>유입</th><th>사진</th><th>상태</th><th><span className={s.srOnly}>상담 열기</span></th></tr></thead><tbody>{leads.map((lead) => <tr key={lead.id}><td data-label="고객·접수일"><button className={s.customer} onClick={() => openLead(lead)}>{lead.customer_name}</button><small>{lead.phone}</small><small>{dateLabel(lead.created_at)} 접수</small></td><td data-label="설치 지역·유형">{lead.region}<small>{lead.installation_type}</small></td><td data-label="희망 일정">{dateLabel(lead.preferred_date)}<small>{lead.preferred_time || '시간 협의'}</small></td><td data-label="유입"><span className={s.source}>{channelNames[channelOf(lead.source)]}</span></td><td data-label="사진">{lead.photo_paths?.length || 0}장</td><td data-label="상태"><Badge status={lead.status} /></td><td data-label="상담 관리"><button className={s.ghost} onClick={() => openLead(lead)}>상세 →</button></td></tr>)}</tbody></table></div>
      {!leads.length && <div className={s.empty}><span>☷</span><h3>표시할 상담이 없습니다</h3><p>검색 조건을 바꾸거나 새로고침해 주세요.</p></div>}<div className={s.pagination}><span>검색 결과 {number(total)}건</span><div><button disabled={busy || page <= 1} onClick={() => load(page - 1)}>이전</button><span>{page} / {pages}</span><button disabled={busy || page >= pages} onClick={() => load(page + 1)}>다음</button></div></div></section>
    </>}
    {tab === 'schedule' && <section className={s.panel}><div className={s.sectionTitle}><h2>설치 예정 <span>{count('scheduled')}건</span></h2><label className={s.dateFilter}>방문 날짜 <input type="date" value={scheduleFilter} onChange={(event) => setScheduleFilter(event.target.value)} /><button className={s.ghost} onClick={() => setScheduleFilter('')}>전체</button></label></div><p className={s.hint}>고객 희망 일정입니다. 상담 상세에서 통화 후 확정한 날짜와 시간으로 변경할 수 있습니다. 최대 100건을 표시합니다.</p><div className={s.scheduleGrid}>{schedule.map((lead) => <button className={s.scheduleCard} onClick={() => openLead(lead)} key={lead.id}><div><time>{dateLabel(lead.preferred_date)}</time><Badge status={lead.status} /></div><h3>{lead.customer_name} <small>{lead.region}</small></h3><p>{lead.installation_type}</p><span>{lead.preferred_time || '시간 협의'}</span><footer>{lead.current_brand || '브랜드 상담'} · 현장 사진 {lead.photo_paths?.length || 0}장 <b>상담 열기 →</b></footer></button>)}</div>{!schedule.length && <div className={s.empty}><span>▦</span><h3>설치 예정 상담이 없습니다</h3><p>상담 상세에서 처리 상태를 ‘설치 예정’으로 변경해 주세요.</p></div>}</section>}
    {tab === 'ads' && <><div className={s.adHeader}><span className={s.badge}>최근 30일 접수 기준 · 샘플 제외</span><span>광고 계정 연결 전</span></div><div className={s.adGrid}>{['naver', 'google'].map((channel) => { const stats = overview?.channels[channel]; return <section key={channel} className={s.panel}><div className={s.adTitle}><div className={s.adLogo} data-channel={channel}>{channel === 'naver' ? 'N' : 'G'}</div><div><h2>{channelNames[channel]}</h2><small>{channel === 'naver' ? '네이버 검색광고' : 'Google Ads'}</small></div><span className={s.disconnected}>연결 필요</span></div><div className={s.adMetrics}><div><span>광고비</span><b>—</b></div><div><span>클릭 수</span><b>—</b></div><div><span>접수 상담</span><b>{number(stats?.count || 0)}<small>건</small></b></div><div><span>설치 완료</span><b>{number(stats?.completed || 0)}<small>건</small></b></div></div><p className={s.hint}>접수 상담은 유입 정보가 남은 건만 집계합니다. 광고비·클릭 수는 광고 계정 연결 후 확인할 수 있습니다.</p><a className={s.externalLink} href={channel === 'naver' ? 'https://searchad.naver.com/' : 'https://ads.google.com/'} target="_blank" rel="noreferrer">{channelNames[channel]} 관리 열기 ↗</a></section>; })}</div><section className={s.panel}><div className={s.sectionTitle}><h2>상담 유입 현황</h2><span>최근 30일 접수</span></div><div className={s.attribution}>{Object.entries(channelNames).map(([channel, name]) => <div key={channel}><span>{name}</span><strong>{number(overview?.channels[channel]?.count || 0)}건</strong></div>)}</div><p className={s.hint}>기존 상담 중 광고 유입 정보가 없는 건은 ‘미분류’입니다. 미분류에는 직접 방문·검색·기존 광고 상담이 함께 포함될 수 있습니다.</p></section></>}
    {tab === 'profit' && <ProfitManager session={session} />}
    {tab === 'technicians' && <Technicians key={overview?.updatedAt} session={session} />}
    {(tab === 'orders' || tab === 'inventory') && <Operations key={overview?.updatedAt} session={session} view={tab} />}
    <footer className={s.footer}><span>ROCKET BOILER</span>상담 정보는 관리자만 확인할 수 있습니다.</footer></div></div>
    <dialog ref={dialog} className={s.dialog} onCancel={(event) => { event.preventDefault(); closeDetail(); }}>
      {selected && <><header className={s.detailHead}><div><span className={s.eyebrow}>CONSULTATION</span><h2>{selected.customer_name}님의 상담</h2><p>{selected.region} · {selected.installation_type}</p></div><button className={s.close} aria-label="상담 상세 닫기" disabled={saving} onClick={closeDetail}>×</button></header><div className={s.detailBody}><div className={s.contactRow}><a href={`tel:${selected.phone}`}>{selected.phone} ↗</a><Badge status={selected.status} /></div><label className={s.field}>처리 상태<select disabled={saving} value={selected.status} onChange={(event) => saveLead({ status: event.target.value })}>{Object.entries(statusNames).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><LeadSale key={selected.id+'-sale'} id={selected.id} session={session}/><Technicians key={selected.id} session={session} leadId={selected.id} /><section className={s.detailSection}><h3>설치 조건</h3><dl><dt>접수</dt><dd>{new Date(selected.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</dd><dt>주거 공간</dt><dd>{selected.home_type || '미입력'} · {selected.area ? `${selected.area}평` : '평수 미입력'}</dd><dt>기존 보일러</dt><dd>{selected.current_brand || '확인 필요'}</dd><dt>교체 사유</dt><dd>{selected.replace_reason || selected.install_readiness || '미입력'}</dd><dt>연료·배수구</dt><dd>{selected.fuel || '미입력'} · {selected.drain || '미입력'}</dd><dt>각방제어</dt><dd>{selected.controllers || '미입력'}</dd><dt>상담 예상가</dt><dd className={s.price}>{selected.recommendation?.estimatedTotal || selected.recommendation?.price || '상담 후 확인'}</dd><dt>유입</dt><dd>{channelNames[channelOf(selected.source)]}</dd></dl>{!!selected.extras?.length && <ul className={s.extras}>{selected.extras.map((extra, index) => <li key={index}>{extra}</li>)}</ul>}</section><form className={s.detailSection} onSubmit={(event) => { event.preventDefault(); void saveLead({ notes, preferred_date: scheduleDate, preferred_time: scheduleTime }); }}><h3>방문 일정·상담 메모</h3><div className={s.dateInputs}><label className={s.field}>방문 날짜<input type="date" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} /></label><label className={s.field}>방문 시간<input value={scheduleTime} placeholder="예: 오전 10시" maxLength={50} onChange={(event) => setScheduleTime(event.target.value)} /></label></div><label className={s.field}>상담 메모<textarea rows={4} maxLength={4000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="통화 내용, 설치 시 확인할 사항을 남겨 주세요." /></label><button className={s.primary} disabled={saving}>{saving ? '저장 중…' : '일정·메모 저장'}</button></form><p role="status" className={s.saveMessage}>{saveMessage}</p><section className={s.detailSection}><h3>현장 사진 <span>{selected.photo_paths?.length || 0}장</span></h3>{photosLoading && <p>사진을 불러오고 있습니다…</p>}{photoError && <p role="alert" className={s.error}>{photoError}</p>}<div className={s.photos}>{photoUrls.map((url, index) => <a href={url} target="_blank" rel="noreferrer" key={url}><img src={url} alt={`현장 사진 ${index + 1}`} /></a>)}</div>{!photosLoading && !photoError && !photoUrls.length && <p className={s.hint}>등록된 사진이 없습니다.</p>}</section></div></>}
    </dialog>
  </main>;
}
