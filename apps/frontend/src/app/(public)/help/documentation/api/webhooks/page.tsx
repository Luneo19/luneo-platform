'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Webhook, Copy, CheckCircle, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function APIWebhooksPageContent() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const setupExample = useMemo(() => `// Configure Webhook (Dashboard)
const webhook = await client.webhooks.create({
  url: 'https://your-domain.com/webhooks/luneo',
  events: [
    'order.created',
    'order.updated',
    'design.created',
    'payment.succeeded'
  ],
  secret: 'whsec_...' // Auto-generated
});`, []);

  const handlerExample = useMemo(() => `// Webhook Handler
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
  logger.info('Event:', event.type, event.data);
  
  res.json({ received: true });
});`, []);

  const events = useMemo(() => [
    { name: 'order.created', desc: 'Nouvelle commande' },
    { name: 'order.updated', desc: 'Commande mise à jour' },
    { name: 'design.created', desc: 'Nouveau design' },
    { name: 'design.shared', desc: 'Design partagé' },
    { name: 'payment.succeeded', desc: 'Paiement réussi' },
    { name: 'payment.failed', desc: 'Paiement échoué' }
  ], []);

  const CodeBlock = ({ code, id, title }: { code: string; id: string; title: string }) => (
    <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <button
          onClick={() => copyCode(code, id)}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
        >
          {copied === id ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>
      <div className="relative">
        <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
          {code}
        </pre>
      </div>
    </Card>
  );

  return (
    <DocPageTemplate
      title="Webhooks API"
      description="Recevez des notifications en temps réel via webhooks"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'API', href: '/help/documentation/api' },
        { label: 'Webhooks', href: '/help/documentation/api/webhooks' }
      ]}
      relatedLinks={[
        { title: 'Setup', href: '/help/documentation/webhooks/setup', description: 'Configuration webhooks' },
        { title: 'Events', href: '/help/documentation/webhooks/events', description: 'Types d\'événements' }
      ]}
    >
      <CodeBlock code={setupExample} id="setup" title="Configuration" />
      <CodeBlock code={handlerExample} id="handler" title="Webhook Handler" />

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
    </DocPageTemplate>
  );
}

const APIWebhooksPageMemo = memo(APIWebhooksPageContent);

export default function APIWebhooksPage() {
  return (
    <ErrorBoundary componentName="APIWebhooksPage">
      <APIWebhooksPageMemo />
    </ErrorBoundary>
  );
}
