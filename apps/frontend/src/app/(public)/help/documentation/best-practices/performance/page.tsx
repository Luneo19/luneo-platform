'use client';

import React, { memo, useMemo } from 'react';
import { CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function PerformanceBestPracticesPageContent() {
  const optimizations = useMemo(() => [
    'Images: WebP/AVIF, lazy loading',
    'Code splitting par route',
    'Dynamic imports Three.js/Konva',
    'Cache Redis multi-level',
    'CDN pour assets statiques'
  ], []);

  return (
    <DocPageTemplate
      title="Performance Best Practices"
      description="Optimisations pour des performances optimales"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Best Practices', href: '/help/documentation/best-practices' },
        { label: 'Performance', href: '/help/documentation/best-practices/performance' }
      ]}
      relatedLinks={[
        { title: 'Code Quality', href: '/help/documentation/best-practices/code-quality', description: 'Qualité code' },
        { title: 'SEO', href: '/help/documentation/best-practices/seo', description: 'SEO' }
      ]}
    >
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Optimisations</h2>
        <div className="space-y-2 text-gray-300">
          {optimizations.map((optimization, index) => (
            <div key={index} className="flex gap-2 items-center">
              <CheckCircle className="w-5 h-5 text-yellow-400" />
              <span>{optimization}</span>
            </div>
          ))}
        </div>
      </Card>
    </DocPageTemplate>
  );
}

const PerformanceBestPracticesPageMemo = memo(PerformanceBestPracticesPageContent);

export default function PerformanceBestPracticesPage() {
  return (
    <ErrorBoundary componentName="PerformanceBestPracticesPage">
      <PerformanceBestPracticesPageMemo />
    </ErrorBoundary>
  );
}
