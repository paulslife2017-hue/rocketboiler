"use client";

import { useState } from "react";
import styles from "./admin.module.css";

type Lead = {
  id: string; created_at: string; status: string; region: string; installation_type: string;
  customer_name: string; phone: string; home_type?: string; area?: number; preferred_date?: string;
  preferred_time?: string; current_brand?: string; replace_reason?: string; install_readiness?: string;
  fuel?: string; drain?: string; controllers?: string; extras?: string[]; recommendation?: Record<string, string>;
  photo_names?: string[]; photo_paths?: string[]; notes?: string;
};

const statusNames: Record<string, string> = { new: "신규", contacted: "연락 완료", scheduled: "설치 예정", completed: "완료", cancelled: "취소", sample: "샘플" };

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);

  const load = async (targetPage = 1) => {
    setMessage("상담 목록을 불러오는 중...");
    const params = new URLSearchParams({ page: String(targetPage), search, region, status });
    const response = await fetch(`/api/leads?${params}`, { headers: { authorization: `Bearer ${password}` }, cache: "no-store" });
    if (!response.ok) return setMessage("관리자 비밀번호를 확인해 주세요.");
    const data = await response.json();
    setLeads(data.leads || []); setTotal(data.total || 0); setPages(data.pages || 1); setPage(data.page || 1); setMessage("");
  };

  const openLead = async (lead: Lead) => {
    photoUrls.forEach((url) => URL.revokeObjectURL(url));
    setSelected(lead); setPhotoUrls([]);
    const paths = Array.isArray(lead.photo_paths) ? lead.photo_paths : [];
    if (!paths.length) return;
    setPhotosLoading(true);
    try {
      const urls = await Promise.all(paths.map(async (path) => {
        const response = await fetch(`/api/photos/view?pathname=${encodeURIComponent(path)}`, { headers: { authorization: `Bearer ${password}` } });
        if (!response.ok) throw new Error("photo_failed");
        return URL.createObjectURL(await response.blob());
      }));
      setPhotoUrls(urls);
    } finally { setPhotosLoading(false); }
  };

  const changeStatus = async (nextStatus: string) => {
    if (!selected) return;
    const response = await fetch("/api/leads", { method: "PATCH", headers: { "content-type": "application/json", authorization: `Bearer ${password}` }, body: JSON.stringify({ id: selected.id, status: nextStatus }) });
    if (response.ok) { setSelected({ ...selected, status: nextStatus }); setLeads((items) => items.map((item) => item.id === selected.id ? { ...item, status: nextStatus } : item)); }
  };

  return <main className={styles.page}>
    <header><div><span>ROCKET BOILER</span><h1>상담 관리</h1></div><strong>{total.toLocaleString("ko-KR")}건</strong></header>
    <section className={styles.toolbar}>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="관리자 비밀번호" />
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름·전화·지역 검색" />
      <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="구 이름" />
      <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">전체 상태</option>{Object.entries(statusNames).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
      <button onClick={() => load(1)}>조회</button>
    </section>
    {message && <p className={styles.message}>{message}</p>}
    <section className={styles.table}>
      <div className={styles.tableHead}><span>접수일</span><span>고객</span><span>지역·유형</span><span>희망 일정</span><span>사진</span><span>상태</span></div>
      {leads.map((lead) => <button className={styles.row} key={lead.id} onClick={() => openLead(lead)}>
        <time>{new Date(lead.created_at).toLocaleDateString("ko-KR")}</time>
        <b>{lead.customer_name}<small>{lead.phone}</small></b>
        <span>{lead.region}<small>{lead.installation_type}</small></span>
        <span>{lead.preferred_date || "-"}<small>{lead.preferred_time || ""}</small></span>
        <span className={styles.photoCount}>{lead.photo_paths?.length || 0}장</span>
        <em data-status={lead.status}>{statusNames[lead.status] || lead.status}</em>
      </button>)}
      {!message && !leads.length && <div className={styles.empty}>조건에 맞는 상담이 없습니다.</div>}
    </section>
    <nav className={styles.pagination}><button disabled={page <= 1} onClick={() => load(page - 1)}>이전</button><span>{page} / {pages}</span><button disabled={page >= pages} onClick={() => load(page + 1)}>다음</button></nav>
    {selected && <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}>
      <aside className={styles.detail}>
        <button className={styles.close} onClick={() => setSelected(null)}>×</button>
        <div className={styles.detailTitle}><span>{selected.region} · {selected.installation_type}</span><h2>{selected.customer_name}</h2><a href={`tel:${selected.phone}`}>{selected.phone}</a></div>
        <label className={styles.statusSelect}>처리 상태<select value={selected.status} onChange={(e) => changeStatus(e.target.value)}>{Object.entries(statusNames).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <dl><dt>접수 시간</dt><dd>{new Date(selected.created_at).toLocaleString("ko-KR")}</dd><dt>공간</dt><dd>{selected.home_type || "-"} · {selected.area || "-"}평</dd><dt>희망 일정</dt><dd>{selected.preferred_date || "-"} · {selected.preferred_time || "-"}</dd><dt>기존 보일러</dt><dd>{selected.current_brand || "-"} · {selected.replace_reason || "-"}</dd><dt>연료·배수</dt><dd>{selected.fuel || "-"} · 배수구 {selected.drain || "-"}</dd><dt>추가 작업</dt><dd>{selected.extras?.join(", ") || "없음"}</dd><dt>추천 견적</dt><dd>{selected.recommendation?.estimatedTotal || selected.recommendation?.price || "-"}</dd></dl>
        <section className={styles.photos}><h3>현장 사진 <span>{selected.photo_paths?.length || 0}장</span></h3>{photosLoading && <p>비공개 사진 불러오는 중...</p>}<div>{photoUrls.map((url, index) => <a href={url} target="_blank" rel="noreferrer" key={url}><img src={url} alt={`현장 사진 ${index + 1}`} /></a>)}</div>{!photosLoading && !photoUrls.length && <p>등록된 사진이 없습니다.</p>}</section>
      </aside>
    </div>}
  </main>;
}

