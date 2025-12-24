'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { BarChart, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function AnalyticsOverviewPageContent() {
  const metrics = useMemo(() => [
    'Total Views',
    'Downloads',
    'Conversions',
    'Revenue',
    'Popular Designs'
  ], []);

  return (
    <DocPageTemplate
      title="Analytics Overview"
      description="Suivez vos performances avec les analytics Luneo"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Analytics', href: '/help/documentation/analytics' },
        { label: 'Overview', href: '/help/documentation/analytics/overview' }
      ]}
      relatedLinks={[
        { title: 'Events', href: '/help/documentation/analytics/events', description: 'Événements trackés' },
        { title: 'Dashboards', href: '/help/documentation/analytics/dashboards', description: 'Dashboards' }
      ]}
    >
      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <BarChart className="w-6 h-6 text-blue-400" />
          Métriques Disponibles
        </h2>
        <div className="space-y-2 text-gray-300">
          {metrics.map((metric, index) => (
            <div key={index} className="flex gap-2 items-center">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              <span>{metric}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Dashboard</h2>
        <p className="text-gray-300">
          Accédez à votre dashboard analytics depuis le menu principal pour visualiser toutes vos métriques en temps réel.
        </p>
      </Card>
    </DocPageTemplate>
  );
}

const AnalyticsOverviewPageMemo = memo(AnalyticsOverviewPageContent);

export default function AnalyticsOverviewPage() {
  return (
    <ErrorBoundary componentName="AnalyticsOverviewPage">
      <AnalyticsOverviewPageMemo />
    </ErrorBoundary>
  );
}
