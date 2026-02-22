'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Hand, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function HandTrackingPageContent() {
  const precisionFeatures = useMemo(() => [
    '21 landmarks par main',
    'Détection gauche/droite',
    'Orientation poignet',
    '60 FPS temps réel'
  ], []);

  const useCases = useMemo(() => [
    'Try-on de bagues et montres',
    'Gants et accessoires',
    'Interaction gestuelle',
    'Mesures précises'
  ], []);

  return (
    <DocPageTemplate
      title="Hand Tracking"
      description="Tracking main 21 points avec MediaPipe pour try-on précis"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Virtual Try-On', href: '/help/documentation/virtual-try-on' },
        { label: 'Hand Tracking', href: '/help/documentation/virtual-try-on/hand-tracking' }
      ]}
      relatedLinks={[
        { title: 'Face Tracking', href: '/help/documentation/virtual-try-on/face-tracking', description: 'Tracking facial' },
        { title: 'Performance', href: '/help/documentation/virtual-try-on/performance', description: 'Optimisations' }
      ]}
    >
      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Hand className="w-6 h-6 text-blue-400" />
          Précision
        </h2>
        <div className="space-y-2 text-gray-300">
          {precisionFeatures.map((feature, index) => (
            <div key={index} className="flex gap-2 items-center">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Use Cases</h2>
        <div className="space-y-2 text-gray-300">
          {useCases.map((useCase, index) => (
            <div key={index} className="flex gap-2 items-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>{useCase}</span>
            </div>
          ))}
        </div>
      </Card>
    </DocPageTemplate>
  );
}

const HandTrackingPageMemo = memo(HandTrackingPageContent);

export default function HandTrackingPage() {
  return (
    <ErrorBoundary componentName="HandTrackingPage">
      <HandTrackingPageMemo />
    </ErrorBoundary>
  );
}
