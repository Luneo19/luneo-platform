'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Copy, Bot } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function DeployFirstAgentPageContent() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const step1Code = useMemo(() => `const response = await fetch('https://api.luneo.app/api/v1/agents', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "Assistant Support",
    model: "gpt-4",
    temperature: 0.3,
    system_prompt: \`Tu es l'assistant support de [Entreprise].
Réponds de manière professionnelle et concise.
Si tu ne connais pas la réponse, redirige vers support@entreprise.fr.
Langue : français uniquement.\`,
    max_tokens: 1024
  })
});

const agent = await response.json();`, []);

  const step2Code = useMemo(() => `const kb = await fetch('https://api.luneo.app/api/v1/knowledge-bases', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "FAQ & Documentation",
    embedding_model: "text-embedding-3-large"
  })
});

const { id: kbId } = await kb.json();

const formData = new FormData();
formData.append('file', faqDocument);

await fetch(\`https://api.luneo.app/api/v1/knowledge-bases/\${kbId}/documents\`, {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' },
  body: formData
});`, []);

  const step3Code = useMemo(() => `await fetch(\`https://api.luneo.app/api/v1/agents/\${agent.id}/config\`, {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    knowledge_base_id: kbId
  })
});`, []);

  const step4Code = useMemo(() => `<!-- Collez avant </body> sur votre site -->
<script
  src="https://cdn.luneo.app/widget/v1/chat.js"
  data-agent-id="${'${agent.id}'}"
  data-theme="light"
  data-primary-color="#8B5CF6"
  data-locale="fr"
  async>
</script>`, []);

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div className="relative">
      <pre className="bg-black/40 border border-white/[0.06] rounded-lg p-4 overflow-x-auto text-sm text-white/70 font-mono">
        {code}
      </pre>
      <button
        onClick={() => copyCode(code, id)}
        className="absolute top-3 right-3 p-2 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg border border-white/[0.06]"
      >
        {copied === id ? (
          <CheckCircle className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 text-white/40" />
        )}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-4">
            ← Documentation
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">Déployez votre premier agent</h1>
          <p className="text-xl text-white/50">Créez et déployez un agent IA conversationnel en 15 minutes</p>
        </div>

        <Card className="p-6 bg-white/[0.02] border-white/[0.06] mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full text-white text-sm mr-3">1</span>
            Créer l'agent
          </h2>
          <p className="text-white/60 mb-4">
            Créez un agent en définissant son modèle, sa personnalité et ses paramètres.
            Le system prompt est la clé : il détermine le comportement de votre agent.
          </p>
          <CodeBlock code={step1Code} id="step1" />
        </Card>

        <Card className="p-6 bg-white/[0.02] border-white/[0.06] mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-500 rounded-full text-white text-sm mr-3">2</span>
            Alimenter la base de connaissances
          </h2>
          <p className="text-white/60 mb-4">
            Créez une base de connaissances et importez vos documents (FAQ, documentation, guides).
            L'agent utilisera ces données pour répondre avec précision grâce au RAG.
          </p>
          <CodeBlock code={step2Code} id="step2" />
        </Card>

        <Card className="p-6 bg-white/[0.02] border-white/[0.06] mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-green-500 rounded-full text-white text-sm mr-3">3</span>
            Connecter agent + base de connaissances
          </h2>
          <p className="text-white/60 mb-4">
            Liez la base de connaissances à votre agent pour activer le RAG.
          </p>
          <CodeBlock code={step3Code} id="step3" />
        </Card>

        <Card className="p-6 bg-white/[0.02] border-white/[0.06] mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-orange-500 rounded-full text-white text-sm mr-3">4</span>
            Déployer le widget chat
          </h2>
          <p className="text-white/60 mb-4">
            Ajoutez le widget sur votre site. Il est opérationnel immédiatement.
          </p>
          <CodeBlock code={step4Code} id="step4" />
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-400/30 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Bot className="w-6 h-6 text-green-400" />
            Votre agent est en ligne !
          </h2>
          <p className="text-white/60 mb-4">Votre agent conversationnel est maintenant déployé. Il peut :</p>
          <ul className="space-y-2 text-white/60">
            <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> Répondre aux questions de vos visiteurs 24/7</li>
            <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> S'appuyer sur votre documentation via le RAG</li>
            <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> Collecter les emails des prospects</li>
            <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> Escalader vers un humain si nécessaire</li>
          </ul>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-400/30">
          <h2 className="text-2xl font-bold text-white mb-4">Aller plus loin</h2>
          <div className="space-y-3">
            <Link href="/help/documentation/ai/generation">
              <div className="flex items-center justify-between p-4 bg-white/[0.04] rounded-lg hover:bg-white/[0.06]">
                <span className="text-white font-medium">Configuration avancée des modèles</span>
                <ArrowRight className="w-5 h-5 text-white/40" />
              </div>
            </Link>
            <Link href="/help/documentation/ai/bulk-generation">
              <div className="flex items-center justify-between p-4 bg-white/[0.04] rounded-lg hover:bg-white/[0.06]">
                <span className="text-white font-medium">Optimiser vos bases de connaissances</span>
                <ArrowRight className="w-5 h-5 text-white/40" />
              </div>
            </Link>
            <Link href="/help/documentation/examples">
              <div className="flex items-center justify-between p-4 bg-white/[0.04] rounded-lg hover:bg-white/[0.06]">
                <span className="text-white font-medium">Exemples de configurations</span>
                <ArrowRight className="w-5 h-5 text-white/40" />
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

const DeployFirstAgentPageMemo = memo(DeployFirstAgentPageContent);

export default function DeployFirstAgentPage() {
  return (
    <ErrorBoundary componentName="DeployFirstAgentPage">
      <DeployFirstAgentPageMemo />
    </ErrorBoundary>
  );
}
