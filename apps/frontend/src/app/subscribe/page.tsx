'use client';

import React, { memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function SubscribePageContent() {
  const router = useRouter();

  useEffect(() => {
    router.push('/pricing');
  }, [router]);

  return null;
}

const SubscribePageContentMemo = memo(SubscribePageContent);

export default function SubscribePage() {
  return (
    <ErrorBoundary componentName="SubscribePage">
      <SubscribePageContentMemo />
    </ErrorBoundary>
  );
}
