'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';

function WhatsNewPageContent() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold mb-6 text-white">What's New in Luneo</h1>
        <p className="text-xl text-gray-300 mb-8">Les dernières nouveautés et améliorations</p>
        <Link href="/changelog" className="text-blue-400 hover:text-blue-300 font-semibold">Voir le changelog complet →</Link>
      </div>
    </div>
  );
}

const WhatsNewPageMemo = memo(WhatsNewPageContent);

export default function WhatsNewPage() {
  return (
    <ErrorBoundary componentName="WhatsNewPage">
      <WhatsNewPageMemo />
    </ErrorBoundary>
  );
}

