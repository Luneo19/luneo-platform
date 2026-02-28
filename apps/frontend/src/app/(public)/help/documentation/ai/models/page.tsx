'use client';

import React, { memo, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function AIModelsPageContent() {
  const models = useMemo(() => [
    {
      name: 'DALL-E 3 (OpenAI)',
      description: 'Le plus puissant pour des images photoréalistes',
      quality: '⭐⭐⭐⭐⭐',
      speed: '⭐⭐⭐',
      cost: '0.04€/image'
    },
    {
      name: 'Stable Diffusion XL',
      description: 'Excellent rapport qualité/prix',
      quality: '⭐⭐⭐⭐',
      speed: '⭐⭐⭐⭐⭐',
      cost: '0.01€/image'
    },
    {
      name: 'Midjourney (via API)',
      description: 'Style artistique unique',
      quality: '⭐⭐⭐⭐⭐',
      speed: '⭐⭐⭐',
      cost: '0.06€/image'
    }
  ], []);

  const recommendations = useMemo(() => [
    { model: 'DALL-E 3', use: 'Photos réalistes, portraits, produits' },
    { model: 'Stable Diffusion', use: 'Illustrations, patterns, textures' },
    { model: 'Midjourney', use: 'Art conceptuel, designs créatifs' }
  ], []);

  return (
    <DocPageTemplate
      title="Modèles IA disponibles"
      description="Choisissez le modèle IA adapté à vos besoins de création"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'AI', href: '/help/documentation/ai' },
        { label: 'Modèles', href: '/help/documentation/ai/models' }
      ]}
      relatedLinks={[
        { title: 'Getting Started', href: '/help/documentation/ai/getting-started', description: 'Guide de démarrage' },
        { title: 'Prompts', href: '/help/documentation/ai/prompts', description: 'Guide des prompts' }
      ]}
    >
      <div className="space-y-6 mb-8">
        {models.map((model, index) => (
          <Card key={index} className="bg-gray-800/50 border-gray-700 p-6">
            <h3 className="text-2xl font-bold mb-3">{model.name}</h3>
            <p className="text-gray-400 mb-4">{model.description}</p>
            <div className="space-y-2 text-sm">
              <div className="flex flex-col sm:flex-row justify-between gap-3 p-2 bg-gray-900 rounded">
                <span className="text-gray-300">Qualité:</span>
                <span className="text-green-400">{model.quality}</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between gap-3 p-2 bg-gray-900 rounded">
                <span className="text-gray-300">Vitesse:</span>
                <span className="text-yellow-400">{model.speed}</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between gap-3 p-2 bg-gray-900 rounded">
                <span className="text-gray-300">Coût:</span>
                <span className="text-gray-400">{model.cost}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-900/20 border-blue-500/30 p-6">
        <h3 className="text-xl font-bold mb-3">Choisir le bon modèle</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          {recommendations.map((rec, index) => (
            <li key={index}>
              • <strong>{rec.model}:</strong> {rec.use}
            </li>
          ))}
        </ul>
      </Card>
    </DocPageTemplate>
  );
}

const AIModelsPageMemo = memo(AIModelsPageContent);

export default function AIModelsPage() {
  return (
    <ErrorBoundary componentName="AIModelsPage">
      <AIModelsPageMemo />
    </ErrorBoundary>
  );
}
