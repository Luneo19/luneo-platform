'use client';

import React, { memo, useMemo } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function BigCommerceIntegrationPageContent() {
  const configSteps = useMemo(() => [
    'Dans BigCommerce Admin → Advanced Settings → API Accounts',
    'Create API Account → Create V2/V3 Token',
    'Permissions : Products (modify), Orders (modify)',
    'Copiez les credentials',
    'Dans Luneo Dashboard → Integrations → BigCommerce',
    'Collez les credentials et testez la connexion'
  ], []);

  return (
    <DocPageTemplate
      title="Intégration BigCommerce"
      description="Connectez Luneo à BigCommerce via l'API pour synchroniser produits et commandes"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Intégrations', href: '/help/documentation/integrations' },
        { label: 'BigCommerce', href: '/help/documentation/integrations/bigcommerce' }
      ]}
      relatedLinks={[
        { title: 'Shopify', href: '/help/documentation/integrations/shopify', description: 'Intégration Shopify' },
        { title: 'WooCommerce', href: '/help/documentation/integrations/woocommerce', description: 'Intégration WooCommerce' }
      ]}
    >
      <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Configuration API</h2>
        <ol className="space-y-3 text-gray-300">
          {configSteps.map((step, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-400 mr-3 font-bold">{index + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <h2 className="text-2xl font-bold mb-4">Synchronisation</h2>
        <p className="text-gray-300 mb-3">Les produits sont synchronisés automatiquement toutes les heures.</p>
        <div className="p-3 bg-green-900/20 border border-green-500/30 rounded text-sm text-green-300">
          ✅ Synchronisation bidirectionnelle : BigCommerce ↔ Luneo
        </div>
      </Card>
    </DocPageTemplate>
  );
}

const BigCommerceIntegrationPageMemo = memo(BigCommerceIntegrationPageContent);

export default function BigCommerceIntegrationPage() {
  return (
    <ErrorBoundary componentName="BigCommerceIntegrationPage">
      <BigCommerceIntegrationPageMemo />
    </ErrorBoundary>
  );
}
