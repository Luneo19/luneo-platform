'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';
import { Code, Copy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function CreateOrderPageContent() {
  const [copied, setCopied] = React.useState(false);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(exampleCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const exampleCode = useMemo(() => `const response = await fetch('https://api.luneo.app/v1/orders', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    designId: 'dsg_123',
    productId: 'prod_456',
    quantity: 1,
    shipping: {
      address: '123 Rue de la Paix',
      city: 'Paris',
      postalCode: '75001',
      country: 'FR'
    }
  })
});

const order = await response.json();
logger.info('Commande créée:', order.id);`, []);

  return (
    <DocPageTemplate
      title="Créer une Commande"
      description="Apprenez à créer des commandes avec l'API Luneo"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'API Reference', href: '/help/documentation/api-reference' },
        { label: 'Créer une commande', href: '/help/documentation/api-reference/create-order' }
      ]}
      relatedLinks={[
        { title: 'Créer un design', href: '/help/documentation/api-reference/create-design', description: 'Créez un design avant de passer commande' },
        { title: 'Webhooks', href: '/help/documentation/api-reference/webhooks', description: 'Recevez des notifications sur vos commandes' }
      ]}
    >
      <Card className="bg-gray-800 border-gray-700 p-6 my-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Code className="w-5 h-5 mr-2" />
            Exemple de code
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={copyCode}
            className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied ? 'Copié !' : 'Copier'}
          </Button>
        </div>
        <pre className="bg-gray-900 rounded p-4 overflow-x-auto">
          <code className="text-sm text-gray-300">{exampleCode}</code>
        </pre>
      </Card>

      <h2 className="text-2xl font-bold mt-8 mb-4">Paramètres</h2>
      <ul className="space-y-4">
        <li><strong>designId</strong> (string, requis) - L'ID du design finalisé</li>
        <li><strong>productId</strong> (string, requis) - L'ID du produit</li>
        <li><strong>quantity</strong> (number, optionnel) - Quantité (défaut: 1)</li>
        <li><strong>shipping</strong> (object, requis) - Informations de livraison</li>
      </ul>

      <h2 className="text-2xl font-bold mt-8 mb-4">Réponse</h2>
      <p>L'API retourne un objet commande avec un PaymentIntent Stripe pour compléter le paiement.</p>
    </DocPageTemplate>
  );
}

const CreateOrderPageMemo = memo(CreateOrderPageContent);

export default function CreateOrderPage() {
  return (
    <ErrorBoundary componentName="CreateOrderPage">
      <CreateOrderPageMemo />
    </ErrorBoundary>
  );
}
