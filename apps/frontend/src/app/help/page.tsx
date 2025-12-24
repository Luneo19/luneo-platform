'use client';

import React, { memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function HelpRootPageContent() {
  const router = useRouter();

  useEffect(() => {
    router.push('/help/documentation');
  }, [router]);

  return null;
}

const HelpRootPageContentMemo = memo(HelpRootPageContent);

export default function HelpRootPage() {
  return (
    <ErrorBoundary componentName="HelpRootPage">
      <HelpRootPageContentMemo />
    </ErrorBoundary>
  );
}
