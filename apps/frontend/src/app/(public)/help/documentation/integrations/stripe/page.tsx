'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';
import { Card } from '@/components/ui/card';
import { Code, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function StripeIntegrationPageContent() {
  const [copied, setCopied] = React.useState(false);

  const copyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const exampleCode = useMemo(() => `// Configuration Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Créer un Payment Intent après génération du design
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2999, // 29.99 EUR en centimes
  currency: 'eur',
  metadata: {
    designId: 'dsg_123',
    orderId: 'ord_456'
  }
});`, []);

  const features = useMemo(() => [
    'Paiements sécurisés PCI-DSS',
    'Support multi-devises',
    'Abonnements récurrents',
    'Essais gratuits (14 jours)',
    'Webhooks en temps réel'
  ], []);

  return (
    <DocPageTemplate
      title="Intégration Stripe"
      description="Intégrez Stripe pour gérer les paiements de vos designs personnalisés"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Intégrations', href: '/help/documentation/integrations' },
        { label: 'Stripe', href: '/help/documentation/integrations/stripe' }
      ]}
      relatedLinks={[
        { title: 'Webhooks', href: '/help/documentation/api-reference/webhooks', description: 'Configurer les webhooks Stripe' },
        { title: 'Facturation', href: '/billing', description: 'Gérer vos abonnements' }
      ]}
    >
      <h2 className="text-2xl font-bold mt-8 mb-4">Configuration</h2>
      <p className="text-gray-300 mb-6">
        Luneo utilise Stripe pour gérer tous les paiements de manière sécurisée. Aucune donnée bancaire n'est stockée sur nos serveurs.
      </p>

      <Card className="bg-gray-800 border-gray-700 p-6 my-8">
        <div className="flex flex-col sm:flex-row items-center justify-start sm:justify-between gap-3 sm:gap-0 mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Code className="w-5 h-5 mr-2" />
            Exemple d'intégration
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyCode(exampleCode)}
            className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied ? 'Copié !' : 'Copier'}
          </Button>
        </div>
        <pre className="bg-gray-900 rounded p-4 overflow-x-auto">
          <code className="text-sm text-gray-300">{exampleCode}</code>
        </pre>
      </Card>

      <h2 className="text-2xl font-bold mt-8 mb-4">Fonctionnalités</h2>
      <ul className="space-y-2 text-gray-300">
        {features.map((feature, index) => (
          <li key={index}>✅ {feature}</li>
        ))}
      </ul>
    </DocPageTemplate>
  );
}

const StripeIntegrationPageMemo = memo(StripeIntegrationPageContent);

export default function StripeIntegrationPage() {
  return (
    <ErrorBoundary componentName="StripeIntegrationPage">
      <StripeIntegrationPageMemo />
    </ErrorBoundary>
  );
}
