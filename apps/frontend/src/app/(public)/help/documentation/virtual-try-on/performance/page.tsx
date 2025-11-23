'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function VirtualTryOnPerformancePage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">Virtual Try-On Performance</h1>
          <p className="text-xl text-gray-400">Optimisations et performances</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><Zap className="w-6 h-6 text-yellow-400" />Performances</h2>
          <div className="space-y-2 text-gray-300">
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> <strong>FPS</strong>: 60 FPS constant</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> <strong>Latence</strong>: {'<'} 16ms par frame</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> <strong>CPU</strong>: {'<'} 30% utilisation</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> <strong>GPU</strong>: Accélération WebGL</div>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Optimisations</h2>
          <div className="space-y-2 text-gray-300">
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-blue-400" /> Model LOD (Levels of Detail)</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-blue-400" /> Texture compression</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-blue-400" /> Lazy loading MediaPipe</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-blue-400" /> Worker threads</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

