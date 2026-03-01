'use client';

import React, { memo, useMemo } from 'react';

import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function ZapierIntegrationPageContent() {
  const triggers = useMemo(() => [
    'New Design Created',
    'Design Updated',
    'Order Placed',
    'Order Completed'
  ], []);

  const actions = useMemo(() => [
    'Create Design',
    'Export Design',
    'Create Order',
    'Update Product'
  ], []);

  return (
    <DocPageTemplate
      title="Intégration Zapier"
      description="Automatisez vos workflows avec Zapier et connectez Luneo à 5000+ applications"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Intégrations', href: '/help/documentation/integrations' },
        { label: 'Zapier', href: '/help/documentation/integrations/zapier' }
      ]}
      relatedLinks={[
        { title: 'Make', href: '/help/documentation/integrations/make', description: 'Intégration Make' },
        { title: 'Webhooks', href: '/help/documentation/api-reference/webhooks', description: 'Webhooks API' }
      ]}
    >
      <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Triggers disponibles</h2>
        <div className="space-y-2">
          {triggers.map((trigger, index) => (
            <div key={index} className="p-3 bg-gray-900 rounded">
              <code className="text-orange-400">{trigger}</code>
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <h2 className="text-2xl font-bold mb-4">Actions disponibles</h2>
        <div className="space-y-2">
          {actions.map((action, index) => (
            <div key={index} className="p-3 bg-gray-900 rounded">
              <code className="text-blue-400">{action}</code>
            </div>
          ))}
        </div>
      </Card>
    </DocPageTemplate>
  );
}

const ZapierIntegrationPageMemo = memo(ZapierIntegrationPageContent);

export default function ZapierIntegrationPage() {
  return (
    <ErrorBoundary componentName="ZapierIntegrationPage">
      <ZapierIntegrationPageMemo />
    </ErrorBoundary>
  );
}
