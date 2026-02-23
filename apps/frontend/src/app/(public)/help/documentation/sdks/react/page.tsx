'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function ReactSDKPage() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const installCode = `npm install @luneo/widget`;

  const widgetExample = `import { LuneoWidget } from '@luneo/widget/react';

function App() {
  return (
    <LuneoWidget
      agentId="agent_xxx"
      position="bottom-right"
      theme="dark"
      primaryColor="#6366f1"
      welcomeMessage="Bonjour ! Comment puis-je vous aider ?"
      user={{ id: 'user_123', name: 'Jean Dupont' }}
      onMessage={(msg) => console.log('Nouveau message:', msg)}
    />
  );
}`;

  const hooksExample = `import { useLuneo, useLuneoChat } from '@luneo/widget/react';

function SupportButton() {
  const { open, close, isOpen, toggle } = useLuneo();

  return (
    <button onClick={toggle}>
      {isOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
    </button>
  );
}

function ChatStatus() {
  const { messages, sendMessage, isTyping, conversationId } = useLuneoChat();

  const handleSend = () => {
    sendMessage('Bonjour, j\\'ai besoin d\\'aide.');
  };

  return (
    <div>
      <p>{messages.length} messages</p>
      {isTyping && <p>L&apos;agent est en train d&apos;écrire...</p>}
      <button onClick={handleSend}>Envoyer</button>
    </div>
  );
}`;

  const providerExample = `import { LuneoProvider, LuneoWidget } from '@luneo/widget/react';

function App() {
  return (
    <LuneoProvider
      apiKey="pk_live_xxx"
      config={{
        theme: 'dark',
        locale: 'fr',
        analytics: true,
      }}
    >
      <MainLayout />
      <LuneoWidget agentId="agent_xxx" />
    </LuneoProvider>
  );
}`;

  const eventsExample = `import { LuneoWidget } from '@luneo/widget/react';
import type { LuneoMessage, LuneoEvent } from '@luneo/widget/react';

function App() {
  const handleMessage = (message: LuneoMessage) => {
    console.log('Message reçu:', message.content);
    console.log('Rôle:', message.role);
  };

  const handleEvent = (event: LuneoEvent) => {
    switch (event.type) {
      case 'conversation:started':
        console.log('Nouvelle conversation:', event.conversationId);
        break;
      case 'agent:thinking':
        console.log('Agent en réflexion...');
        break;
      case 'feedback:submitted':
        console.log('Feedback:', event.rating);
        break;
    }
  };

  return (
    <LuneoWidget
      agentId="agent_xxx"
      onMessage={handleMessage}
      onEvent={handleEvent}
      onOpen={() => console.log('Widget ouvert')}
      onClose={() => console.log('Widget fermé')}
      onError={(err) => console.error('Erreur:', err)}
    />
  );
}`;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-4">
          ← Documentation
        </Link>
        <h1 className="text-4xl font-bold text-white mb-4">React SDK</h1>
        <p className="text-xl text-gray-400">
          Guide complet du SDK React pour le widget de chat Luneo : composants, hooks et API.
        </p>
      </div>

      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Installation</h2>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 font-mono overflow-x-auto">
            {installCode}
          </pre>
          <button onClick={() => copyCode(installCode, 'install')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'install' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Composant LuneoWidget</h2>
        <p className="text-gray-400 mb-4">
          Le composant principal pour afficher le widget de chat dans votre application.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {widgetExample}
          </pre>
          <button onClick={() => copyCode(widgetExample, 'widget')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'widget' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Hooks</h2>
        <p className="text-gray-400 mb-4">
          Utilisez <code className="text-blue-400">useLuneo</code> pour contrôler le widget et{' '}
          <code className="text-blue-400">useLuneoChat</code> pour accéder aux messages et à la conversation.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {hooksExample}
          </pre>
          <button onClick={() => copyCode(hooksExample, 'hooks')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'hooks' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">LuneoProvider</h2>
        <p className="text-gray-400 mb-4">
          Enveloppez votre application avec le provider pour une configuration globale.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {providerExample}
          </pre>
          <button onClick={() => copyCode(providerExample, 'provider')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'provider' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700">
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
    </div>
  );
}
