"use client";

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import BoilerFinder from '../BoilerFinder';
import { channelOf } from '../admin/shared';

export default function ConsultationWidget() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    const channel = channelOf(window.location.href);
    if (channel === 'unknown') return;
    const query = new URLSearchParams({ utm_source: channel, utm_medium: 'cpc' });
    const campaign = new URLSearchParams(window.location.search).get('utm_campaign');
    if (campaign) query.set('utm_campaign', campaign.slice(0, 50));
    try { sessionStorage.setItem('rocket-ad-source', `/?${query}`); } catch { /* Storage may be unavailable. */ }
  }, [pathname]);
  if (pathname.startsWith('/admin')) return null;
  return <BoilerFinder />;
}
