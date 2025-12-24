'use client';

import React, { memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function TarifsPageContent() {
  const router = useRouter();

  useEffect(() => {
    router.push('/pricing');
  }, [router]);

  return null;
}

const TarifsPageContentMemo = memo(TarifsPageContent);

export default function TarifsPage() {
  return (
    <ErrorBoundary componentName="TarifsPage">
      <TarifsPageContentMemo />
    </ErrorBoundary>
  );
}
