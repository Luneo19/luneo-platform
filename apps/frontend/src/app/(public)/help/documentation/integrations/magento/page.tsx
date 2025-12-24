'use client';

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function MagentoIntegrationPageContent() {
  const installCommands = useMemo(() => `composer require luneo/magento2-module
php bin/magento module:enable Luneo_Customizer
php bin/magento setup:upgrade
php bin/magento cache:flush`, []);

  const configOptions = useMemo(() => [
    'API Key : Votre clé API Luneo',
    'Enable Customizer : Yes',
    'Default Customizer Type : 2D / 3D / AR'
  ], []);

  return (
    <DocPageTemplate
      title="Intégration Magento"
      description="Module Magento 2 pour activer la personnalisation produits sur votre boutique"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Intégrations', href: '/help/documentation/integrations' },
        { label: 'Magento', href: '/help/documentation/integrations/magento' }
      ]}
      relatedLinks={[
        { title: 'WooCommerce', href: '/help/documentation/integrations/woocommerce', description: 'Intégration WooCommerce' },
        { title: 'PrestaShop', href: '/help/documentation/integrations/prestashop', description: 'Intégration PrestaShop' }
      ]}
    >
      <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Installation du module</h2>
        <div className="bg-gray-900 rounded-lg p-4">
          <pre className="text-sm text-gray-300 overflow-x-auto">
            <code>{installCommands}</code>
          </pre>
        </div>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <h2 className="text-2xl font-bold mb-4">Configuration</h2>
        <p className="text-gray-300 mb-3">Stores → Configuration → Luneo → General Settings</p>
        <ul className="space-y-2 text-sm text-gray-300">
          {configOptions.map((option, index) => (
            <li key={index}>• {option}</li>
          ))}
        </ul>
      </Card>
    </DocPageTemplate>
  );
}

const MagentoIntegrationPageMemo = memo(MagentoIntegrationPageContent);

export default function MagentoIntegrationPage() {
  return (
    <ErrorBoundary componentName="MagentoIntegrationPage">
      <MagentoIntegrationPageMemo />
    </ErrorBoundary>
  );
}
