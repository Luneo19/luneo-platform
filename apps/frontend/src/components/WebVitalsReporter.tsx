'use client';

import React, { useEffect, memo } from 'react';
import { initWebVitals } from '@/lib/web-vitals';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function WebVitalsReporterContent() {
  useEffect(() => {
    initWebVitals();
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


