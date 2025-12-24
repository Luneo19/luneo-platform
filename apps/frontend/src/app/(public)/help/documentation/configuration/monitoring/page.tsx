'use client';

import React, { memo } from 'react';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function MonitoringConfigPageContent() {
  return (
    <DocPageTemplate
      title="Monitoring"
      description="Configurez le monitoring et les alertes pour votre intégration Luneo"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Configuration', href: '/help/documentation/configuration' },
        { label: 'Monitoring', href: '/help/documentation/configuration/monitoring' }
      ]}
    >
      <h2 className="text-2xl font-bold mt-8 mb-4">Métriques Disponibles</h2>

      <Card className="bg-gray-800 border-gray-700 p-6 my-6">
        <h3 className="text-xl font-semibold mb-4">Performance</h3>
        <ul className="space-y-2 text-gray-300">
          <li>• Temps de réponse API (p50, p95, p99)</li>
          <li>• Latence de génération de designs</li>
          <li>• Throughput (requêtes/seconde)</li>
        </ul>
      </Card>

      <Card className="bg-gray-800 border-gray-700 p-6 my-6">
        <h3 className="text-xl font-semibold mb-4">Erreurs & Disponibilité</h3>
        <ul className="space-y-2 text-gray-300">
          <li>• Taux d'erreur (4xx, 5xx)</li>
          <li>• Uptime / Disponibilité</li>
          <li>• Échecs de génération IA</li>
        </ul>
      </Card>

      <Card className="bg-gray-800 border-gray-700 p-6 my-6">
        <h3 className="text-xl font-semibold mb-4">Coûts & Usage</h3>
        <ul className="space-y-2 text-gray-300">
          <li>• Coûts IA par design</li>
          <li>• Consommation de crédits</li>
          <li>• Projections de facturation</li>
        </ul>
      </Card>

      <h2 className="text-2xl font-bold mt-8 mb-4">Alertes</h2>
      <p className="text-gray-300">
        Configurez des alertes personnalisées pour être notifié en cas de problème.
      </p>
    </DocPageTemplate>
  );
}

const MonitoringConfigPageMemo = memo(MonitoringConfigPageContent);

export default function MonitoringConfigPage() {
  return (
    <ErrorBoundary componentName="MonitoringConfigPage">
      <MonitoringConfigPageMemo />
    </ErrorBoundary>
  );
}
