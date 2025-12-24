'use client';

import React, { memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function HomeZakekePageContent() {
  const router = useRouter();

  useEffect(() => {
    router.push('/');
  }, [router]);

  return null;
}

const HomeZakekePageContentMemo = memo(HomeZakekePageContent);

export default function HomeZakekePage() {
  return (
    <ErrorBoundary componentName="HomeZakekePage">
      <HomeZakekePageContentMemo />
    </ErrorBoundary>
  );
}
