'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function PrintfulIntegrationPageContent() {
  const features = useMemo(() => [
    'Sync automatique designs',
    'Production automatique',
    'Tracking envoi'
  ], []);

  return (
    <DocPageTemplate
      title="Printful Integration"
      description="Intégration Printful pour le fulfillment automatique"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Intégrations', href: '/help/documentation/integrations' },
        { label: 'Printful', href: '/help/documentation/integrations/printful' }
      ]}
      relatedLinks={[
        { title: 'Printify', href: '/help/documentation/integrations/printify', description: 'Intégration Printify' },
        { title: 'Shopify', href: '/help/documentation/integrations/shopify', description: 'Intégration Shopify' }
      ]}
    >
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Fulfillment Automatique</h2>
        <div className="space-y-2 text-gray-300">
          {features.map((feature, index) => (
            <div key={index} className="flex gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </Card>
    </DocPageTemplate>
  );
}

const PrintfulIntegrationPageMemo = memo(PrintfulIntegrationPageContent);

export default function PrintfulIntegrationPage() {
  return (
    <ErrorBoundary componentName="PrintfulIntegrationPage">
      <PrintfulIntegrationPageMemo />
    </ErrorBoundary>
  );
}
