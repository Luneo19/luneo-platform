'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function WooCommerceDocsPageContent() {
  const installationSteps = useMemo(() => [
    'Téléchargez le plugin depuis WordPress.org',
    'Uploadez dans /wp-content/plugins/',
    'Activez dans WP Admin → Plugins',
    'Configurez votre API key Luneo'
  ], []);

  const features = useMemo(() => [
    'Customizer intégré dans les pages produit',
    'Synchronisation automatique des commandes',
    'Support multi-langues',
    'Compatible avec WooCommerce Subscriptions'
  ], []);

  return (
    <DocPageTemplate
      title="WooCommerce Integration"
      description="Intégrez Luneo dans votre boutique WooCommerce"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Intégrations', href: '/help/documentation/integrations' },
        { label: 'WooCommerce', href: '/help/documentation/integrations/woocommerce' }
      ]}
      relatedLinks={[
        { title: 'Shopify', href: '/help/documentation/integrations/shopify', description: 'Intégration Shopify' },
        { title: 'PrestaShop', href: '/help/documentation/integrations/prestashop', description: 'Intégration PrestaShop' }
      ]}
    >
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Installation du Plugin</h2>
        <ol className="space-y-3 text-gray-300">
          {installationSteps.map((step, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-400 mr-3 font-bold">{index + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Fonctionnalités</h2>
        <ul className="space-y-2 text-gray-300">
          {features.map((feature, index) => (
            <li key={index}>• {feature}</li>
          ))}
        </ul>
      </section>
    </DocPageTemplate>
  );
}

const WooCommerceDocsPageMemo = memo(WooCommerceDocsPageContent);

export default function WooCommerceDocsPage() {
  return (
    <ErrorBoundary componentName="WooCommerceDocsPage">
      <WooCommerceDocsPageMemo />
    </ErrorBoundary>
  );
}
