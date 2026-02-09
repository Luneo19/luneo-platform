'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Download, Palette, Image as ImageIcon } from 'lucide-react';

function BrandAssetsPageContent() {
  return (
    <div className="min-h-screen bg-gray-900 py-20">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-5xl font-bold text-center text-white mb-4">
          Brand Assets
        </h1>
        <p className="text-center text-xl text-gray-300 mb-16">
          Logo, couleurs et ressources graphiques Luneo
        </p>

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 mb-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <ImageIcon className="w-6 h-6" />
            Logo
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-white/[0.04] rounded-lg p-6">
              <div className="bg-purple-600 rounded-lg h-32 flex items-center justify-center mb-4">
                <span className="text-white text-4xl font-bold">L</span>
              </div>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all">
                <Download className="w-4 h-4" />
                Logo PNG
              </button>
            </div>

            <div className="border border-gray-700 rounded-lg p-6">
              <div className="bg-gray-800/50 rounded-lg h-32 flex items-center justify-center mb-4 border border-gray-700">
                <span className="text-purple-400 text-4xl font-bold">L</span>
              </div>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all">
                <Download className="w-4 h-4" />
                Logo SVG
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Palette className="w-6 h-6" />
            Couleurs
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="bg-purple-600 h-24 rounded-lg mb-2"></div>
              <code className="text-sm">#9333EA</code>
            </div>
            <div>
              <div className="bg-pink-500 h-24 rounded-lg mb-2"></div>
              <code className="text-sm">#EC4899</code>
            </div>
            <div>
              <div className="bg-blue-500 h-24 rounded-lg mb-2"></div>
              <code className="text-sm">#3B82F6</code>
            </div>
            <div>
              <div className="bg-gray-900 h-24 rounded-lg mb-2"></div>
              <code className="text-sm">#111827</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const BrandAssetsPageMemo = memo(BrandAssetsPageContent);

export default function BrandAssetsPage() {
  return (
    <ErrorBoundary componentName="BrandAssetsPage">
      <BrandAssetsPageMemo />
    </ErrorBoundary>
  );
}
