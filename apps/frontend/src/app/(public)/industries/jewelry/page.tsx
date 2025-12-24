'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function JewelryIndustryPageContent() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold mb-6 text-white">Jewelry & Luxury</h1>
        <p className="text-xl text-gray-300 mb-8">Visualisation 3D ultra-réaliste pour bijoux</p>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="font-bold mb-2 text-white">PBR Materials</h3>
            <p className="text-gray-300 text-sm">Rendu photoréaliste</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="font-bold mb-2 text-white">Virtual Try-On</h3>
            <p className="text-gray-300 text-sm">Essayage AR bijoux</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="font-bold mb-2 text-white">Configurator</h3>
            <p className="text-gray-300 text-sm">Personnalisation pierres, métaux</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const JewelryIndustryPageMemo = memo(JewelryIndustryPageContent);

export default function JewelryIndustryPage() {
  return (
    <ErrorBoundary componentName="JewelryIndustryPage">
      <JewelryIndustryPageMemo />
    </ErrorBoundary>
  );
}

