'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ShoppingBag, Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { logger } from '../../../../../../lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function APIOrdersPageContent() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const createExample = useMemo(() => `// Create Order
const order = await fetch('https://api.luneo.app/v1/orders', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user_id: 'user_xxx',
    items: [
      {
        product_id: 'prod_xxx',
        design_id: 'design_xxx',
        quantity: 2,
        price: 29.99
      }
    ],
    shipping_address: {
      name: 'Jean Dupont',
      address: '123 Rue Example',
      city: 'Paris',
      zip: '75001',
      country: 'FR'
    }
  })
});

const { id, status } = await order.json();
logger.info('Order created:', id);`, []);

  const webhookExample = useMemo(() => `// Webhook Handler (Express)
app.post('/webhooks/luneo', (req, res) => {
  const event = req.body;
  
  if (event.type === 'order.created') {
    logger.info('New order:', event.data.id);
    // Send to fulfillment
  }
  
  res.json({ received: true });
});`, []);

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-4">
            ← Documentation
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">Orders API</h1>
          <p className="text-xl text-gray-400">Gérez les commandes</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-green-400" />
            Créer une Commande
          </h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {createExample}
            </pre>
            <button
              onClick={() => copyCode(createExample, 'create')}
              className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
            >
              {copied === 'create' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Webhooks Commandes</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {webhookExample}
            </pre>
            <button
              onClick={() => copyCode(webhookExample, 'webhook')}
              className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
            >
              {copied === 'webhook' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Status Commande</h2>
          <div className="space-y-2 text-gray-300 text-sm">
            <div className="flex items-center gap-3 p-2"><span className="w-3 h-3 bg-yellow-500 rounded-full"></span><code>pending</code> - En attente paiement</div>
            <div className="flex items-center gap-3 p-2"><span className="w-3 h-3 bg-blue-500 rounded-full"></span><code>processing</code> - En cours</div>
            <div className="flex items-center gap-3 p-2"><span className="w-3 h-3 bg-purple-500 rounded-full"></span><code>printing</code> - En impression</div>
            <div className="flex items-center gap-3 p-2"><span className="w-3 h-3 bg-orange-500 rounded-full"></span><code>shipped</code> - Expédié</div>
            <div className="flex items-center gap-3 p-2"><span className="w-3 h-3 bg-green-500 rounded-full"></span><code>delivered</code> - Livré</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

const APIOrdersPageMemo = memo(APIOrdersPageContent);

export default function APIOrdersPage() {
  return (
    <ErrorBoundary componentName="APIOrdersPage">
      <APIOrdersPageMemo />
    </ErrorBoundary>
  );
}
