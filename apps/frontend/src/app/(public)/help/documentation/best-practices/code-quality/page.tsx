'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function CodeQualityBestPracticesPageContent() {
  const standards = useMemo(() => [
    'TypeScript strict mode',
    'ESLint + Prettier',
    'Tests unitaires',
    'Code reviews'
  ], []);

  return (
    <DocPageTemplate
      title="Code Quality Best Practices"
      description="Standards et bonnes pratiques pour un code de qualité"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Best Practices', href: '/help/documentation/best-practices' },
        { label: 'Code Quality', href: '/help/documentation/best-practices/code-quality' }
      ]}
      relatedLinks={[
        { title: 'Performance', href: '/help/documentation/best-practices/performance', description: 'Optimisations' },
        { title: 'SEO', href: '/help/documentation/best-practices/seo', description: 'SEO' }
      ]}
    >
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Standards</h2>
        <div className="space-y-2 text-gray-300">
          {standards.map((standard, index) => (
            <div key={index} className="flex gap-2 items-center">
              <CheckCircle className="w-5 h-5 text-indigo-400" />
              <span>{standard}</span>
            </div>
          ))}
        </div>
      </Card>
    </DocPageTemplate>
  );
}

const CodeQualityBestPracticesPageMemo = memo(CodeQualityBestPracticesPageContent);

export default function CodeQualityBestPracticesPage() {
  return (
    <ErrorBoundary componentName="CodeQualityBestPracticesPage">
      <CodeQualityBestPracticesPageMemo />
    </ErrorBoundary>
  );
}
