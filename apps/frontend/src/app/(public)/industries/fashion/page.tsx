'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

function FashionIndustryPageContent() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-24">
        <div className="max-w-4xl mx-auto px-4">
          <Sparkles className="w-16 h-16 mb-6" />
          <h1 className="text-5xl font-bold mb-6">Fashion & Apparel</h1>
          <p className="text-2xl text-purple-100 mb-8">Virtual try-on, 3D configurator, AR showcase pour la mode</p>
          <Link href="/contact" className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 inline-block">Parler à un expert mode</Link>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">Solutions pour la Mode</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-bold text-xl mb-3">Virtual Try-On</h3>
            <p className="text-gray-600">Essayage virtuel avec AR</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-bold text-xl mb-3">3D Configurator</h3>
            <p className="text-gray-600">Personnalisation vêtements 3D</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-bold text-xl mb-3">Lookbook AR</h3>
            <p className="text-gray-600">Collections en réalité augmentée</p>
          </div>
        </div>
      </section>
    </div>
  );
}

const FashionIndustryPageMemo = memo(FashionIndustryPageContent);

export default function FashionIndustryPage() {
  return (
    <ErrorBoundary componentName="FashionIndustryPage">
      <FashionIndustryPageMemo />
    </ErrorBoundary>
  );
}



