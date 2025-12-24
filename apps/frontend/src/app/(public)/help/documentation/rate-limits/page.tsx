'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Gauge } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function RateLimitsPageContent() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/help/documentation" className="text-blue-600 hover:text-blue-700">← Documentation</Link>
        <div className="flex items-center gap-3 mt-4 mb-2">
          <Gauge className="w-10 h-10 text-orange-600" />
          <h1 className="text-4xl font-bold">Rate Limits</h1>
        </div>
        <p className="text-xl text-gray-600">Limites d'utilisation API</p>
      </div>

      <div className="prose prose-lg max-w-none">
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Limites par Plan</h2>
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Plan</th>
                <th className="px-4 py-3 text-left font-semibold">Requêtes/min</th>
                <th className="px-4 py-3 text-left font-semibold">Requêtes/jour</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-4 py-3">Starter</td>
                <td className="px-4 py-3">100</td>
                <td className="px-4 py-3">10,000</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Professional</td>
                <td className="px-4 py-3">1,000</td>
                <td className="px-4 py-3">100,000</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Business</td>
                <td className="px-4 py-3">5,000</td>
                <td className="px-4 py-3">500,000</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Enterprise</td>
                <td className="px-4 py-3">Illimité</td>
                <td className="px-4 py-3">Illimité</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Headers de Rate Limit</h2>
          <div className="bg-gray-100 p-6 rounded-lg">
            <pre className="text-sm">
{`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1633024800`}
            </pre>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-6">Gestion des erreurs</h2>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="text-yellow-800">
              <strong>429 Too Many Requests:</strong> Vous avez dépassé la limite. Attendez le reset ou upgradez votre plan.
            </p>
          </div>
        </section>
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
