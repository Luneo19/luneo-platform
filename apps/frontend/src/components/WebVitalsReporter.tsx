'use client';

import React, { useEffect, memo } from 'react';
import { initWebVitals } from '@/lib/web-vitals';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function WebVitalsReporterContent() {
  useEffect(() => {
    let initialized = false;
    const maybeInit = () => {
      if (initialized) return;
      try {
        const raw = localStorage.getItem('cookie-preferences');
        const parsed = raw ? (JSON.parse(raw) as { analytics?: boolean }) : null;
        if (parsed?.analytics) {
          initWebVitals();
          initialized = true;
        }
      } catch {
        // Keep silent: do not initialize web vitals without explicit consent.
      }
    };

    maybeInit();
    window.addEventListener('cookie-preferences-updated', maybeInit);
    return () => window.removeEventListener('cookie-preferences-updated', maybeInit);
  }, []);

  return null;
}

const WebVitalsReporterContentMemo = memo(WebVitalsReporterContent);

export function WebVitalsReporter() {
  return (
    <ErrorBoundary componentName="WebVitalsReporter">
      <WebVitalsReporterContentMemo />
    </ErrorBoundary>
  );
}


