'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function ElectronicsIndustryPageContent() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold mb-6 text-white">Electronics</h1>
        <p className="text-xl text-gray-300 mb-8">Configuration tech products en 3D</p>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="font-bold mb-2 text-white">PC Builder</h3>
            <p className="text-gray-300 text-sm">Configurateur PC gaming</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="font-bold mb-2 text-white">Smartphones</h3>
            <p className="text-gray-300 text-sm">Personnalisation coques</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="font-bold mb-2 text-white">AR Placement</h3>
            <p className="text-gray-300 text-sm">TV, sound systems</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const ElectronicsIndustryPageMemo = memo(ElectronicsIndustryPageContent);

export default function ElectronicsIndustryPage() {
  return (
    <ErrorBoundary componentName="ElectronicsIndustryPage">
      <ElectronicsIndustryPageMemo />
    </ErrorBoundary>
  );
}

