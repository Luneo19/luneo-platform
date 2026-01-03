'use client';

import React, { memo, useMemo } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Code, ExternalLink, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function EndpointsPageContent() {
  const baseUrl = useMemo(() => 'https://api.luneo.app/v1', []);

  const designEndpoints = useMemo(() => [
    {
      method: 'POST',
      path: '/designs',
      description: 'Créer un nouveau design',
      docLink: '/help/documentation/api-reference/create-design',
      color: 'bg-green-600'
    },
    {
      method: 'GET',
      path: '/designs/{designId}',
      description: 'Récupérer les détails d\'un design',
      color: 'bg-blue-600'
    },
    {
      method: 'POST',
      path: '/designs/{designId}/finalize',
      description: 'Finaliser un design pour la commande',
      color: 'bg-green-600'
    }
  ], []);

  const orderEndpoints = useMemo(() => [
    {
      method: 'POST',
      path: '/orders',
      description: 'Créer une nouvelle commande',
      docLink: '/help/documentation/api-reference/create-order',
      color: 'bg-green-600'
    },
    {
      method: 'GET',
      path: '/orders/{orderId}',
      description: 'Récupérer les détails d\'une commande',
      color: 'bg-blue-600'
    }
  ], []);

  const webhookEndpoints = useMemo(() => [
    {
      method: 'POST',
      path: '/webhooks/verify',
      description: 'Endpoint pour la vérification des webhooks',
      docLink: '/help/documentation/api-reference/webhooks',
      color: 'bg-green-600'
    }
  ], []);

  return (
    <DocPageTemplate
      title="Endpoints principaux"
      description="Découvrez les endpoints clés de l'API Luneo pour interagir avec vos designs, produits et commandes"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'API Reference', href: '/help/documentation/api-reference' },
        { label: 'Endpoints principaux', href: '/help/documentation/api-reference/endpoints' }
      ]}
      relatedLinks={[
        { title: 'Créer un design', href: '/help/documentation/api-reference/create-design', description: 'Documentation complète' },
        { title: 'Webhooks', href: '/help/documentation/api-reference/webhooks', description: 'Documentation webhooks' }
      ]}
    >
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">URL de base</h2>
        <div className="bg-gray-900 rounded-lg p-4">
          <code className="text-blue-400 text-lg">{baseUrl}</code>
        </div>
      </div>

      <section className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-6">
        <h2 className="text-2xl font-bold mb-6">Designs</h2>
        <div className="space-y-4">
          {designEndpoints.map((endpoint, index) => (
            <div key={index} className="bg-gray-900 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row items-center justify-start sm:justify-between gap-3 sm:gap-0 mb-2">
                <span className={`${endpoint.color} text-white px-2 py-1 rounded text-sm font-mono`}>
                  {endpoint.method}
                </span>
                <code className="text-blue-400">{endpoint.path}</code>
              </div>
              <p className="text-gray-300 mb-2">{endpoint.description}</p>
              {endpoint.docLink && (
                <Link href={endpoint.docLink} className="text-blue-400 hover:underline text-sm">
                  Voir la documentation →
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-6">
        <h2 className="text-2xl font-bold mb-6">Commandes</h2>
        <div className="space-y-4">
          {orderEndpoints.map((endpoint, index) => (
            <div key={index} className="bg-gray-900 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row items-center justify-start sm:justify-between gap-3 sm:gap-0 mb-2">
                <span className={`${endpoint.color} text-white px-2 py-1 rounded text-sm font-mono`}>
                  {endpoint.method}
                </span>
                <code className="text-blue-400">{endpoint.path}</code>
              </div>
              <p className="text-gray-300 mb-2">{endpoint.description}</p>
              {endpoint.docLink && (
                <Link href={endpoint.docLink} className="text-blue-400 hover:underline text-sm">
                  Voir la documentation →
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-6">
        <h2 className="text-2xl font-bold mb-6">Webhooks</h2>
        <div className="space-y-4">
          {webhookEndpoints.map((endpoint, index) => (
            <div key={index} className="bg-gray-900 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row items-center justify-start sm:justify-between gap-3 sm:gap-0 mb-2">
                <span className={`${endpoint.color} text-white px-2 py-1 rounded text-sm font-mono`}>
                  {endpoint.method}
                </span>
                <code className="text-blue-400">{endpoint.path}</code>
              </div>
              <p className="text-gray-300 mb-2">{endpoint.description}</p>
              {endpoint.docLink && (
                <Link href={endpoint.docLink} className="text-blue-400 hover:underline text-sm">
                  Voir la documentation →
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12 flex flex-col sm:flex-row gap-4">
        <Link href="/help/documentation/api-reference/create-design">
          <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center">
            Créer un design
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </Link>
        <Link href="/help/documentation/api-reference/webhooks">
          <button className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center">
            Webhooks
            <ExternalLink className="w-4 h-4 ml-2" />
          </button>
        </Link>
      </div>
    </DocPageTemplate>
  );
}

const EndpointsPageMemo = memo(EndpointsPageContent);

export default function EndpointsPage() {
  return (
    <ErrorBoundary componentName="EndpointsPage">
      <EndpointsPageMemo />
    </ErrorBoundary>
  );
}
