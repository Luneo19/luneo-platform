'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Webhook } from 'lucide-react';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function WebhooksPageContent() {
  const events = useMemo(() => [
    { code: 'design.created', description: 'Nouveau design créé' },
    { code: 'design.updated', description: 'Design modifié' },
    { code: 'design.deleted', description: 'Design supprimé' },
    { code: 'order.created', description: 'Nouvelle commande créée' },
    { code: 'order.updated', description: 'Commande mise à jour' },
    { code: 'order.completed', description: 'Commande complétée' },
    { code: 'payment.succeeded', description: 'Paiement réussi' },
    { code: 'payment.failed', description: 'Paiement échoué' },
    { code: 'user.registered', description: 'Nouvel utilisateur inscrit' },
    { code: 'product.created', description: 'Nouveau produit créé' }
  ], []);

  return (
    <DocPageTemplate
      title="Webhooks"
      description="Recevez des notifications en temps réel via webhooks"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Webhooks', href: '/help/documentation/webhooks' }
      ]}
      relatedLinks={[
        { title: 'Setup', href: '/help/documentation/webhooks/setup', description: 'Configuration webhooks' },
        { title: 'Events', href: '/help/documentation/webhooks/events', description: 'Types d\'événements' },
        { title: 'Security', href: '/help/documentation/webhooks/security', description: 'Sécurité webhooks' }
      ]}
    >
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6">Événements Disponibles</h2>
        <div className="space-y-3">
          {events.map((event, index) => (
            <div key={index} className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <code className="text-blue-400 font-mono text-sm">{event.code}</code>
              <p className="text-gray-300 mt-1">{event.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6">Configuration</h2>
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-300 mb-4">
            Configurez vos webhooks dans le Dashboard Luneo ou via l'API pour recevoir des notifications en temps réel.
          </p>
          <Link
            href="/help/documentation/webhooks/setup"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Voir le guide de configuration →
          </Link>
        </div>
      </section>
    </DocPageTemplate>
  );
}

const WebhooksPageMemo = memo(WebhooksPageContent);

export default function WebhooksPage() {
  return (
    <ErrorBoundary componentName="WebhooksPage">
      <WebhooksPageMemo />
    </ErrorBoundary>
  );
}
