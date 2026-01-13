'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function WebhooksSetupPageContent() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const example = useMemo(() => `// Setup Webhook
const webhook = await client.webhooks.create({
  url: 'https://your-domain.com/webhooks/luneo',
  events: ['order.created', 'payment.succeeded'],
  secret: 'whsec_xxx' // Auto-generated
});`, []);

  return (
    <DocPageTemplate
      title="Webhooks Setup"
      description="Configurez vos webhooks pour recevoir des événements en temps réel"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Webhooks', href: '/help/documentation/webhooks' },
        { label: 'Setup', href: '/help/documentation/webhooks/setup' }
      ]}
      relatedLinks={[
        { title: 'Events', href: '/help/documentation/webhooks/events', description: 'Types d\'événements' },
        { title: 'Security', href: '/help/documentation/webhooks/security', description: 'Sécurité webhooks' }
      ]}
    >
      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Configuration</h2>
          <button
            onClick={() => copyCode(example, 'setup')}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
          >
            {copied === 'setup' ? (
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
    </DocPageTemplate>
  );
}

const WebhooksSetupPageMemo = memo(WebhooksSetupPageContent);

export default function WebhooksSetupPage() {
  return (
    <ErrorBoundary componentName="WebhooksSetupPage">
      <WebhooksSetupPageMemo />
    </ErrorBoundary>
  );
}
