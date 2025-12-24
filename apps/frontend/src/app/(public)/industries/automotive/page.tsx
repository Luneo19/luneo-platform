'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { Car } from 'lucide-react';

function AutomotiveIndustryPageContent() {
  return (
    <div className="min-h-screen bg-gray-900">
      <section className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-24">
        <div className="max-w-4xl mx-auto px-4">
          <Car className="w-16 h-16 mb-6 text-white" />
          <h1 className="text-5xl font-bold mb-6 text-white">Automotive</h1>
          <p className="text-2xl text-blue-100 mb-8">Configurateur véhicule 3D, AR showroom</p>
          <Link href="/contact" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 inline-block">Démo automotive</Link>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 text-white">Solutions Automotive</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="font-bold text-xl mb-3 text-white">Vehicle Configurator</h3>
            <p className="text-gray-300">Configuration complète du véhicule</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="font-bold text-xl mb-3 text-white">AR Showroom</h3>
            <p className="text-gray-300">Showroom en réalité augmentée</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="font-bold text-xl mb-3 text-white">Virtual Test Drive</h3>
            <p className="text-gray-300">Essai virtuel immersif</p>
          </div>
        </div>
      </section>
    </div>
  );
}

const AutomotiveIndustryPageMemo = memo(AutomotiveIndustryPageContent);

export default function AutomotiveIndustryPage() {
  return (
    <ErrorBoundary componentName="AutomotiveIndustryPage">
      <AutomotiveIndustryPageMemo />
    </ErrorBoundary>
  );
}



