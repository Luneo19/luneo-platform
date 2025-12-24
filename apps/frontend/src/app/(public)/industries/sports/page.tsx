'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function SportsIndustryPageContent() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold mb-6 text-white">Sports & Outdoor</h1>
        <p className="text-xl text-gray-300 mb-8">Personnalisation équipement sportif</p>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="font-bold mb-2 text-white">Chaussures Custom</h3>
            <p className="text-gray-300 text-sm">Nike By You style</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="font-bold mb-2 text-white">Maillots équipe</h3>
            <p className="text-gray-300 text-sm">Design personnalisé</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="font-bold mb-2 text-white">Équipement</h3>
            <p className="text-gray-300 text-sm">Raquettes, vélos, skis</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const SportsIndustryPageMemo = memo(SportsIndustryPageContent);

export default function SportsIndustryPage() {
  return (
    <ErrorBoundary componentName="SportsIndustryPage">
      <SportsIndustryPageMemo />
    </ErrorBoundary>
  );
}

