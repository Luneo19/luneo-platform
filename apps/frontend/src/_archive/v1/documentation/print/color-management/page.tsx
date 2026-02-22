'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Palette } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function ColorManagementPageContent() {
  const colorSpaces = useMemo(() => [
    {
      name: 'RGB',
      description: 'Écran (sRGB, Display P3)',
      useCase: 'Affichage web, écrans',
      channels: 'Rouge, Vert, Bleu'
    },
    {
      name: 'CMYK',
      description: 'Impression offset',
      useCase: 'Impression professionnelle',
      channels: 'Cyan, Magenta, Jaune, Noir'
    },
    {
      name: 'Pantone',
      description: 'Couleurs spot',
      useCase: 'Impression avec couleurs spécifiques',
      channels: 'Couleurs prédéfinies'
    }
  ], []);

  const conversionTips = useMemo(() => [
    'Toujours convertir RGB → CMYK avant impression',
    'Vérifier les couleurs sur un écran calibré',
    'Utiliser des profils ICC appropriés',
    'Tester avec un échantillon d\'impression'
  ], []);

  return (
    <DocPageTemplate
      title="Gestion des Couleurs"
      description="Comprenez les espaces colorimétriques pour une impression optimale"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Print', href: '/help/documentation/print' },
        { label: 'Gestion des couleurs', href: '/help/documentation/print/color-management' }
      ]}
      relatedLinks={[
        { title: 'Résolution', href: '/help/documentation/print/resolution', description: 'Résolutions recommandées' },
        { title: 'Formats de fichiers', href: '/help/documentation/print/file-formats', description: 'Formats supportés' }
      ]}
    >
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Espaces colorimétriques</h2>
        <div className="space-y-4">
          {colorSpaces.map((space, index) => (
            <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-2">{space.name}</h3>
              <p className="text-gray-300 mb-2">{space.description}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Usage: </span>
                  <span className="text-gray-300">{space.useCase}</span>
                </div>
                <div>
                  <span className="text-gray-400">Canaux: </span>
                  <span className="text-gray-300">{space.channels}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Conseils de conversion</h2>
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6">
          <ul className="space-y-2 text-gray-300">
            {conversionTips.map((tip, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </DocPageTemplate>
  );
}

const ColorManagementPageMemo = memo(ColorManagementPageContent);

export default function ColorManagementPage() {
  return (
    <ErrorBoundary componentName="ColorManagementPage">
      <ColorManagementPageMemo />
    </ErrorBoundary>
  );
}
