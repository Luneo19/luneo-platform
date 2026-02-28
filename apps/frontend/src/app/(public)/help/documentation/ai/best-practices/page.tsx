'use client';

import React, { memo, useMemo } from 'react';
import { Lightbulb, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function AIBestPracticesPageContent() {
  const effectivePrompts = useMemo(() => [
    'Soyez spécifique et descriptif',
    'Mentionnez le style souhaité',
    'Indiquez les couleurs principales',
    'Précisez le contexte d\'utilisation'
  ], []);

  const goodPrompt = useMemo(() => 
    '"Modern minimalist logo for tech startup, blue and purple gradient, clean geometric shapes, professional, vector style"',
    []
  );

  const badPrompt = useMemo(() => '"logo"', []);

  const tips = useMemo(() => [
    'Utilisez des adjectifs précis (minimalist, vibrant, elegant)',
    'Spécifiez le format (vector, raster, 3D)',
    'Mentionnez la palette de couleurs',
    'Ajoutez le contexte d\'usage (web, print, mobile)',
    'Testez plusieurs variations'
  ], []);

  return (
    <DocPageTemplate
      title="AI Best Practices"
      description="Optimisez vos prompts pour des résultats exceptionnels"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'AI', href: '/help/documentation/ai' },
        { label: 'Best Practices', href: '/help/documentation/ai/best-practices' }
      ]}
      relatedLinks={[
        { title: 'Prompts', href: '/help/documentation/ai/prompts', description: 'Guide des prompts' },
        { title: 'Generation', href: '/help/documentation/ai/generation', description: 'Génération' }
      ]}
    >
      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-yellow-400" />
          Prompts Efficaces
        </h2>
        <div className="space-y-3 text-gray-300">
          {effectivePrompts.map((prompt, index) => (
            <div key={index} className="flex gap-2 items-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>{prompt}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-6 mb-8">
        <Card className="p-6 bg-green-900/20 border-green-500/30">
          <h3 className="text-white font-bold mb-2">✅ Bon Prompt:</h3>
          <p className="text-gray-300 text-sm mb-2">{goodPrompt}</p>
          <p className="text-xs text-green-400">Résultat: Design professionnel, exploitable immédiatement</p>
        </Card>

        <Card className="p-6 bg-red-900/20 border-red-500/30">
          <h3 className="text-white font-bold mb-2">❌ Mauvais Prompt:</h3>
          <p className="text-gray-300 text-sm mb-2">"{badPrompt}"</p>
          <p className="text-xs text-red-400">Résultat: Trop vague, résultats imprévisibles</p>
        </Card>
      </div>

      <Card className="p-6 bg-blue-900/20 border-blue-500/30">
        <h3 className="text-xl font-bold mb-3 text-blue-400">💡 Conseils avancés</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          {tips.map((tip, index) => (
            <li key={index}>• {tip}</li>
          ))}
        </ul>
      </Card>
    </DocPageTemplate>
  );
}

const AIBestPracticesPageMemo = memo(AIBestPracticesPageContent);

export default function AIBestPracticesPage() {
  return (
    <ErrorBoundary componentName="AIBestPracticesPage">
      <AIBestPracticesPageMemo />
    </ErrorBoundary>
  );
}
