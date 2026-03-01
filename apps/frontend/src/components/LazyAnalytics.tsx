'use client';

import { useEffect, useState } from 'react';
import { CrispChat } from '@/components/CrispChat';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

/**
 * Analytics & chat wrapper — direct imports instead of next/dynamic ssr:false
 * which causes webpack module resolution errors in Next.js 15 dev mode.
 * Both components already guard against SSR via useEffect + typeof window checks.
 */
export function LazyAnalytics() {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  useEffect(() => {
    const loadPreferences = () => {
      try {
        const raw = localStorage.getItem('cookie-preferences');
        if (!raw) {
          setAnalyticsEnabled(false);
          setMarketingEnabled(false);
          return;
        }
        const parsed = JSON.parse(raw) as { analytics?: boolean; marketing?: boolean };
        setAnalyticsEnabled(Boolean(parsed.analytics));
        setMarketingEnabled(Boolean(parsed.marketing));
      } catch {
        setAnalyticsEnabled(false);
        setMarketingEnabled(false);
      }
    };

    loadPreferences();
    const onUpdated = () => loadPreferences();
    window.addEventListener('cookie-preferences-updated', onUpdated);
    return () => window.removeEventListener('cookie-preferences-updated', onUpdated);
  }, []);

  return (
    <>
      {analyticsEnabled ? <Analytics /> : null}
      {analyticsEnabled ? <SpeedInsights /> : null}
      {marketingEnabled ? <CrispChat /> : null}
    </>
  );
}

