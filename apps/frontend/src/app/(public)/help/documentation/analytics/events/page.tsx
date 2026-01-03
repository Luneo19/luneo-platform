'use client';

import React, { memo, useMemo } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function AnalyticsEventsPageContent() {
  const customizerEvents = useMemo(() => [
    'customizer.opened',
    'customizer.text_added',
    'customizer.image_uploaded',
    'customizer.color_changed',
    'customizer.design_saved',
    'customizer.design_exported'
  ], []);

  return (
    <DocPageTemplate
      title="Événements trackés"
      description="Liste complète des événements automatiquement trackés par Luneo"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Analytics', href: '/help/documentation/analytics' },
        { label: 'Events', href: '/help/documentation/analytics/events' }
      ]}
      relatedLinks={[
        { title: 'Overview', href: '/help/documentation/analytics/overview', description: 'Vue d\'ensemble' },
        { title: 'Custom Events', href: '/help/documentation/analytics/custom-events', description: 'Événements personnalisés' }
      ]}
    >
      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <h2 className="text-2xl font-bold mb-4">Événements Customizer</h2>
        <div className="space-y-2 text-sm">
          {customizerEvents.map((event) => (
            <div key={event} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-3 bg-gray-900 rounded">
              <code className="text-blue-400 font-mono">{event}</code>
              <span className="text-gray-400 text-xs">Auto-tracked</span>
            </div>
          ))}
        </div>
      </Card>
    </DocPageTemplate>
  );
}

const AnalyticsEventsPageMemo = memo(AnalyticsEventsPageContent);

export default function AnalyticsEventsPage() {
  return (
    <ErrorBoundary componentName="AnalyticsEventsPage">
      <AnalyticsEventsPageMemo />
    </ErrorBoundary>
  );
}
