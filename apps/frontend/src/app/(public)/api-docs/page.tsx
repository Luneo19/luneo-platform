'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function APIDocsPageContent() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold mb-6 text-white">API Documentation</h1>
        <p className="text-xl text-gray-300 mb-8">Documentation complète de l'API Luneo</p>
        <Link href="/help/documentation/api-reference" className="text-blue-400 hover:text-blue-300 font-semibold">Voir l'API Reference →</Link>
      </div>
    </div>
  );
}

const APIDocsPageMemo = memo(APIDocsPageContent);

export default function APIDocsPage() {
  return (
    <ErrorBoundary componentName="APIDocsPage">
      <APIDocsPageMemo />
    </ErrorBoundary>
  );
}



