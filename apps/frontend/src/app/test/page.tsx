'use client';

import React, { memo, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function TestPageContent() {
  const currentTime = useMemo(() => new Date().toISOString(), []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Page</h1>
      <p>If you see this, the app is working!</p>
      <p>Time: {currentTime}</p>
    </div>
  );
}

const TestPageMemo = memo(TestPageContent);

export default function TestPage() {
  return (
    <ErrorBoundary componentName="TestPage">
      <TestPageMemo />
    </ErrorBoundary>
  );
}

