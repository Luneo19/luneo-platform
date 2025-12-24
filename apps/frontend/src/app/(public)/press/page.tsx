'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Newspaper } from 'lucide-react';

function PressPageContent() {
  return (
    <div className="min-h-screen bg-gray-900">
      <section className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Newspaper className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Press & Media</h1>
          <p className="text-xl text-indigo-100">Ressources presse et actualités</p>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-white">Contact Presse</h2>
          <p className="text-gray-300 mb-2">Pour toute demande média :</p>
          <a href="mailto:press@luneo.app" className="text-blue-400 hover:text-blue-300 font-semibold">press@luneo.app</a>
        </div>
        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-white">Press Kit</h2>
          <p className="text-gray-300 mb-4">Téléchargez notre press kit avec logos, screenshots, et assets.</p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">Télécharger Press Kit</button>
        </div>
      </section>
    </div>
  );
}

const PressPageMemo = memo(PressPageContent);

export default function PressPage() {
  return (
    <ErrorBoundary componentName="PressPage">
      <PressPageMemo />
    </ErrorBoundary>
  );
}

