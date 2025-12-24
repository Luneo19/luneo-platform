'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Gauge } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function RateLimitsPageContent() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300">← Documentation</Link>
          <div className="flex items-center gap-3 mt-4 mb-2">
            <Gauge className="w-10 h-10 text-orange-400" />
            <h1 className="text-4xl font-bold text-white">Rate Limits</h1>
          </div>
          <p className="text-xl text-gray-300">Limites d'utilisation API</p>
        </div>

        <div className="prose prose-lg max-w-none prose-invert">
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-white">Limites par Plan</h2>
            <table className="min-w-full border border-gray-700">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-white">Plan</th>
                  <th className="px-4 py-3 text-left font-semibold text-white">Requêtes/min</th>
                  <th className="px-4 py-3 text-left font-semibold text-white">Requêtes/jour</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <tr>
                  <td className="px-4 py-3 text-gray-300">Starter</td>
                  <td className="px-4 py-3 text-gray-300">100</td>
                  <td className="px-4 py-3 text-gray-300">10,000</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-300">Professional</td>
                  <td className="px-4 py-3 text-gray-300">1,000</td>
                  <td className="px-4 py-3 text-gray-300">100,000</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-300">Business</td>
                  <td className="px-4 py-3 text-gray-300">5,000</td>
                  <td className="px-4 py-3 text-gray-300">500,000</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-300">Enterprise</td>
                  <td className="px-4 py-3 text-gray-300">Illimité</td>
                  <td className="px-4 py-3 text-gray-300">Illimité</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-white">Headers de Rate Limit</h2>
            <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
              <pre className="text-sm text-gray-300">
{`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1633024800`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-white">Gestion des erreurs</h2>
            <div className="bg-yellow-900/30 border-l-4 border-yellow-400 p-4 mb-4">
              <p className="text-yellow-300">
                <strong>429 Too Many Requests:</strong> Vous avez dépassé la limite. Attendez le reset ou upgradez votre plan.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const RateLimitsPageMemo = memo(RateLimitsPageContent);

export default function RateLimitsPage() {
  return (
    <ErrorBoundary componentName="RateLimitsPage">
      <RateLimitsPageMemo />
    </ErrorBoundary>
  );
}
