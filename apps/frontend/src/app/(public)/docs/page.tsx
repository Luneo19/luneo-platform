'use client';

import React, { memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function DocsPageContent() {
  const router = useRouter();

  useEffect(() => {
    router.push('/help/documentation');
  }, [router]);

  return null;
}

const DocsPageContentMemo = memo(DocsPageContent);

export default function DocsPage() {
  return (
    <ErrorBoundary componentName="DocsPage">
      <DocsPageContentMemo />
    </ErrorBoundary>
  );
}
