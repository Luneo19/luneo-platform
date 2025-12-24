'use client';

import React, { memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function TermsRedirectContent() {
  const router = useRouter();

  useEffect(() => {
    router.push('/legal/terms');
  }, [router]);

  return null;
}

const TermsRedirectContentMemo = memo(TermsRedirectContent);

export default function TermsRedirect() {
  return (
    <ErrorBoundary componentName="TermsRedirect">
      <TermsRedirectContentMemo />
    </ErrorBoundary>
  );
}
