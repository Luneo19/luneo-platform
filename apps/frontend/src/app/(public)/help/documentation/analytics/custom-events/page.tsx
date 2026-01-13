'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function CustomEventsPageContent() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const example = useMemo(() => `// Track Custom Event
client.analytics.track('design_completed', {
  product_id: 'prod_xxx',
  design_id: 'design_xxx',
  time_spent: 120,
  tools_used: ['text', 'images']
});`, []);

  return (
    <DocPageTemplate
      title="Custom Events"
      description="Trackez vos propres événements personnalisés"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Analytics', href: '/help/documentation/analytics' },
        { label: 'Custom Events', href: '/help/documentation/analytics/custom-events' }
      ]}
      relatedLinks={[
        { title: 'Events', href: '/help/documentation/analytics/events', description: 'Événements automatiques' },
        { title: 'Overview', href: '/help/documentation/analytics/overview', description: 'Vue d\'ensemble' }
      ]}
    >
      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Tracking</h2>
          <button
            onClick={() => copyCode(example, 'track')}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
          >
            {copied === 'track' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <pre className="text-sm text-gray-300 overflow-x-auto">
            <code>{example}</code>
          </pre>
        </div>
      </Card>
    </DocPageTemplate>
  );
}

const CustomEventsPageMemo = memo(CustomEventsPageContent);

export default function CustomEventsPage() {
  return (
    <ErrorBoundary componentName="CustomEventsPage">
      <CustomEventsPageMemo />
    </ErrorBoundary>
  );
}
