'use client';

import React, { memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function PrivacyRedirectContent() {
  const router = useRouter();

  useEffect(() => {
    router.push('/legal/privacy');
  }, [router]);

  return null;
}

const PrivacyRedirectContentMemo = memo(PrivacyRedirectContent);

export default function PrivacyRedirect() {
  return (
    <ErrorBoundary componentName="PrivacyRedirect">
      <PrivacyRedirectContentMemo />
    </ErrorBoundary>
  );
}
