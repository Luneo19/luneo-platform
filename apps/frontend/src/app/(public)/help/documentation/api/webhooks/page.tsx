'use client';

import React from 'react';
import Link from 'next/link';
import { Webhook, Copy, CheckCircle, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function APIWebhooksPage() {
  const [copied, setCopied] = React.useState('');

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const setupExample = `// Configure Webhook (Dashboard)
const webhook = await client.webhooks.create({
  url: 'https://your-domain.com/webhooks/luneo',
  events: [
    'order.created',
    'order.updated',
    'design.created',
    'payment.succeeded'
  ],
  secret: 'whsec_...' // Auto-generated
});`;

  const handlerExample = `// Webhook Handler
const crypto = require('crypto');

app.post('/webhooks/luneo', (req, res) => {
  const signature = req.headers['x-luneo-signature'];
  const payload = JSON.stringify(req.body);
  
  // Verify signature
  const hash = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  if (hash !== signature) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process event
  const event = req.body;
  console.log('Event:', event.type, event.data);
  
  res.json({ received: true });
});`;

  const events = [
    { name: 'order.created', desc: 'Nouvelle commande' },
    { name: 'order.updated', desc: 'Commande mise à jour' },
    { name: 'design.created', desc: 'Nouveau design' },
    { name: 'design.shared', desc: 'Design partagé' },
    { name: 'payment.succeeded', desc: 'Paiement réussi' },
    { name: 'payment.failed', desc: 'Paiement échoué' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-4">
            ← Documentation
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">Webhooks API</h1>
          <p className="text-xl text-gray-400">Recevez des notifications en temps réel</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Webhook className="w-6 h-6 text-orange-400" />
            Configuration
          </h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {setupExample}
            </pre>
            <button
              onClick={() => copyCode(setupExample, 'setup')}
              className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
            >
              {copied === 'setup' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Webhook Handler</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {handlerExample}
            </pre>
            <button
              onClick={() => copyCode(handlerExample, 'handler')}
              className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
            >
              {copied === 'handler' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            Events Disponibles
          </h2>
          <div className="space-y-2">
            {events.map((e, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <code className="text-sm text-purple-400">{e.name}</code>
                <span className="text-sm text-gray-400">{e.desc}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
