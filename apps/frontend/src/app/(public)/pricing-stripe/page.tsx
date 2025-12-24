'use client';

import React, { memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function PricingStripePageContent() {
  const router = useRouter();

  useEffect(() => {
    router.push('/pricing');
  }, [router]);

  return null;
}

const PricingStripePageContentMemo = memo(PricingStripePageContent);

export default function PricingStripePage() {
  return (
    <ErrorBoundary componentName="PricingStripePage">
      <PricingStripePageContentMemo />
    </ErrorBoundary>
  );
}
