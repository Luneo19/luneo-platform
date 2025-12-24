'use client';

import React, { memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function ProduitPageContent() {
  const router = useRouter();

  useEffect(() => {
    router.push('/solutions');
  }, [router]);

  return null;
}

const ProduitPageContentMemo = memo(ProduitPageContent);

export default function ProduitPage() {
  return (
    <ErrorBoundary componentName="ProduitPage">
      <ProduitPageContentMemo />
    </ErrorBoundary>
  );
}
