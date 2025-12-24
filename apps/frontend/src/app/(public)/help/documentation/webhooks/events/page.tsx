'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function WebhookEventsPageContent() {
  const events = useMemo(() => [
    { name: 'order.created', desc: 'Nouvelle commande créée' },
    { name: 'order.updated', desc: 'Statut commande modifié' },
    { name: 'design.created', desc: 'Nouveau design sauvegardé' },
    { name: 'design.shared', desc: 'Design partagé' },
    { name: 'payment.succeeded', desc: 'Paiement réussi' },
    { name: 'payment.failed', desc: 'Paiement échoué' }
  ], []);

  return (
    <DocPageTemplate
      title="Webhook Events"
      description="Liste complète des événements webhooks disponibles"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Webhooks', href: '/help/documentation/webhooks' },
        { label: 'Events', href: '/help/documentation/webhooks/events' }
      ]}
      relatedLinks={[
        { title: 'Setup', href: '/help/documentation/webhooks/setup', description: 'Configuration webhooks' },
        { title: 'Security', href: '/help/documentation/webhooks/security', description: 'Sécurité webhooks' }
      ]}
    >
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-400" />
          Events
        </h2>
        <div className="space-y-2">
          {events.map((e, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
              <code className="text-sm text-purple-400 font-mono">{e.name}</code>
              <span className="text-sm text-gray-400">{e.desc}</span>
            </div>
          ))}
        </div>
      </Card>
    </DocPageTemplate>
  );
}

const WebhookEventsPageMemo = memo(WebhookEventsPageContent);

export default function WebhookEventsPage() {
  return (
    <ErrorBoundary componentName="WebhookEventsPage">
      <WebhookEventsPageMemo />
    </ErrorBoundary>
  );
}
