'use client';

import React, { memo, useMemo } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function PrestaShopIntegrationPageContent() {
  const installationSteps = useMemo(() => [
    'Téléchargez le module Luneo pour PrestaShop',
    'BackOffice → Modules → Module Manager',
    'Upload Module → Sélectionnez le ZIP',
    'Installez et configurez'
  ], []);

  const configOptions = useMemo(() => [
    'API Key Luneo',
    'Project ID',
    'Enable sur catégories spécifiques'
  ], []);

  return (
    <DocPageTemplate
      title="Intégration PrestaShop"
      description="Module PrestaShop pour la personnalisation produits en temps réel"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Intégrations', href: '/help/documentation/integrations' },
        { label: 'PrestaShop', href: '/help/documentation/integrations/prestashop' }
      ]}
      relatedLinks={[
        { title: 'WooCommerce', href: '/help/documentation/integrations/woocommerce', description: 'Intégration WooCommerce' },
        { title: 'Magento', href: '/help/documentation/integrations/magento', description: 'Intégration Magento' }
      ]}
    >
      <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Installation</h2>
        <ol className="space-y-2 text-gray-300">
          {installationSteps.map((step, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-400 mr-3 font-bold">{index + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <h2 className="text-2xl font-bold mb-4">Configuration</h2>
        <p className="text-gray-300 mb-3">Dans Modules → Luneo Customizer → Configuration :</p>
        <ul className="space-y-2 text-sm text-gray-300">
          {configOptions.map((option, index) => (
            <li key={index}>• {option}</li>
          ))}
        </ul>
      </Card>
    </DocPageTemplate>
  );
}

const PrestaShopIntegrationPageMemo = memo(PrestaShopIntegrationPageContent);

export default function PrestaShopIntegrationPage() {
  return (
    <ErrorBoundary componentName="PrestaShopIntegrationPage">
      <PrestaShopIntegrationPageMemo />
    </ErrorBoundary>
  );
}
