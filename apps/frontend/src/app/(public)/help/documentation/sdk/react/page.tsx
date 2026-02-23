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

  const basicExample = `import { LuneoWidget } from '@luneo/widget/react';

export default function App() {
  return (
    <div>
      <h1>Mon Site</h1>
      <LuneoWidget agentId="agent_xxx" />
    </div>
  );
}`;

  const propsExample = `import { LuneoWidget } from '@luneo/widget/react';

export default function SupportPage() {
  return (
    <LuneoWidget
      agentId="agent_xxx"
      position="bottom-right"
      theme="dark"
      primaryColor="#6366f1"
      welcomeMessage="Bonjour ! Comment puis-je vous aider ?"
      placeholder="Écrivez votre message..."
      user={{
        id: "user_123",
        name: "Jean Dupont",
        email: "jean@example.com",
      }}
      onMessage={(msg) => console.log('Message:', msg)}
      onOpen={() => console.log('Widget ouvert')}
      onClose={() => console.log('Widget fermé')}
    />
  );
}`;

  const contextExample = `import { LuneoWidget, LuneoProvider } from '@luneo/widget/react';

export default function App() {
  return (
    <LuneoProvider apiKey="pk_live_xxx">
      <Layout>
        <LuneoWidget
          agentId="agent_xxx"
          context={{ page: 'pricing', locale: 'fr' }}
        />
      </Layout>
    </LuneoProvider>
  );
}`;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-4">
          ← Documentation
        </Link>
        <h1 className="text-4xl font-bold text-white mb-4">Intégration React</h1>
        <p className="text-xl text-gray-400">
          Intégrez le widget de chat Luneo dans votre application React en quelques minutes.
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
        <h2 className="text-2xl font-bold text-white mb-4">Utilisation basique</h2>
        <p className="text-gray-400 mb-4">
          Ajoutez le composant <code className="text-blue-400">&lt;LuneoWidget&gt;</code> dans votre application
          avec l&apos;identifiant de votre agent IA.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {basicExample}
          </pre>
          <button onClick={() => copyCode(basicExample, 'basic')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'basic' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Propriétés du composant</h2>
        <p className="text-gray-400 mb-4">
          Personnalisez l&apos;apparence et le comportement du widget avec les props disponibles.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {propsExample}
          </pre>
          <button onClick={() => copyCode(propsExample, 'props')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'props' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Provider & Contexte</h2>
        <p className="text-gray-400 mb-4">
          Utilisez <code className="text-blue-400">LuneoProvider</code> pour partager la configuration
          entre plusieurs widgets ou passer du contexte à l&apos;agent.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {contextExample}
          </pre>
          <button onClick={() => copyCode(contextExample, 'context')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'context' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Props disponibles</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-3 pr-4 text-gray-300 font-semibold">Prop</th>
                <th className="py-3 pr-4 text-gray-300 font-semibold">Type</th>
                <th className="py-3 text-gray-300 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="text-gray-400">
              <tr className="border-b border-gray-700/50">
                <td className="py-3 pr-4 font-mono text-blue-400">agentId</td>
                <td className="py-3 pr-4 font-mono">string</td>
                <td className="py-3">Identifiant de l&apos;agent IA (requis)</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-3 pr-4 font-mono text-blue-400">position</td>
                <td className="py-3 pr-4 font-mono">{`'bottom-right' | 'bottom-left'`}</td>
                <td className="py-3">Position du widget sur la page</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-3 pr-4 font-mono text-blue-400">theme</td>
                <td className="py-3 pr-4 font-mono">{`'light' | 'dark' | 'auto'`}</td>
                <td className="py-3">Thème du widget</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-3 pr-4 font-mono text-blue-400">primaryColor</td>
                <td className="py-3 pr-4 font-mono">string</td>
                <td className="py-3">Couleur principale (hex)</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-3 pr-4 font-mono text-blue-400">user</td>
                <td className="py-3 pr-4 font-mono">{`{ id, name, email }`}</td>
                <td className="py-3">Informations utilisateur connecté</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono text-blue-400">context</td>
                <td className="py-3 pr-4 font-mono">object</td>
                <td className="py-3">Données contextuelles envoyées à l&apos;agent</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
