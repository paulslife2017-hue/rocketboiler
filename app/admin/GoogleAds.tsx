"use client";

import { useCallback, useEffect, useState } from 'react';
import s from './admin.module.css';

type Campaign = {
  id: string;
  customerId: string;
  name: string;
  status: string;
  channelType: string;
  geoTargetType: string;
  budget: number;
  metrics: { impressions: number; clicks: number; cost: number; conversions: number; averageCpc: number };
};
type Data = { connected: boolean; campaigns: Campaign[]; updatedAt?: string };
const number = (value: number) => Math.round(value).toLocaleString('ko-KR');

export default function GoogleAds({ session }: { session: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [refresh, setRefresh] = useState(0);
  const load = useCallback(async (signal: AbortSignal) => {
    const response = await fetch('/api/admin/google-ads', { headers: { authorization: `Bearer ${session}` }, cache: 'no-store', signal });
    const result = await response.json();
    if (!response.ok) throw Error(result.error || '구글 광고 조회에 실패했습니다.');
    return result as Data;
  }, [session]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).then((result) => {
      if (!controller.signal.aborted) { setData(result); setError(''); }
    }).catch((reason) => {
      if (!controller.signal.aborted) { setData(null); setError(reason instanceof Error ? reason.message : '구글 광고 조회에 실패했습니다.'); }
    });
    return () => controller.abort();
  }, [load, refresh]);

  async function connect() {
    setBusy('connect'); setError('');
    try {
      const response = await fetch('/api/admin/google-ads', { method: 'POST', headers: { authorization: `Bearer ${session}`, 'content-type': 'application/json' }, body: JSON.stringify({ action: 'connect' }) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || '연결을 시작하지 못했습니다.');
      window.location.assign(result.url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '연결을 시작하지 못했습니다.');
      setBusy('');
    }
  }

  async function toggle(campaign: Campaign) {
    const action = campaign.status === 'ENABLED' ? 'pause' : 'enable';
    if (!window.confirm(`${campaign.name} 캠페인을 ${action === 'pause' ? '끌까요?' : '켤까요?'}\n일예산 ${number(campaign.budget)}원 · ON이면 클릭에 따라 비용이 발생할 수 있습니다.`)) return;
    setBusy(campaign.id); setError(''); setNotice('');
    try {
      const response = await fetch('/api/admin/google-ads', { method: 'POST', headers: { authorization: `Bearer ${session}`, 'content-type': 'application/json' }, body: JSON.stringify({ action, campaignId: campaign.id, expectedStatus: campaign.status }) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || '광고 상태 변경에 실패했습니다.');
      setNotice(`${campaign.name} 캠페인 ${action === 'pause' ? 'OFF' : 'ON'}을 확인했습니다.`);
      setRefresh((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '변경에 실패했습니다.');
    } finally { setBusy(''); }
  }

  return <section className={s.panel}>
    <div className={s.sectionTitle}><div><h2>구글 광고</h2><p className={s.hint}>광고계정 연결 및 캠페인별 상태</p></div><button type="button" className={s.ghost} disabled={Boolean(busy)} onClick={() => setRefresh((value) => value + 1)}>↻ 새로고침</button></div>
    {error && <p role="alert" className={s.error}>{error}</p>}
    {notice && <p role="status" className={s.notice}>{notice}</p>}
    {!data && !error && <p className={s.hint}>구글 광고계정 상태를 확인하고 있습니다…</p>}
    {data && !data.connected && <div className={s.googleConnect}><div><b>아직 구글 광고가 연결되지 않았습니다</b><p>구글 계정 인증과 Google Ads API 권한이 완료되어야 이 화면의 ON/OFF가 작동합니다. 연결 전에는 광고계정에서 직접 관리해 주세요.</p></div><div className={s.googleActions}><button type="button" className={s.primary} disabled={busy === 'connect'} onClick={() => void connect()}>{busy === 'connect' ? '연결 중…' : '구글 광고 연결'}</button><a className={s.externalLink} href="https://ads.google.com/" target="_blank" rel="noreferrer">Google Ads 열기 ↗</a></div></div>}
    {data?.connected && !data.campaigns.length && <p className={s.hint}>이 광고계정에 캠페인이 없습니다.</p>}
    {data?.campaigns.map((campaign) => {
      const enabled = campaign.status === 'ENABLED';
      const canEnable = campaign.channelType === 'SEARCH' && campaign.geoTargetType === 'PRESENCE' && campaign.budget > 0 && campaign.budget <= 100_000;
      return <article key={campaign.id} className={s.googleCampaign}>
        <div className={s.adMaster}><div className={s.adMasterCopy}><span className={s.adPlatform}>GOOGLE ADS · {campaign.channelType === 'SEARCH' ? '검색' : campaign.channelType}</span><div className={s.adStatusLine}><span className={s.adStatusDot} data-on={enabled} /><h3>{campaign.name}</h3><span className={s.adStatusBadge} data-on={enabled}>{enabled ? '캠페인 ON' : '캠페인 OFF'}</span></div><p>{enabled ? '캠페인은 켜져 있습니다. 실제 노출은 지역·광고 승인·예산에 따라 달라집니다.' : '캠페인이 중지되어 있습니다.'}</p><div className={s.adMeta}><span>하루예산 <b>{number(campaign.budget)}원</b></span><span>최근 30일 클릭 <b>{number(campaign.metrics.clicks)}회</b></span><span>광고비 <b>{number(campaign.metrics.cost)}원</b></span></div>{!enabled && !canEnable && <p className={s.adSafety}>관리자에서 켤 수 없음: 검색 캠페인·하루예산 10만 원 이하·실제 위치 기준의 지역 설정이 필요합니다. 전화 버튼 클릭 전환도 Google Ads에서 확인하세요.</p>}{!enabled && canEnable && <p className={s.hint}>ON을 누르면 서버가 대상 지역을 다시 검증합니다. 지정 지역이 아니거나 확인되지 않으면 변경되지 않습니다.</p>}</div><div className={s.adSwitchArea}><span>이 캠페인</span><button type="button" role="switch" aria-checked={enabled} aria-label={`${campaign.name} 캠페인 ${enabled ? '끄기' : '켜기'}`} className={s.adSwitch} data-on={enabled} disabled={Boolean(busy) || (!enabled && !canEnable)} onClick={() => void toggle(campaign)}><span className={s.adSwitchKnob} /></button><strong>{busy === campaign.id ? '반영 중…' : enabled ? '켜짐' : '꺼짐'}</strong></div></div>
      </article>;
    })}
    <div className={s.adTools}><a className={s.externalLink} href="https://ads.google.com/" target="_blank" rel="noreferrer">구글 광고계정에서 지역·전화 전환 확인 ↗</a></div>
  </section>;
}
