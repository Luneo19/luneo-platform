'use client';

import React, { memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function HomePageContent() {
  const router = useRouter();

  useEffect(() => {
    router.push('/');
  }, [router]);

  return null;
}

const HomePageContentMemo = memo(HomePageContent);

export default function HomePage() {
  return (
    <ErrorBoundary componentName="HomePage">
      <HomePageContentMemo />
    </ErrorBoundary>
  );
}
