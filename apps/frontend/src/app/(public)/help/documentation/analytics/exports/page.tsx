'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function AnalyticsExportsPageContent() {
  const formats = useMemo(() => [
    'CSV (Excel compatible)',
    'JSON',
    'XLSX (Excel)'
  ], []);

  return (
    <DocPageTemplate
      title="Exports Analytics"
      description="Exportez vos données analytics aux formats CSV, JSON, Excel"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Analytics', href: '/help/documentation/analytics' },
        { label: 'Exports', href: '/help/documentation/analytics/exports' }
      ]}
      relatedLinks={[
        { title: 'Overview', href: '/help/documentation/analytics/overview', description: 'Vue d\'ensemble' },
        { title: 'Dashboards', href: '/help/documentation/analytics/dashboards', description: 'Dashboards' }
      ]}
    >
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Formats disponibles</h2>
        <ul className="list-disc list-inside text-gray-300 space-y-2">
          {formats.map((format, index) => (
            <li key={index}>{format}</li>
          ))}
        </ul>
      </section>
    </DocPageTemplate>
  );
}

const AnalyticsExportsPageMemo = memo(AnalyticsExportsPageContent);

export default function AnalyticsExportsPage() {
  return (
    <ErrorBoundary componentName="AnalyticsExportsPage">
      <AnalyticsExportsPageMemo />
    </ErrorBoundary>
  );
}
