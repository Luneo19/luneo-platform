'use client';

import React, { memo, useMemo } from 'react';
import { CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function AccessibilityBestPracticesPageContent() {
  const wcagStandards = useMemo(() => [
    'Contraste couleurs 4.5:1',
    'Aria labels partout',
    'Navigation clavier',
    'Screen reader support'
  ], []);

  return (
    <DocPageTemplate
      title="Accessibility Best Practices"
      description="Standards WCAG 2.1 AA pour l'accessibilité"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Best Practices', href: '/help/documentation/best-practices' },
        { label: 'Accessibility', href: '/help/documentation/best-practices/accessibility' }
      ]}
      relatedLinks={[
        { title: 'UX Design', href: '/help/documentation/best-practices/ux-design', description: 'Design UX' },
        { title: 'SEO', href: '/help/documentation/best-practices/seo', description: 'SEO' }
      ]}
    >
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">WCAG 2.1 AA</h2>
        <div className="space-y-2 text-gray-300">
          {wcagStandards.map((standard, index) => (
            <div key={index} className="flex gap-2 items-center">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              <span>{standard}</span>
            </div>
          ))}
        </div>
      </Card>
    </DocPageTemplate>
  );
}

const AccessibilityBestPracticesPageMemo = memo(AccessibilityBestPracticesPageContent);

export default function AccessibilityBestPracticesPage() {
  return (
    <ErrorBoundary componentName="AccessibilityBestPracticesPage">
      <AccessibilityBestPracticesPageMemo />
    </ErrorBoundary>
  );
}
