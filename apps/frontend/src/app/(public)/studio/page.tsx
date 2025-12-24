'use client';

import React, { memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function StudioPageContent() {
  const router = useRouter();

  useEffect(() => {
    router.push('/ai-studio');
  }, [router]);

  return null;
}

const StudioPageContentMemo = memo(StudioPageContent);

export default function StudioPage() {
  return (
    <ErrorBoundary componentName="StudioPage">
      <StudioPageContentMemo />
    </ErrorBoundary>
  );
}
