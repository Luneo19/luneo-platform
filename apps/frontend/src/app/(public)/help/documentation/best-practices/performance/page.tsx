'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function PerformanceBestPracticesPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">Performance Best Practices</h1>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Optimisations</h2>
          <div className="space-y-2 text-gray-300">
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-yellow-400" /> Images: WebP/AVIF, lazy loading</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-yellow-400" /> Code splitting par route</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-yellow-400" /> Dynamic imports Three.js/Konva</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-yellow-400" /> Cache Redis multi-level</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-yellow-400" /> CDN pour assets statiques</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

