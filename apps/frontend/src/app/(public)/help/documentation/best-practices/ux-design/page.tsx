'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function UXDesignBestPracticesPageContent() {
  const principles = useMemo(() => [
    'Interface intuitive',
    'Feedback immédiat',
    'Mobile-first design',
    'Touch targets 44px'
  ], []);

  return (
    <DocPageTemplate
      title="UX Design Best Practices"
      description="Principes UX pour une expérience utilisateur optimale"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Best Practices', href: '/help/documentation/best-practices' },
        { label: 'UX Design', href: '/help/documentation/best-practices/ux-design' }
      ]}
      relatedLinks={[
        { title: 'Accessibility', href: '/help/documentation/best-practices/accessibility', description: 'Accessibilité' },
        { title: 'Performance', href: '/help/documentation/best-practices/performance', description: 'Performance' }
      ]}
    >
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Principes UX</h2>
        <div className="space-y-2 text-gray-300">
          {principles.map((principle, index) => (
            <div key={index} className="flex gap-2 items-center">
              <CheckCircle className="w-5 h-5 text-purple-400" />
              <span>{principle}</span>
            </div>
          ))}
        </div>
      </Card>
    </DocPageTemplate>
  );
}

const UXDesignBestPracticesPageMemo = memo(UXDesignBestPracticesPageContent);

export default function UXDesignBestPracticesPage() {
  return (
    <ErrorBoundary componentName="UXDesignBestPracticesPage">
      <UXDesignBestPracticesPageMemo />
    </ErrorBoundary>
  );
}
