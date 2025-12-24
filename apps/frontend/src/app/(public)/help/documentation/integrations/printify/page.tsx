'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function PrintifyIntegrationPageContent() {
  const features = useMemo(() => [
    '800+ produits disponibles',
    'Print automatique',
    'Expédition mondiale'
  ], []);

  return (
    <DocPageTemplate
      title="Printify Integration"
      description="Intégration Printify pour le print on demand"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Intégrations', href: '/help/documentation/integrations' },
        { label: 'Printify', href: '/help/documentation/integrations/printify' }
      ]}
      relatedLinks={[
        { title: 'Printful', href: '/help/documentation/integrations/printful', description: 'Intégration Printful' },
        { title: 'Shopify', href: '/help/documentation/integrations/shopify', description: 'Intégration Shopify' }
      ]}
    >
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Print on Demand</h2>
        <div className="space-y-2 text-gray-300">
          {features.map((feature, index) => (
            <div key={index} className="flex gap-2">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </Card>
    </DocPageTemplate>
  );
}

const PrintifyIntegrationPageMemo = memo(PrintifyIntegrationPageContent);

export default function PrintifyIntegrationPage() {
  return (
    <ErrorBoundary componentName="PrintifyIntegrationPage">
      <PrintifyIntegrationPageMemo />
    </ErrorBoundary>
  );
}
