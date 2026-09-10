export type Lead = {
  id: string; created_at: string; status: string; source?: string; region: string; installation_type: string;
  customer_name: string; phone: string; home_type?: string; area?: number; preferred_date?: string;
  preferred_time?: string; current_brand?: string; replace_reason?: string; install_readiness?: string;
  fuel?: string; drain?: string; controllers?: string; extras?: string[]; recommendation?: Record<string, string>;
  photo_names?: string[]; photo_paths?: string[]; notes?: string;
};
export const statusNames: Record<string, string> = { new: '신규', contacted: '연락 완료', scheduled: '설치 예정', completed: '완료', cancelled: '취소', sample: '샘플' };
export function channelOf(source = '') {
  const query = new URL(source, 'https://rocketboiler.vercel.app').searchParams;
  const medium = query.get('utm_medium')?.toLowerCase() || '';
  const origin = query.get('utm_source')?.toLowerCase() || '';
  if (query.has('gclid') || (origin === 'google' && ['cpc', 'ppc', 'paid', 'paid_search'].includes(medium))) return 'google';
  if (query.has('n_ad') || query.has('NaPm') || (origin === 'naver' && ['cpc', 'ppc', 'paid', 'paid_search'].includes(medium))) return 'naver';
  return 'unknown';
}
export const channelNames: Record<string, string> = { naver: '네이버 광고', google: '구글 광고', unknown: '미분류' };
export function koreaDate(date: string | Date = new Date()) {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value);
}
