'use client';

import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { CrispChat } from '@/components/CrispChat';

/**
 * Analytics & chat wrapper — direct imports instead of next/dynamic ssr:false
 * which causes webpack module resolution errors in Next.js 15 dev mode.
 * Both components already guard against SSR via useEffect + typeof window checks.
 */
export function LazyAnalytics() {
  return (
    <>
      <GoogleAnalytics />
      <CrispChat />
    </>
  );
}

