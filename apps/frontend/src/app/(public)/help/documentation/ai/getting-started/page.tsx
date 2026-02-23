'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function AIGettingStartedPageContent() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const quickStartExample = useMemo(() => `const response = await fetch('https://api.luneo.app/api/v1/agents/agent_id/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "Quels sont vos horaires d'ouverture ?",
    conversation_id: "conv_xyz",
    stream: true
  })
});`, []);

  const capabilities = useMemo(() => [
    {
      title: 'Agents conversationnels',
      desc: 'Créez des agents IA capables de répondre à vos clients 24/7, en s\'appuyant sur vos données métier.',
      icon: '🤖',
    },
    {
      title: 'RAG (Retrieval Augmented Generation)',
      desc: 'Connectez vos documents, FAQ et sites web pour que l\'agent réponde avec des informations précises et à jour.',
      icon: '🔍',
    },
    {
      title: 'Multi-modèles',
      desc: 'Choisissez entre GPT-4, Claude 3 ou Mistral selon vos besoins de performance, coût et souveraineté.',
      icon: '⚡',
    },
    {
      title: 'Widget chat intégrable',
      desc: 'Déployez votre agent sur n\'importe quel site en quelques lignes de code avec le widget Luneo.',
      icon: '💬',
    },
  ], []);

  const steps = useMemo(() => [
    { step: '1', title: 'Créer un agent', desc: 'Depuis le dashboard, choisissez un modèle et définissez le system prompt.' },
    { step: '2', title: 'Ajouter une base de connaissances', desc: 'Importez vos documents ou crawlez votre site pour alimenter le RAG.' },
    { step: '3', title: 'Tester dans le playground', desc: 'Posez des questions et affinez le comportement avant de déployer.' },
    { step: '4', title: 'Déployer', desc: 'Intégrez le widget chat ou utilisez l\'API pour connecter l\'agent à vos canaux.' },
  ], []);

  return (
    <DocPageTemplate
      title="Premiers pas avec l'IA"
      description="Découvrez les capacités IA de Luneo : agents conversationnels, RAG et prompt engineering"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'IA', href: '/help/documentation/ai' },
        { label: 'Premiers pas', href: '/help/documentation/ai/getting-started' }
      ]}
      relatedLinks={[
        { title: 'Configuration IA', href: '/help/documentation/ai/generation', description: 'Configurer les modèles' },
        { title: 'Bases de connaissances', href: '/help/documentation/ai/bulk-generation', description: 'Créer une base RAG' }
      ]}
    >
      <Card className="bg-white/[0.02] border-white/[0.06] p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Capacités IA</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {capabilities.map((cap) => (
            <div key={cap.title} className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
              <div className="text-2xl mb-2">{cap.icon}</div>
              <h3 className="font-semibold text-white mb-1">{cap.title}</h3>
              <p className="text-sm text-white/50">{cap.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-white/[0.02] border-white/[0.06] p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">En 4 étapes</h2>
        <div className="space-y-4">
          {steps.map((s) => (
            <div key={s.step} className="flex gap-4 items-start">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-500 rounded-full text-white text-sm font-bold flex-shrink-0">
                {s.step}
              </span>
              <div>
                <h3 className="font-semibold text-white">{s.title}</h3>
                <p className="text-sm text-white/50">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-white/[0.02] border-white/[0.06] p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Votre première requête</h2>
          <button
            onClick={() => copyCode(quickStartExample, 'quick')}
            className="p-2 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg border border-white/[0.06]"
          >
            {copied === 'quick' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-white/40" />
            )}
          </button>
        </div>
        <div className="bg-black/40 rounded-lg p-4">
          <pre className="text-sm text-white/70 overflow-x-auto">
            <code>{quickStartExample}</code>
          </pre>
        </div>
      </Card>

      <Card className="bg-white/[0.02] border-white/[0.06] p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Choix du modèle</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-3 px-2 text-white/60 font-medium">Modèle</th>
                <th className="text-left py-3 px-2 text-white/60 font-medium">Idéal pour</th>
                <th className="text-left py-3 px-2 text-white/60 font-medium">Coût</th>
              </tr>
            </thead>
            <tbody className="text-white/50">
              <tr className="border-b border-white/[0.04]">
                <td className="py-3 px-2 text-white font-medium">GPT-4</td>
                <td className="py-3 px-2">Raisonnement complexe, analyse</td>
                <td className="py-3 px-2">€€€</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-3 px-2 text-white font-medium">Claude 3 Sonnet</td>
                <td className="py-3 px-2">Support client, contenu en français</td>
                <td className="py-3 px-2">€€</td>
              </tr>
              <tr className="border-b border-white/[0.04]">
                <td className="py-3 px-2 text-white font-medium">Mistral Large</td>
                <td className="py-3 px-2">Souveraineté européenne, multilangue</td>
                <td className="py-3 px-2">€€</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="bg-purple-500/10 border-purple-500/20 p-6">
        <h3 className="text-xl font-bold text-white mb-3">Prompt Engineering : les bases</h3>
        <ul className="space-y-2 text-sm text-white/60">
          <li>• Définissez clairement le rôle de l'agent dans le system prompt (ex: "Tu es un conseiller expert en...")</li>
          <li>• Précisez le ton et le style de réponse (formel, amical, technique)</li>
          <li>• Ajoutez des contraintes explicites (ne pas inventer, citer les sources, rester concis)</li>
          <li>• Incluez des exemples de questions/réponses attendues pour guider le comportement</li>
          <li>• Itérez : testez, analysez les conversations, puis affinez le prompt</li>
        </ul>
      </Card>
    </DocPageTemplate>
  );
}

const AIGettingStartedPageMemo = memo(AIGettingStartedPageContent);

export default function AIGettingStartedPage() {
  return (
    <ErrorBoundary componentName="AIGettingStartedPage">
      <AIGettingStartedPageMemo />
    </ErrorBoundary>
  );
}
