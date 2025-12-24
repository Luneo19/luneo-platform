'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function ApiLimitsPageContent() {
  const plans = useMemo(() => [
    {
      name: 'Starter (Gratuit)',
      border: 'border-gray-200 dark:border-gray-700',
      bg: '',
      limits: [
        '100 requêtes/heure',
        '1 000 requêtes/jour',
        '10 designs/mois',
        '5 commandes/mois'
      ]
    },
    {
      name: 'Professional',
      border: 'border-purple-200 dark:border-purple-700',
      bg: 'bg-purple-50/50 dark:bg-purple-900/20',
      limits: [
        '1 000 requêtes/heure',
        '10 000 requêtes/jour',
        '1 000 designs/mois',
        'Illimité commandes'
      ]
    },
    {
      name: 'Business',
      border: 'border-blue-200 dark:border-blue-700',
      bg: 'bg-blue-50/50 dark:bg-blue-900/20',
      limits: [
        '5 000 requêtes/heure',
        '50 000 requêtes/jour',
        '10 000 designs/mois',
        'Illimité commandes'
      ]
    },
    {
      name: 'Enterprise',
      border: 'border-gold-200 dark:border-gold-700',
      bg: 'bg-gold-50/50 dark:bg-gold-900/20',
      limits: [
        'Limites personnalisées',
        'SLA garanti 99.99%',
        'Support prioritaire 24/7',
        'Quota sur mesure'
      ]
    },
  ], []);

  const headersExample = useMemo(() => `X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1699564800`, []);

  const errorCodes = useMemo(() => [
    { code: '429 Too Many Requests', description: 'Limite de taux dépassée' },
    { code: '402 Payment Required', description: 'Quota mensuel atteint' },
    { code: '403 Forbidden', description: 'Plan insuffisant' },
  ], []);

  return (
    <DocPageTemplate
      title="Limites et Quotas API"
      description="Comprendre les limites de taux et quotas de l'API Luneo"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'API Reference', href: '/help/documentation/api-reference' },
        { label: 'Limites et Quotas', href: '/help/documentation/api-reference/limits' }
      ]}
      relatedLinks={[
        { title: 'Tarifs', href: '/pricing', description: 'Voir les plans et tarifs' },
        { title: 'Rate Limits', href: '/help/documentation/api-reference/rate-limits', description: 'Détails sur les limites' }
      ]}
    >
      <h2 className="text-2xl font-bold mt-8 mb-6">Limites par Plan</h2>
      <div className="space-y-4 mb-8">
        {plans.map((plan, index) => (
          <div key={index} className={`border ${plan.border} rounded-lg p-6 ${plan.bg}`}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              {plan.limits.map((limit, i) => (
                <li key={i}>• {limit}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-4">En-têtes de Réponse</h2>
      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-8">
        <pre className="text-sm text-green-400">{headersExample}</pre>
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-4">Codes d'Erreur</h2>
      <ul className="space-y-3 text-gray-600 dark:text-gray-300">
        {errorCodes.map((error, index) => (
          <li key={index}>
            <strong>{error.code}</strong> - {error.description}
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Link href="/pricing" className="text-purple-600 hover:text-purple-700">
          Voir les plans et tarifs →
        </Link>
      </div>
    </DocPageTemplate>
  );
}

const ApiLimitsPageMemo = memo(ApiLimitsPageContent);

export default function ApiLimitsPage() {
  return (
    <ErrorBoundary componentName="ApiLimitsPage">
      <ApiLimitsPageMemo />
    </ErrorBoundary>
  );
}
