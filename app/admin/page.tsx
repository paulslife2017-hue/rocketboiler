"use client";

import { useState } from "react";
import styles from "./admin.module.css";

type Lead = Record<string, unknown> & { id: string; created_at: string; region: string; installation_type: string; customer_name: string; phone: string };

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [message, setMessage] = useState("");
  const load = async () => {
    setMessage("불러오는 중...");
    const response = await fetch("/api/leads", { headers: { authorization: `Bearer ${password}` }, cache: "no-store" });
    if (!response.ok) return setMessage("관리자 비밀번호를 확인해 주세요.");
    const data = await response.json();
    setLeads(data.leads || []);
    setMessage("");
  };
  return <main className={styles.page}>
    <header><span>ROCKET BOILER</span><h1>상담 요청</h1><p>최신 요청부터 최대 200건을 확인합니다.</p></header>
    <section className={styles.login}><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="관리자 비밀번호" /><button onClick={load}>조회</button>{message && <p>{message}</p>}</section>
    <section className={styles.list}>{leads.map((lead) => <article key={lead.id}><div><b>{lead.region} · {lead.installation_type}</b><time>{new Date(lead.created_at).toLocaleString("ko-KR")}</time></div><h2>{lead.customer_name} <a href={`tel:${lead.phone}`}>{lead.phone}</a></h2><dl><dt>주거/평수</dt><dd>{String(lead.home_type || "-")} · {String(lead.area || "-")}평</dd><dt>희망 일정</dt><dd>{String(lead.preferred_date || "-")} · {String(lead.preferred_time || "-")}</dd><dt>기존 보일러</dt><dd>{String(lead.current_brand || "-")} · {String(lead.replace_reason || "-")}</dd><dt>추가 작업</dt><dd>{Array.isArray(lead.extras) ? lead.extras.join(", ") || "없음" : "없음"}</dd><dt>사진</dt><dd>{Array.isArray(lead.photo_names) ? `${lead.photo_names.length}장` : "0장"}</dd></dl></article>)}</section>
  </main>;
}

