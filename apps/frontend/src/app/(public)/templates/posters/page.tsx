'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function PostersPageContent() {
  const templates = useMemo(() => Array.from({ length: 8 }), []);

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold mb-6 text-white">Posters Templates</h1>
        <p className="text-xl text-gray-300 mb-8">Plus de 400 templates posters personnalisables</p>
        <div className="grid md:grid-cols-4 gap-6">
          {templates.map((_, idx) => (
            <div key={idx} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="h-64 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-lg mb-4"></div>
              <h3 className="font-bold text-white">Poster {idx + 1}</h3>
              <Link href={`/demo/customizer?template=poster-${idx + 1}`} className="text-blue-400 hover:text-blue-300 font-semibold">Personnaliser →</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const PostersPageMemo = memo(PostersPageContent);

export default function PostersPage() {
  return (
    <ErrorBoundary componentName="PostersPage">
      <PostersPageMemo />
    </ErrorBoundary>
  );
}



