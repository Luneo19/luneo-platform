'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function SEOBestPracticesPageContent() {
  const recommendations = useMemo(() => [
    'Meta titles/descriptions uniques',
    'Sitemap XML généré',
    'Structured data JSON-LD',
    'URLs canoniques'
  ], []);

  return (
    <DocPageTemplate
      title="SEO Best Practices"
      description="Recommandations SEO pour améliorer votre visibilité"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Best Practices', href: '/help/documentation/best-practices' },
        { label: 'SEO', href: '/help/documentation/best-practices/seo' }
      ]}
      relatedLinks={[
        { title: 'Performance', href: '/help/documentation/best-practices/performance', description: 'Optimisations' },
        { title: 'Accessibility', href: '/help/documentation/best-practices/accessibility', description: 'Accessibilité' }
      ]}
    >
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Recommandations SEO</h2>
        <div className="space-y-2 text-gray-300">
          {recommendations.map((rec, index) => (
            <div key={index} className="flex gap-2 items-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </Card>
    </DocPageTemplate>
  );
}

const SEOBestPracticesPageMemo = memo(SEOBestPracticesPageContent);

export default function SEOBestPracticesPage() {
  return (
    <ErrorBoundary componentName="SEOBestPracticesPage">
      <SEOBestPracticesPageMemo />
    </ErrorBoundary>
  );
}
