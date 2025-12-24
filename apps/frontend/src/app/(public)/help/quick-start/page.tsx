'use client';

import React, { memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function QuickStartPageContent() {
  const router = useRouter();

  useEffect(() => {
    router.push('/help/documentation/quickstart/installation');
  }, [router]);

  return null;
}

const QuickStartPageContentMemo = memo(QuickStartPageContent);

export default function QuickStartPage() {
  return (
    <ErrorBoundary componentName="QuickStartPage">
      <QuickStartPageContentMemo />
    </ErrorBoundary>
  );
}
