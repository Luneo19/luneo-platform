'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Palette } from 'lucide-react';

function BrandPageContent() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <Palette className="w-16 h-16 text-blue-600 mb-6" />
      <h1 className="text-5xl font-bold mb-6">Brand Guidelines</h1>
      <p className="text-xl text-gray-600 mb-8">Logos, couleurs, typographie Luneo</p>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-blue-600 text-white rounded-xl p-8 text-center">
          <h3 className="font-bold mb-2">Primary Blue</h3>
          <p className="font-mono">#2563EB</p>
        </div>
        <div className="bg-purple-600 text-white rounded-xl p-8 text-center">
          <h3 className="font-bold mb-2">Purple</h3>
          <p className="font-mono">#9333EA</p>
        </div>
        <div className="bg-gray-900 text-white rounded-xl p-8 text-center">
          <h3 className="font-bold mb-2">Gray</h3>
          <p className="font-mono">#111827</p>
        </div>
      </div>
    </div>
  );
}

const BrandPageMemo = memo(BrandPageContent);

export default function BrandPage() {
  return (
    <ErrorBoundary componentName="BrandPage">
      <BrandPageMemo />
    </ErrorBoundary>
  );
}

