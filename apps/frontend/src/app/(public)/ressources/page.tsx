'use client';

import React, { memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function RessourcesPageContent() {
  const router = useRouter();

  useEffect(() => {
    router.push('/help/documentation');
  }, [router]);

  return null;
}

const RessourcesPageContentMemo = memo(RessourcesPageContent);

export default function RessourcesPage() {
  return (
    <ErrorBoundary componentName="RessourcesPage">
      <RessourcesPageContentMemo />
    </ErrorBoundary>
  );
}
