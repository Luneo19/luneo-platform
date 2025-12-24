'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function PrintResolutionPageContent() {
  const resolutions = useMemo(() => [
    { dpi: '300 DPI', description: 'Print professionnel (haute qualité)', useCase: 'Impression offset, brochures, flyers' },
    { dpi: '150 DPI', description: 'Print standard', useCase: 'Impression numérique, posters' },
    { dpi: '72 DPI', description: 'Écran uniquement', useCase: 'Web, affichage digital' }
  ], []);

  const exportOptions = useMemo(() => [
    { format: 'PNG', maxResolution: '300 DPI', transparency: 'Oui' },
    { format: 'PDF', maxResolution: 'Vectoriel', transparency: 'Oui' },
    { format: 'SVG', maxResolution: 'Vectoriel', transparency: 'Oui' },
    { format: 'JPG', maxResolution: '300 DPI', transparency: 'Non' }
  ], []);

  return (
    <DocPageTemplate
      title="Résolution Print"
      description="Exportez vos designs en haute résolution pour l'impression"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Print', href: '/help/documentation/print' },
        { label: 'Résolution', href: '/help/documentation/print/resolution' }
      ]}
      relatedLinks={[
        { title: 'Formats de fichiers', href: '/help/documentation/print/file-formats', description: 'Formats supportés' },
        { title: 'Gestion des couleurs', href: '/help/documentation/print/color-management', description: 'Espaces colorimétriques' }
      ]}
    >
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Résolutions recommandées</h2>
        <div className="space-y-4">
          {resolutions.map((res, index) => (
            <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-2">{res.dpi}</h3>
              <p className="text-gray-300 mb-2">{res.description}</p>
              <p className="text-sm text-gray-400">Usage: {res.useCase}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Options d'export</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-800">
                <th className="border border-gray-700 p-4 text-left text-white">Format</th>
                <th className="border border-gray-700 p-4 text-left text-white">Résolution max</th>
                <th className="border border-gray-700 p-4 text-left text-white">Transparence</th>
              </tr>
            </thead>
            <tbody>
              {exportOptions.map((option, index) => (
                <tr key={index} className="bg-gray-800/50">
                  <td className="border border-gray-700 p-4 text-gray-300 font-mono">{option.format}</td>
                  <td className="border border-gray-700 p-4 text-gray-300">{option.maxResolution}</td>
                  <td className="border border-gray-700 p-4 text-gray-300">{option.transparency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DocPageTemplate>
  );
}

const PrintResolutionPageMemo = memo(PrintResolutionPageContent);

export default function PrintResolutionPage() {
  return (
    <ErrorBoundary componentName="PrintResolutionPage">
      <PrintResolutionPageMemo />
    </ErrorBoundary>
  );
}
