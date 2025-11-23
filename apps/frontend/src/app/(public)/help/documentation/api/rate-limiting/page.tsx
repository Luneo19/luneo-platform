'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function RateLimitingPage() {
  const [copied, setCopied] = React.useState('');

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleExample = `// Handle Rate Limiting
const response = await fetch('https://api.luneo.app/v1/products', {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
});

if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  console.log(\`Rate limited. Retry after \${retryAfter}s\`);
  await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
  // Retry request
}`;

  const limits = [
    { plan: 'Free', requests: '100/min', burst: '10/sec', daily: '10,000' },
    { plan: 'Professional', requests: '1,000/min', burst: '100/sec', daily: '100,000' },
    { plan: 'Business', requests: '10,000/min', burst: '1,000/sec', daily: '1M' },
    { plan: 'Enterprise', requests: 'Illimité', burst: 'Illimité', daily: 'Illimité' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-4">
            ← Documentation
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">Rate Limiting</h1>
          <p className="text-xl text-gray-400">Limites de requêtes API par plan</p>
        </div>

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
          <h2 className="text-2xl font-bold text-white mb-4">Gestion des Limites</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {handleExample}
            </pre>
            <button
              onClick={() => copyCode(handleExample, 'handle')}
              className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
            >
              {copied === 'handle' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-yellow-900/20 border-yellow-500/30 mb-8">
          <div className="flex gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-yellow-400 mb-2">Headers de Réponse</h3>
              <div className="space-y-1 text-gray-300 text-sm font-mono">
                <div><code>X-RateLimit-Limit: 1000</code></div>
                <div><code>X-RateLimit-Remaining: 847</code></div>
                <div><code>X-RateLimit-Reset: 1699123456</code></div>
                <div><code>Retry-After: 60</code> (si 429)</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Bonnes Pratiques</h2>
          <div className="space-y-2 text-gray-300">
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Vérifiez les headers de rate limit</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Implémentez un retry avec backoff exponentiel</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Mettez en cache les réponses quand possible</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Utilisez batch requests pour optimiser</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
