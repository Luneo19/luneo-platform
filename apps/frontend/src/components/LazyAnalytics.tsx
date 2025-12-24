'use client';

import dynamic from 'next/dynamic';

// Lazy load analytics and chat for better performance
const LazyGoogleAnalytics = dynamic(() => import('@/components/GoogleAnalytics').then(mod => ({ default: mod.GoogleAnalytics })), {
  ssr: false,
});

const LazyCrispChat = dynamic(() => import('@/components/CrispChat'), {
  ssr: false,
});

export function LazyAnalytics() {
  return (
    <>
      <LazyGoogleAnalytics />
      <LazyCrispChat />
    </>
  );
}

