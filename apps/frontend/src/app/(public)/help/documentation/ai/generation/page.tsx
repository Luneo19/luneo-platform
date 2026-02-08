'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function AIGenerationPageContent() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const apiExample = useMemo(() => `const response = await fetch('/api/v1/ai/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: "Un t-shirt avec un lion majestueux en style aquarelle",
    style: "watercolor",
    size: "1024x1024",
    quantity: 4 // Générer 4 variations
  })
});

const { images } = await response.json();
// images: Array de 4 URLs d'images générées`, []);

  const styles = useMemo(() => [
    'realistic', 'artistic', 'cartoon', 'watercolor',
    'sketch', 'pop-art', 'minimalist', 'vintage', 'modern'
  ], []);

  const tips = useMemo(() => [
    'Soyez spécifique dans vos prompts',
    'Mentionnez le style artistique souhaité',
    'Indiquez les couleurs dominantes',
    'Ajoutez des détails sur l\'ambiance/mood',
    'Générez 4 variations pour avoir le choix'
  ], []);

  return (
    <DocPageTemplate
      title="Génération IA de designs"
      description="Utilisez DALL-E 3 et Stable Diffusion pour générer des designs professionnels"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'AI', href: '/help/documentation/ai' },
        { label: 'Génération', href: '/help/documentation/ai/generation' }
      ]}
      relatedLinks={[
        { title: 'Getting Started', href: '/help/documentation/ai/getting-started', description: 'Guide de démarrage' },
        { title: 'Prompts', href: '/help/documentation/ai/prompts', description: 'Guide des prompts' }
      ]}
    >
      <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Générer un design</h2>
          <button
            onClick={() => copyCode(apiExample, 'api')}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
          >
            {copied === 'api' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <pre className="text-sm text-gray-300 overflow-x-auto">
            <code>{apiExample}</code>
          </pre>
        </div>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Styles disponibles</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          {styles.map((style) => (
            <div key={style} className="p-3 bg-gray-900 rounded text-center">
              <code className="text-purple-400">{style}</code>
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-purple-900/20 border-purple-500/30 p-6">
        <h3 className="text-xl font-bold mb-3">💡 Tips pour de meilleurs résultats</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          {tips.map((tip, index) => (
            <li key={index}>• {tip}</li>
          ))}
        </ul>
      </Card>
    </DocPageTemplate>
  );
}

const AIGenerationPageMemo = memo(AIGenerationPageContent);

export default function AIGenerationPage() {
  return (
    <ErrorBoundary componentName="AIGenerationPage">
      <AIGenerationPageMemo />
    </ErrorBoundary>
  );
}
