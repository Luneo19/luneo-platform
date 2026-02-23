'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function JavaScriptSDKPage() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const scriptExample = `<!-- Ajoutez ce script avant la fermeture de </body> -->
<script src="https://widget.luneo.app/v1/luneo.js"></script>
<script>
  Luneo.init({
    agentId: 'agent_xxx',
    position: 'bottom-right',
    theme: 'dark',
  });
</script>`;

  const npmExample = `npm install @luneo/widget
# ou
pnpm add @luneo/widget
# ou
yarn add @luneo/widget`;

  const initExample = `import Luneo from '@luneo/widget';

Luneo.init({
  agentId: 'agent_xxx',
  position: 'bottom-right',
  theme: 'dark',
  primaryColor: '#6366f1',
  welcomeMessage: 'Bonjour ! Comment puis-je vous aider ?',
  placeholder: 'Écrivez votre message...',
  user: {
    id: 'user_123',
    name: 'Jean Dupont',
    email: 'jean@example.com',
  },
});`;

  const apiExample = `// Ouvrir / fermer le widget
Luneo.open();
Luneo.close();
Luneo.toggle();

// Envoyer un message programmatiquement
Luneo.sendMessage('Bonjour, j\\'ai besoin d\\'aide.');

// Mettre à jour l'utilisateur connecté
Luneo.identify({
  id: 'user_456',
  name: 'Marie Martin',
  email: 'marie@example.com',
  plan: 'pro',
});

// Passer du contexte à l'agent
Luneo.setContext({
  page: 'checkout',
  cartTotal: 149.99,
  locale: 'fr',
});

// Réinitialiser la conversation
Luneo.reset();

// Détruire le widget
Luneo.destroy();`;

  const eventsExample = `// Écouter les événements du widget
Luneo.on('open', () => {
  console.log('Widget ouvert');
});

Luneo.on('close', () => {
  console.log('Widget fermé');
});

Luneo.on('message', (message) => {
  console.log('Nouveau message:', message.content);
  console.log('Rôle:', message.role); // 'user' | 'assistant'
});

Luneo.on('conversation:started', (data) => {
  console.log('Conversation démarrée:', data.conversationId);
});

Luneo.on('error', (error) => {
  console.error('Erreur widget:', error);
});

// Retirer un listener
const handler = () => console.log('ouvert');
Luneo.on('open', handler);
Luneo.off('open', handler);`;

  const customExample = `Luneo.init({
  agentId: 'agent_xxx',
  theme: 'dark',
  primaryColor: '#6366f1',
  position: 'bottom-right',
  offset: { x: 20, y: 20 },
  width: 400,
  height: 600,
  zIndex: 99999,
  showBranding: false,
  avatarUrl: 'https://example.com/avatar.png',
  css: \`
    .luneo-widget { border-radius: 16px; }
    .luneo-header { background: #1e1b4b; }
  \`,
});`;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-4">
          ← Documentation
        </Link>
        <h1 className="text-4xl font-bold text-white mb-4">JavaScript SDK</h1>
        <p className="text-xl text-gray-400">
          Intégrez le widget de chat Luneo sur n&apos;importe quel site web avec du JavaScript vanilla.
        </p>
      </div>

      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Intégration via script</h2>
        <p className="text-gray-400 mb-4">
          La méthode la plus simple : ajoutez le script directement dans votre HTML.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {scriptExample}
          </pre>
          <button onClick={() => copyCode(scriptExample, 'script')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'script' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Installation via npm</h2>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {npmExample}
          </pre>
          <button onClick={() => copyCode(npmExample, 'npm')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'npm' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Initialisation</h2>
        <p className="text-gray-400 mb-4">
          Configurez le widget avec toutes les options disponibles.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {initExample}
          </pre>
          <button onClick={() => copyCode(initExample, 'init')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'init' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">API JavaScript</h2>
        <p className="text-gray-400 mb-4">
          Contrôlez le widget programmatiquement après l&apos;initialisation.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {apiExample}
          </pre>
          <button onClick={() => copyCode(apiExample, 'api')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'api' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Événements</h2>
        <p className="text-gray-400 mb-4">
          Écoutez les événements du widget pour réagir aux interactions.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {eventsExample}
          </pre>
          <button onClick={() => copyCode(eventsExample, 'events')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'events' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Personnalisation avancée</h2>
        <p className="text-gray-400 mb-4">
          Personnalisez l&apos;apparence du widget avec des options CSS et de layout.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {customExample}
          </pre>
          <button onClick={() => copyCode(customExample, 'custom')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'custom' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>
    </div>
  );
}
