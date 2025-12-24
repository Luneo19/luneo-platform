'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function DashboardsPageContent() {
  const dashboards = useMemo(() => [
    'Overview Dashboard',
    'Products Performance',
    'Designs Analytics',
    'Revenue Tracking'
  ], []);

  return (
    <DocPageTemplate
      title="Analytics Dashboards"
      description="Visualisez vos données avec les dashboards analytics"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Analytics', href: '/help/documentation/analytics' },
        { label: 'Dashboards', href: '/help/documentation/analytics/dashboards' }
      ]}
      relatedLinks={[
        { title: 'Overview', href: '/help/documentation/analytics/overview', description: 'Vue d\'ensemble' },
        { title: 'Metrics', href: '/help/documentation/analytics/metrics', description: 'Métriques' }
      ]}
    >
      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Dashboards Disponibles</h2>
        <div className="space-y-2 text-gray-300">
          {dashboards.map((dashboard, index) => (
            <div key={index} className="flex gap-2 items-center">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              <span>{dashboard}</span>
            </div>
          ))}
        </div>
      </Card>
    </DocPageTemplate>
  );
}

const DashboardsPageMemo = memo(DashboardsPageContent);

export default function DashboardsPage() {
  return (
    <ErrorBoundary componentName="DashboardsPage">
      <DashboardsPageMemo />
    </ErrorBoundary>
  );
}
