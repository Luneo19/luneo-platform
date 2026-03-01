'use client';

import React, { memo, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function ErrorsPageContent() {
  const errorCodes = useMemo(() => [
    { code: '400', description: 'Bad Request - Requête invalide' },
    { code: '401', description: 'Unauthorized - Token manquant ou invalide' },
    { code: '403', description: 'Forbidden - Accès refusé' },
    { code: '404', description: 'Not Found - Ressource introuvable' },
    { code: '429', description: 'Too Many Requests - Limite de taux dépassée' },
    { code: '500', description: 'Internal Server Error - Erreur serveur' },
    { code: '503', description: 'Service Unavailable - Service indisponible' }
  ], []);

  return (
    <DocPageTemplate
      title="Error Handling"
      description="Guide de gestion des erreurs API"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Errors', href: '/help/documentation/errors' }
      ]}
      relatedLinks={[
        { title: 'API Reference', href: '/help/documentation/api-reference', description: 'Référence API' },
        { title: 'Rate Limiting', href: '/help/documentation/api/rate-limiting', description: 'Limites de taux' }
      ]}
    >
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6">Error Codes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-white">Code</th>
                <th className="px-4 py-3 text-left font-semibold text-white">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {errorCodes.map((error, index) => (
                <tr key={index} className="bg-gray-800/50">
                  <td className="px-4 py-3 text-red-400 font-mono">{error.code}</td>
                  <td className="px-4 py-3 text-gray-300">{error.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DocPageTemplate>
  );
}

const ErrorsPageMemo = memo(ErrorsPageContent);

export default function ErrorsPage() {
  return (
    <ErrorBoundary componentName="ErrorsPage">
      <ErrorsPageMemo />
    </ErrorBoundary>
  );
}
