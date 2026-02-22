'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function ARFeaturesPageContent() {
  const platforms = useMemo(() => [
    { name: 'iOS', format: 'AR Quick Look (USDZ)', color: 'text-blue-400' },
    { name: 'Android', format: 'Scene Viewer (GLB)', color: 'text-green-400' },
    { name: 'Web', format: 'WebXR API', color: 'text-purple-400' }
  ], []);

  const features = useMemo(() => [
    'Placement surface automatique',
    'Tracking environnement',
    'Occlusion réaliste',
    'Éclairage adaptatif',
    'Anchors persistants'
  ], []);

  return (
    <DocPageTemplate
      title="AR Features"
      description="Export AR iOS/Android/WebXR avec fonctionnalités avancées"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Virtual Try-On', href: '/help/documentation/virtual-try-on' },
        { label: 'AR Features', href: '/help/documentation/virtual-try-on/ar-features' }
      ]}
      relatedLinks={[
        { title: 'Getting Started', href: '/help/documentation/virtual-try-on/getting-started', description: 'Guide de démarrage' },
        { title: 'Face Tracking', href: '/help/documentation/virtual-try-on/face-tracking', description: 'Tracking facial' },
        { title: 'Performance', href: '/help/documentation/virtual-try-on/performance', description: 'Optimisations' }
      ]}
    >
      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Plateformes AR</h2>
        <div className="space-y-3 text-gray-300">
          {platforms.map((platform, index) => (
            <div key={index} className="flex gap-2 items-center">
              <CheckCircle className={`w-5 h-5 ${platform.color}`} />
              <strong>{platform.name}</strong>: {platform.format}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Features</h2>
        <div className="space-y-2 text-gray-300">
          {features.map((feature, index) => (
            <div key={index} className="flex gap-2 items-center">
              <CheckCircle className="w-5 h-5 text-cyan-400" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </Card>
    </DocPageTemplate>
  );
}

const ARFeaturesPageMemo = memo(ARFeaturesPageContent);

export default function ARFeaturesPage() {
  return (
    <ErrorBoundary componentName="ARFeaturesPage">
      <ARFeaturesPageMemo />
    </ErrorBoundary>
  );
}
