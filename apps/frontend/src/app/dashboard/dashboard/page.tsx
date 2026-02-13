'use client';

import React, { memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function DashboardDashboardPageContent() {
  const router = useRouter();

  useEffect(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    router.push(search ? `/overview${search}` : '/overview');
  }, [router]);

  return null;
}

const DashboardDashboardPageContentMemo = memo(DashboardDashboardPageContent);

export default function DashboardDashboardPage() {
  return (
    <ErrorBoundary componentName="DashboardDashboardPage">
      <DashboardDashboardPageContentMemo />
    </ErrorBoundary>
  );
}
