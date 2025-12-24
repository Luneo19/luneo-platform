'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileType } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function PrintFileFormatsPageContent() {
  const formats = useMemo(() => [
    {
      name: 'PNG',
      description: 'Idéal pour les designs avec transparence. Qualité lossless.',
      useCase: 'Web, impressions avec transparence',
      maxResolution: '300 DPI'
    },
    {
      name: 'PDF',
      description: 'Format vectoriel recommandé pour l\'impression professionnelle.',
      useCase: 'Impression offset, brochures, documents',
      maxResolution: 'Vectoriel'
    },
    {
      name: 'SVG',
      description: 'Format vectoriel pour le web et l\'impression scalable.',
      useCase: 'Web, logos, icônes',
      maxResolution: 'Vectoriel'
    },
    {
      name: 'JPG',
      description: 'Format compressé pour les photos et images complexes.',
      useCase: 'Photos, images avec beaucoup de couleurs',
      maxResolution: '300 DPI'
    }
  ], []);

  return (
    <DocPageTemplate
      title="Formats de Fichiers Print"
      description="Choisissez le format adapté à vos besoins d'impression"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Print', href: '/help/documentation/print' },
        { label: 'Formats de fichiers', href: '/help/documentation/print/file-formats' }
      ]}
      relatedLinks={[
        { title: 'Résolution', href: '/help/documentation/print/resolution', description: 'Résolutions recommandées' },
        { title: 'Gestion des couleurs', href: '/help/documentation/print/color-management', description: 'Espaces colorimétriques' }
      ]}
    >
      <div className="space-y-6">
        {formats.map((format, index) => (
          <div key={index} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-2">{format.name}</h3>
            <p className="text-gray-300 mb-3">{format.description}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-gray-400">Usage: </span>
                <span className="text-gray-300">{format.useCase}</span>
              </div>
              <div>
                <span className="text-gray-400">Résolution max: </span>
                <span className="text-gray-300 font-mono">{format.maxResolution}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DocPageTemplate>
  );
}

const PrintFileFormatsPageMemo = memo(PrintFileFormatsPageContent);

export default function PrintFileFormatsPage() {
  return (
    <ErrorBoundary componentName="PrintFileFormatsPage">
      <PrintFileFormatsPageMemo />
    </ErrorBoundary>
  );
}
