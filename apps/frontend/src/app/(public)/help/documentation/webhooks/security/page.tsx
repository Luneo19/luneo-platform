'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function WebhookSecurityPageContent() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const example = useMemo(() => `// Verify Webhook Signature
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
    
  return hash === signature;
}

app.post('/webhooks/luneo', (req, res) => {
  const signature = req.headers['x-luneo-signature'];
  const payload = JSON.stringify(req.body);
  
  if (!verifyWebhook(payload, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook
  res.json({ received: true });
});`, []);

  return (
    <DocPageTemplate
      title="Webhook Security"
      description="Sécurisez vos webhooks avec la vérification de signature"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Webhooks', href: '/help/documentation/webhooks' },
        { label: 'Security', href: '/help/documentation/webhooks/security' }
      ]}
      relatedLinks={[
        { title: 'Setup', href: '/help/documentation/webhooks/setup', description: 'Configuration webhooks' },
        { title: 'Events', href: '/help/documentation/webhooks/events', description: 'Types d\'événements' }
      ]}
    >
      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Vérification de signature</h2>
          <button
            onClick={() => copyCode(example, 'security')}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
          >
            {copied === 'security' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <pre className="text-sm text-gray-300 overflow-x-auto">
            <code>{example}</code>
          </pre>
        </div>
      </Card>

      <Card className="p-6 bg-yellow-900/20 border-yellow-500/30">
        <h3 className="text-lg font-bold text-yellow-400 mb-2">⚠️ Important</h3>
        <p className="text-gray-300 text-sm">
          Toujours vérifier la signature des webhooks pour garantir l'authenticité des requêtes.
          Ne traitez jamais un webhook sans vérification de signature.
        </p>
      </Card>
    </DocPageTemplate>
  );
}

const WebhookSecurityPageMemo = memo(WebhookSecurityPageContent);

export default function WebhookSecurityPage() {
  return (
    <ErrorBoundary componentName="WebhookSecurityPage">
      <WebhookSecurityPageMemo />
    </ErrorBoundary>
  );
}
