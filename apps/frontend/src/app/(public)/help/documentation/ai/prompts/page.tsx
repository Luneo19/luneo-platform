'use client';

import React, { memo, useMemo } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function AIPromptsPageContent() {
  const promptStructure = useMemo(() => '[Sujet] + [Style] + [Détails] + [Couleurs] + [Ambiance]', []);

  const examples = useMemo(() => [
    {
      category: 'T-shirts',
      prompt: 'Un dragon cyberpunk néon, style illustration vectorielle, couleurs violet et cyan électrique, fond noir, design centré'
    },
    {
      category: 'Mugs',
      prompt: 'Pattern floral minimaliste, style scandinave, couleurs pastel rose et vert menthe, répétition seamless'
    },
    {
      category: 'Posters',
      prompt: 'Paysage montagneux au coucher du soleil, style art déco, palette orange et violet, composition verticale'
    }
  ], []);

  return (
    <DocPageTemplate
      title="Guide des Prompts IA"
      description="Écrivez des prompts efficaces pour générer des designs exceptionnels"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'AI', href: '/help/documentation/ai' },
        { label: 'Prompts', href: '/help/documentation/ai/prompts' }
      ]}
      relatedLinks={[
        { title: 'Getting Started', href: '/help/documentation/ai/getting-started', description: 'Guide de démarrage' },
        { title: 'Best Practices', href: '/help/documentation/ai/best-practices', description: 'Bonnes pratiques' }
      ]}
    >
      <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Structure d'un bon prompt</h2>
        <div className="bg-gray-900 rounded-lg p-4">
          <code className="text-sm text-green-400">{promptStructure}</code>
        </div>
      </Card>

      <div className="space-y-6 mb-8">
        <Card className="bg-gray-800/50 border-gray-700 p-6">
          <h3 className="text-xl font-bold mb-3">✅ Bon prompt</h3>
          <div className="bg-green-900/20 border border-green-500/30 rounded p-4">
            <p className="text-green-300">
              "Un lion majestueux en style aquarelle, couleurs chaudes orange et or, ambiance puissante et élégante, fond blanc minimaliste"
            </p>
          </div>
          <p className="text-sm text-gray-400 mt-3">Résultat: Design professionnel exploitable</p>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 p-6">
          <h3 className="text-xl font-bold mb-3">❌ Prompt trop vague</h3>
          <div className="bg-red-900/20 border border-red-500/30 rounded p-4">
            <p className="text-red-300">"Un lion"</p>
          </div>
          <p className="text-sm text-gray-400 mt-3">Résultat: Trop générique, imprévisible</p>
        </Card>
      </div>

      <Card className="bg-purple-900/20 border-purple-500/30 p-6">
        <h2 className="text-2xl font-bold mb-4">Exemples de prompts par catégorie</h2>
        <div className="space-y-4">
          {examples.map((example, index) => (
            <div key={index}>
              <h4 className="font-bold mb-2 text-white">{example.category}</h4>
              <p className="text-sm text-gray-400">"{example.prompt}"</p>
            </div>
          ))}
        </div>
      </Card>
    </DocPageTemplate>
  );
}

const AIPromptsPageMemo = memo(AIPromptsPageContent);

export default function AIPromptsPage() {
  return (
    <ErrorBoundary componentName="AIPromptsPage">
      <AIPromptsPageMemo />
    </ErrorBoundary>
  );
}
