'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Shield, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { logger } from '../../../../../../lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function RateLimitingPageContent() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const handleExample = useMemo(() => `// Handle Rate Limiting
const response = await fetch('https://api.luneo.app/v1/products', {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
});

if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  logger.info(\`Rate limited. Retry after \${retryAfter}s\`);
  await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
  // Retry request
}`, []);

  const limits = useMemo(() => [
    { plan: 'Free', requests: '100/min', burst: '10/sec', daily: '10,000' },
    { plan: 'Professional', requests: '1,000/min', burst: '100/sec', daily: '100,000' },
    { plan: 'Business', requests: '10,000/min', burst: '1,000/sec', daily: '1M' },
    { plan: 'Enterprise', requests: 'Illimité', burst: 'Illimité', daily: 'Illimité' }
  ], []);

  const responseHeaders = useMemo(() => [
    'X-RateLimit-Limit: 1000',
    'X-RateLimit-Remaining: 847',
    'X-RateLimit-Reset: 1699123456',
    'Retry-After: 60 (si 429)'
  ], []);

  const bestPractices = useMemo(() => [
    'Vérifiez les headers de rate limit',
    'Implémentez un retry avec backoff exponentiel',
    'Mettez en cache les réponses quand possible',
    'Utilisez batch requests pour optimiser'
  ], []);

  return (
    <DocPageTemplate
      title="Rate Limiting"
      description="Limites de requêtes API par plan et gestion des limites"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'API', href: '/help/documentation/api' },
        { label: 'Rate Limiting', href: '/help/documentation/api/rate-limiting' }
      ]}
      relatedLinks={[
        { title: 'API Reference', href: '/help/documentation/api-reference', description: 'Référence API' },
        { title: 'Authentication', href: '/help/documentation/api/authentication', description: 'Authentification' }
      ]}
    >
      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-400" />
          Limites par Plan
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="pb-3 text-gray-400 font-semibold">Plan</th>
                <th className="pb-3 text-gray-400 font-semibold">Requêtes/min</th>
                <th className="pb-3 text-gray-400 font-semibold">Burst/sec</th>
                <th className="pb-3 text-gray-400 font-semibold">Daily</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {limits.map((l, i) => (
                <tr key={i} className="border-b border-gray-800">
                  <td className="py-3 font-semibold text-white">{l.plan}</td>
                  <td className="py-3">{l.requests}</td>
                  <td className="py-3">{l.burst}</td>
                  <td className="py-3">{l.daily}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Gestion des Limites</h2>
          <button
            onClick={() => copyCode(handleExample, 'handle')}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
          >
            {copied === 'handle' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {handleExample}
          </pre>
        </div>
      </Card>

      <Card className="p-6 bg-yellow-900/20 border-yellow-500/30 mb-8">
        <div className="flex gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-yellow-400 mb-2">Headers de Réponse</h3>
            <div className="space-y-1 text-gray-300 text-sm font-mono">
              {responseHeaders.map((header, index) => (
                <div key={index}><code>{header}</code></div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Bonnes Pratiques</h2>
        <div className="space-y-2 text-gray-300">
          {bestPractices.map((practice, index) => (
            <div key={index} className="flex gap-2 items-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>{practice}</span>
            </div>
          ))}
        </div>
      </Card>
    </DocPageTemplate>
  );
}

const RateLimitingPageMemo = memo(RateLimitingPageContent);

export default function RateLimitingPage() {
  return (
    <ErrorBoundary componentName="RateLimitingPage">
      <RateLimitingPageMemo />
    </ErrorBoundary>
  );
}
