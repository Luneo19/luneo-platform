'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function StickersPageContent() {
  const templates = useMemo(() => Array.from({ length: 10 }), []);

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold mb-6 text-white">Stickers Templates</h1>
        <p className="text-xl text-gray-300 mb-8">250+ templates stickers personnalisables</p>
        <div className="grid md:grid-cols-5 gap-6">
          {templates.map((_, idx) => (
            <div key={idx} className="bg-gray-800/50 rounded-xl p-6 text-center border border-gray-700">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-900/30 to-purple-900/30 rounded-full mx-auto mb-4"></div>
              <h3 className="font-bold mb-2 text-white">Sticker {idx + 1}</h3>
              <Link href={`/demo/customizer?template=sticker-${idx + 1}`} className="text-purple-400 hover:text-purple-300 font-semibold text-sm">Personnaliser →</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const StickersPageMemo = memo(StickersPageContent);

export default function StickersPage() {
  return (
    <ErrorBoundary componentName="StickersPage">
      <StickersPageMemo />
    </ErrorBoundary>
  );
}



