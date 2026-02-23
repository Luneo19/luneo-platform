'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Copy, CheckCircle } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function AIConfigurationPageContent() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const configExample = useMemo(() => `const response = await fetch('https://api.luneo.app/api/v1/agents', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "Assistant Commercial",
    model: "gpt-4",
    temperature: 0.7,
    system_prompt: "Tu es un assistant commercial expert...",
    max_tokens: 2048,
    knowledge_base_id: "kb_abc123"
  })
});

const agent = await response.json();`, []);

  const modelsExample = useMemo(() => `const response = await fetch('https://api.luneo.app/api/v1/agents/agent_id/config', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: "claude-3-sonnet",
    temperature: 0.3,
    response_style: "concise",
    language: "fr",
    fallback_model: "mistral-large"
  })
});`, []);

  const models = useMemo(() => [
    { name: 'GPT-4', provider: 'OpenAI', description: 'Raisonnement avancé, idéal pour les tâches complexes' },
    { name: 'GPT-4 Turbo', provider: 'OpenAI', description: 'Plus rapide, contexte étendu (128k tokens)' },
    { name: 'Claude 3 Sonnet', provider: 'Anthropic', description: 'Équilibre performance/coût, excellent en français' },
    { name: 'Claude 3 Opus', provider: 'Anthropic', description: 'Performances maximales, analyse approfondie' },
    { name: 'Mistral Large', provider: 'Mistral AI', description: 'Modèle européen, souveraineté des données' },
  ], []);

  const parameters = useMemo(() => [
    { param: 'temperature', range: '0.0 - 1.0', desc: 'Contrôle la créativité. 0.1 pour des réponses factuelles, 0.8 pour des réponses créatives.' },
    { param: 'max_tokens', range: '256 - 8192', desc: 'Longueur maximale de la réponse générée par l\'agent.' },
    { param: 'system_prompt', range: 'texte', desc: 'Instructions de comportement et personnalité de l\'agent.' },
    { param: 'response_style', range: 'concise | detailed | conversational', desc: 'Style de réponse par défaut de l\'agent.' },
  ], []);

  return (
    <DocPageTemplate
      title="Configuration IA"
      description="Configurez les modèles d'IA, paramètres et comportements de vos agents conversationnels"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'IA', href: '/help/documentation/ai' },
        { label: 'Configuration IA', href: '/help/documentation/ai/generation' }
      ]}
      relatedLinks={[
        { title: 'Premiers pas', href: '/help/documentation/ai/getting-started', description: 'Introduction à l\'IA Luneo' },
        { title: 'Bases de connaissances', href: '/help/documentation/ai/bulk-generation', description: 'RAG et bases vectorielles' }
      ]}
    >
      <Card className="bg-white/[0.02] border-white/[0.06] p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-3">Modèles disponibles</h2>
        <p className="text-white/60 mb-5">Choisissez le modèle adapté à votre cas d'usage. Vous pouvez changer de modèle à tout moment.</p>
        <div className="space-y-3">
          {models.map((model) => (
            <div key={model.name} className="flex items-start gap-4 p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white">{model.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-white/[0.06] text-white/50 rounded-full">{model.provider}</span>
                </div>
                <p className="text-sm text-white/50">{model.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-white/[0.02] border-white/[0.06] p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Créer un agent</h2>
          <button
            onClick={() => copyCode(configExample, 'config')}
            className="p-2 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg border border-white/[0.06]"
          >
            {copied === 'config' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-white/40" />
            )}
          </button>
        </div>
        <div className="bg-black/40 rounded-lg p-4">
          <pre className="text-sm text-white/70 overflow-x-auto">
            <code>{configExample}</code>
          </pre>
        </div>
      </Card>

      <Card className="bg-white/[0.02] border-white/[0.06] p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Modifier la configuration</h2>
          <button
            onClick={() => copyCode(modelsExample, 'models')}
            className="p-2 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg border border-white/[0.06]"
          >
            {copied === 'models' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-white/40" />
            )}
          </button>
        </div>
        <div className="bg-black/40 rounded-lg p-4">
          <pre className="text-sm text-white/70 overflow-x-auto">
            <code>{modelsExample}</code>
          </pre>
        </div>
      </Card>

      <Card className="bg-white/[0.02] border-white/[0.06] p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Paramètres clés</h2>
        <div className="space-y-4">
          {parameters.map((p) => (
            <div key={p.param} className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
              <div className="flex items-center gap-3 mb-1">
                <code className="text-purple-400 font-mono text-sm">{p.param}</code>
                <span className="text-xs text-white/40">{p.range}</span>
              </div>
              <p className="text-sm text-white/50">{p.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-purple-500/10 border-purple-500/20 p-6">
        <h3 className="text-xl font-bold text-white mb-3">Bonnes pratiques</h3>
        <ul className="space-y-2 text-sm text-white/60">
          <li>• Commencez avec une temperature basse (0.2-0.4) pour les agents de support client</li>
          <li>• Rédigez un system prompt détaillé avec le ton, les limites et le contexte métier</li>
          <li>• Utilisez un fallback_model pour garantir la disponibilité</li>
          <li>• Testez avec le playground avant de déployer en production</li>
          <li>• Connectez une base de connaissances pour des réponses contextualisées (RAG)</li>
        </ul>
      </Card>
    </DocPageTemplate>
  );
}

const AIConfigurationPageMemo = memo(AIConfigurationPageContent);

export default function AIConfigurationPage() {
  return (
    <ErrorBoundary componentName="AIConfigurationPage">
      <AIConfigurationPageMemo />
    </ErrorBoundary>
  );
}
