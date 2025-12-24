'use client';

import React, { memo, useMemo } from 'react';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function RateLimitsPageContent() {
  const plans = useMemo(() => [
    {
      name: 'Plan Gratuit',
      limits: [
        '100 requêtes/heure',
        '1,000 requêtes/jour',
        '5 designs/mois'
      ]
    },
    {
      name: 'Plan Professional',
      limits: [
        '1,000 requêtes/heure',
        '10,000 requêtes/jour',
        'Designs illimités'
      ]
    },
    {
      name: 'Plan Enterprise',
      limits: [
        'Limites personnalisées',
        'SLA garanti',
        'Support prioritaire'
      ]
    },
  ], []);

  const headers = useMemo(() => [
    { header: 'X-RateLimit-Limit', description: 'Limite totale' },
    { header: 'X-RateLimit-Remaining', description: 'Requêtes restantes' },
    { header: 'X-RateLimit-Reset', description: 'Timestamp de réinitialisation' },
  ], []);

  return (
    <DocPageTemplate
      title="Limites et Quotas"
      description="Comprenez les limites de l'API et les quotas par plan"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'API Reference', href: '/help/documentation/api-reference' },
        { label: 'Limites et quotas', href: '/help/documentation/api-reference/rate-limits' }
      ]}
      relatedLinks={[
        { title: 'Tarifs', href: '/pricing', description: 'Voir les plans et tarifs' },
        { title: 'API Reference', href: '/help/documentation/api-reference', description: 'Documentation API complète' }
      ]}
    >
      <h2 className="text-2xl font-bold mt-8 mb-4">Limites par plan</h2>
      {plans.map((plan, index) => (
        <Card key={index} className="bg-gray-800 border-gray-700 p-6 my-6">
          <h3 className="text-xl font-semibold mb-4">{plan.name}</h3>
          <ul className="space-y-2 text-gray-300">
            {plan.limits.map((limit, i) => (
              <li key={i}>• <strong>{limit}</strong></li>
            ))}
          </ul>
        </Card>
      ))}

      <h2 className="text-2xl font-bold mt-8 mb-4">Headers de réponse</h2>
      <p className="text-gray-300 mb-4">
        Chaque réponse API inclut des headers indiquant vos limites :
      </p>
      <ul className="space-y-2 mt-4">
        {headers.map((item, index) => (
          <li key={index}>
            <code className="bg-gray-800 px-2 py-1 rounded">{item.header}</code> - {item.description}
          </li>
        ))}
      </ul>
    </DocPageTemplate>
  );
}

const RateLimitsPageMemo = memo(RateLimitsPageContent);

export default function RateLimitsPage() {
  return (
    <ErrorBoundary componentName="RateLimitsPage">
      <RateLimitsPageMemo />
    </ErrorBoundary>
  );
}
