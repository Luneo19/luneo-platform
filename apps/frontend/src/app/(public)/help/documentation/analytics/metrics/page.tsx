'use client';

import React, { memo, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function AnalyticsMetricsPageContent() {
  const metrics = useMemo(() => [
    'Vues de designs',
    'Taux de personnalisation',
    'Conversions',
    'Revenue par design',
    'Temps moyen de personnalisation'
  ], []);

  return (
    <DocPageTemplate
      title="Métriques Analytics"
      description="Suivez les performances de vos designs et conversions"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Analytics', href: '/help/documentation/analytics' },
        { label: 'Metrics', href: '/help/documentation/analytics/metrics' }
      ]}
      relatedLinks={[
        { title: 'Overview', href: '/help/documentation/analytics/overview', description: 'Vue d\'ensemble' },
        { title: 'Dashboards', href: '/help/documentation/analytics/dashboards', description: 'Dashboards' }
      ]}
    >
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Métriques disponibles</h2>
        <ul className="list-disc list-inside text-gray-300 space-y-2">
          {metrics.map((metric, index) => (
            <li key={index}>{metric}</li>
          ))}
        </ul>
      </section>
    </DocPageTemplate>
  );
}

const AnalyticsMetricsPageMemo = memo(AnalyticsMetricsPageContent);

export default function AnalyticsMetricsPage() {
  return (
    <ErrorBoundary componentName="AnalyticsMetricsPage">
      <AnalyticsMetricsPageMemo />
    </ErrorBoundary>
  );
}
