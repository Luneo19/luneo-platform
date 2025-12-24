'use client';

import React, { memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function ApiTestCompletePageContent() {
  const router = useRouter();

  useEffect(() => {
    router.push('/api-test');
  }, [router]);

  return null;
}

const ApiTestCompletePageContentMemo = memo(ApiTestCompletePageContent);

export default function ApiTestCompletePage() {
  return (
    <ErrorBoundary componentName="ApiTestCompletePage">
      <ApiTestCompletePageContentMemo />
    </ErrorBoundary>
  );
}
