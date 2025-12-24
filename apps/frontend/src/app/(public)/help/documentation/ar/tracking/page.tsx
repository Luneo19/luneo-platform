'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function ARTrackingPageContent() {
  const [copied, setCopied] = React.useState('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const events = useMemo(() => [
    { name: 'ar.session.started', description: 'Session AR démarrée' },
    { name: 'ar.product.placed', description: 'Produit placé dans l\'espace' },
    { name: 'ar.screenshot.taken', description: 'Screenshot pris' },
    { name: 'ar.add.to.cart', description: 'Ajout au panier depuis AR' }
  ], []);

  const analyticsCode = useMemo(() => `const analytics = await fetch('/api/ar/analytics', {
  headers: {
    'Authorization': 'Bearer TOKEN'
  }
});

const data = await analytics.json();
// {
//   totalSessions: 1250,
//   averageDuration: 45, // secondes
//   screenshotsTaken: 380,
//   conversionRate: 0.32 // 32%
// }`, []);

  return (
    <DocPageTemplate
      title="AR Tracking & Analytics"
      description="Suivez les interactions AR et analysez l'engagement utilisateur"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'AR', href: '/help/documentation/ar' },
        { label: 'Tracking', href: '/help/documentation/ar/tracking' }
      ]}
      relatedLinks={[
        { title: 'Getting Started', href: '/help/documentation/ar/getting-started', description: 'Guide AR' },
        { title: 'QR Codes', href: '/help/documentation/ar/qr-codes', description: 'QR Codes AR' }
      ]}
    >
      <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Événements trackés</h2>
        <div className="space-y-2 text-sm">
          {events.map((event, index) => (
            <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-3 bg-gray-900 rounded">
              <code className="text-gray-300 font-mono">{event.name}</code>
              <span className="text-gray-500">{event.description}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Récupérer les analytics</h2>
          <button
            onClick={() => copyCode(analyticsCode, 'analytics')}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
          >
            {copied === 'analytics' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <pre className="text-sm text-gray-300 overflow-x-auto">
            <code>{analyticsCode}</code>
          </pre>
        </div>
      </Card>
    </DocPageTemplate>
  );
}

const ARTrackingPageMemo = memo(ARTrackingPageContent);

export default function ARTrackingPage() {
  return (
    <ErrorBoundary componentName="ARTrackingPage">
      <ARTrackingPageMemo />
    </ErrorBoundary>
  );
}
