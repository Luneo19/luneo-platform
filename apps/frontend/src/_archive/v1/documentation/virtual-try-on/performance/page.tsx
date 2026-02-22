'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Zap, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function VirtualTryOnPerformancePageContent() {
  const performanceMetrics = useMemo(() => [
    { label: 'FPS', value: '60 FPS constant', color: 'text-green-400' },
    { label: 'Latence', value: '< 16ms par frame', color: 'text-green-400' },
    { label: 'CPU', value: '< 30% utilisation', color: 'text-green-400' },
    { label: 'GPU', value: 'Accélération WebGL', color: 'text-green-400' }
  ], []);

  const optimizations = useMemo(() => [
    'Lazy loading des modèles 3D',
    'Compression textures',
    'Level of Detail (LOD)',
    'Caching des calculs',
    'Web Workers pour traitement'
  ], []);

  return (
    <DocPageTemplate
      title="Virtual Try-On Performance"
      description="Optimisations et performances pour un try-on fluide"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Virtual Try-On', href: '/help/documentation/virtual-try-on' },
        { label: 'Performance', href: '/help/documentation/virtual-try-on/performance' }
      ]}
      relatedLinks={[
        { title: 'Getting Started', href: '/help/documentation/virtual-try-on/getting-started', description: 'Guide de démarrage' },
        { title: 'Face Tracking', href: '/help/documentation/virtual-try-on/face-tracking', description: 'Tracking facial' }
      ]}
    >
      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-400" />
          Performances
        </h2>
        <div className="space-y-2 text-gray-300">
          {performanceMetrics.map((metric, index) => (
            <div key={index} className="flex gap-2 items-center justify-between">
              <div className="flex gap-2 items-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <strong>{metric.label}</strong>:
              </div>
              <span className={metric.color}>{metric.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Optimisations</h2>
        <div className="space-y-2 text-gray-300">
          {optimizations.map((optimization, index) => (
            <div key={index} className="flex gap-2 items-center">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              <span>{optimization}</span>
            </div>
          ))}
        </div>
      </Card>
    </DocPageTemplate>
  );
}

const VirtualTryOnPerformancePageMemo = memo(VirtualTryOnPerformancePageContent);

export default function VirtualTryOnPerformancePage() {
  return (
    <ErrorBoundary componentName="VirtualTryOnPerformancePage">
      <VirtualTryOnPerformancePageMemo />
    </ErrorBoundary>
  );
}
