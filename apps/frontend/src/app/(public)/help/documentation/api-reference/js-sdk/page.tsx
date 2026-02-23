'use client';

import React, { memo, useMemo, useCallback } from 'react';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';
import { Code, Copy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function WidgetSDKPageContent() {
  const [copied, setCopied] = React.useState<string | null>(null);

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const scriptTagCode = useMemo(() => `<!-- Ajoutez ce script avant la fermeture de </body> -->
<script
  src="https://cdn.luneo.app/widget.js"
  data-agent-id="agent_abc123"
  data-token="pk_live_xxxxxxxxxxxxxxxx"
  async
></script>`, []);

  const npmInstallCode = useMemo(() => `npm install @luneo/widget`, []);

  const npmUsageCode = useMemo(() => `import { LuneoWidget } from '@luneo/widget';

LuneoWidget.init({
  agentId: 'agent_abc123',
  token: 'pk_live_xxxxxxxxxxxxxxxx',
  theme: 'dark',
  language: 'fr',
  position: 'bottom-right',
  primaryColor: '#6366f1',
  welcomeMessage: 'Bonjour ! Comment puis-je vous aider ?',
  placeholder: 'Tapez votre message...',
  headerTitle: 'Support Luneo',
  autoOpen: false,
  collectEmail: true
});`, []);

  const eventsCode = useMemo(() => `import { LuneoWidget } from '@luneo/widget';

const widget = LuneoWidget.init({
  agentId: 'agent_abc123',
  token: 'pk_live_xxxxxxxxxxxxxxxx'
});

widget.on('ready', () => {
  // Le widget est initialisé et prêt
});

widget.on('open', () => {
  // L'utilisateur a ouvert le chat
});

widget.on('close', () => {
  // L'utilisateur a fermé le chat
});

widget.on('message:sent', (data) => {
  // Un message a été envoyé par l'utilisateur
  // data.content, data.conversationId
});

widget.on('message:received', (data) => {
  // L'agent a répondu
  // data.content, data.sources, data.conversationId
});

widget.on('conversation:started', (data) => {
  // Nouvelle conversation démarrée
  // data.conversationId
});

widget.on('satisfaction', (data) => {
  // L'utilisateur a donné un score de satisfaction
  // data.score (1-5), data.conversationId
});`, []);

  const apiMethodsCode = useMemo(() => `const widget = LuneoWidget.init({ ... });

widget.open();
widget.close();
widget.toggle();
widget.destroy();

widget.sendMessage('Bonjour, j\\'ai une question');

widget.setUser({
  id: 'user_123',
  name: 'Marie Dupont',
  email: 'marie@example.com',
  plan: 'pro'
});

widget.setMetadata({
  page: window.location.pathname,
  referrer: document.referrer,
  cartTotal: 89.99
});

widget.setLanguage('fr');
widget.setTheme('dark');`, []);

  const reactCode = useMemo(() => `import { LuneoChat } from '@luneo/widget/react';

export default function App() {
  return (
    <LuneoChat
      agentId="agent_abc123"
      token="pk_live_xxxxxxxxxxxxxxxx"
      theme="dark"
      language="fr"
      position="bottom-right"
      onMessage={(msg) => {
        // Traitement personnalisé des messages
      }}
    />
  );
}`, []);

  const configOptions = useMemo(() => [
    { option: 'agentId', type: 'string', required: true, description: 'Identifiant de l\'agent à utiliser' },
    { option: 'token', type: 'string', required: true, description: 'Clé publique (pk_live_xxx ou pk_test_xxx)' },
    { option: 'theme', type: '"light" | "dark" | "auto"', required: false, description: 'Thème du widget (défaut : "auto")' },
    { option: 'language', type: 'string', required: false, description: 'Langue du widget : fr, en, es, de (défaut : "fr")' },
    { option: 'position', type: '"bottom-right" | "bottom-left"', required: false, description: 'Position du bouton (défaut : "bottom-right")' },
    { option: 'primaryColor', type: 'string', required: false, description: 'Couleur principale en hex (défaut : "#6366f1")' },
    { option: 'welcomeMessage', type: 'string', required: false, description: 'Message d\'accueil de l\'agent' },
    { option: 'placeholder', type: 'string', required: false, description: 'Placeholder du champ de saisie' },
    { option: 'autoOpen', type: 'boolean', required: false, description: 'Ouvrir automatiquement après X secondes' },
    { option: 'collectEmail', type: 'boolean', required: false, description: 'Demander l\'email avant le premier message' },
  ], []);

  return (
    <DocPageTemplate
      title="Widget SDK"
      description="Intégrez le chat IA Luneo sur votre site web en quelques lignes de code"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'API Reference', href: '/help/documentation/api-reference' },
        { label: 'Widget SDK', href: '/help/documentation/api-reference/js-sdk' }
      ]}
      relatedLinks={[
        { title: 'Vue d\'ensemble des SDKs', href: '/help/documentation/api-reference/sdk', description: 'Tous les SDKs disponibles' },
        { title: 'Agents API', href: '/help/documentation/api-reference/designs', description: 'Créer et configurer vos agents' },
        { title: 'Conversations API', href: '/help/documentation/api-reference/orders', description: 'Gérer les conversations' }
      ]}
    >
      <h2 className="text-2xl font-bold mt-8 mb-4">Installation rapide (Script Tag)</h2>
      <p className="text-gray-300 mb-4">La méthode la plus simple pour intégrer le widget. Aucune dépendance nécessaire.</p>
      <Card className="bg-gray-800 border-gray-700 p-6 my-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-blue-400">HTML</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyCode(scriptTagCode, 'script')}
            className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied === 'script' ? 'Copié !' : 'Copier'}
          </Button>
        </div>
        <pre className="bg-gray-900 rounded p-4 overflow-x-auto">
          <code className="text-sm text-gray-300">{scriptTagCode}</code>
        </pre>
      </Card>

      <h2 className="text-2xl font-bold mt-10 mb-4">Installation NPM</h2>
      <p className="text-gray-300 mb-4">Pour les applications JavaScript/TypeScript modernes.</p>
      <Card className="bg-gray-800 border-gray-700 p-6 my-6">
        <pre className="bg-gray-900 rounded p-4 overflow-x-auto">
          <code className="text-sm text-green-400">{npmInstallCode}</code>
        </pre>
      </Card>

      <Card className="bg-gray-800 border-gray-700 p-6 my-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Code className="w-5 h-5 mr-2" />
            Initialisation
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyCode(npmUsageCode, 'npm')}
            className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied === 'npm' ? 'Copié !' : 'Copier'}
          </Button>
        </div>
        <pre className="bg-gray-900 rounded p-4 overflow-x-auto">
          <code className="text-sm text-gray-300">{npmUsageCode}</code>
        </pre>
      </Card>

      <h2 className="text-2xl font-bold mt-10 mb-4">Options de configuration</h2>
      <div className="overflow-x-auto my-6">
        <table className="w-full text-sm text-left">
          <thead className="text-gray-400 border-b border-gray-700">
            <tr>
              <th className="py-2 pr-4">Option</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Requis</th>
              <th className="py-2">Description</th>
            </tr>
          </thead>
          <tbody className="text-gray-300">
            {configOptions.map((opt) => (
              <tr key={opt.option} className="border-b border-gray-800">
                <td className="py-2 pr-4 font-mono text-blue-400">{opt.option}</td>
                <td className="py-2 pr-4 font-mono text-xs">{opt.type}</td>
                <td className="py-2 pr-4">{opt.required ? '✓' : '—'}</td>
                <td className="py-2">{opt.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-2xl font-bold mt-10 mb-4">Événements</h2>
      <p className="text-gray-300 mb-4">Écoutez les événements du widget pour personnaliser l'expérience utilisateur.</p>
      <Card className="bg-gray-800 border-gray-700 p-6 my-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-yellow-400">JavaScript</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyCode(eventsCode, 'events')}
            className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied === 'events' ? 'Copié !' : 'Copier'}
          </Button>
        </div>
        <pre className="bg-gray-900 rounded p-4 overflow-x-auto">
          <code className="text-sm text-gray-300">{eventsCode}</code>
        </pre>
      </Card>

      <h2 className="text-2xl font-bold mt-10 mb-4">Méthodes de l'API</h2>
      <p className="text-gray-300 mb-4">Contrôlez le widget programmatiquement et enrichissez le contexte de l'agent.</p>
      <Card className="bg-gray-800 border-gray-700 p-6 my-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-yellow-400">JavaScript</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyCode(apiMethodsCode, 'api')}
            className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied === 'api' ? 'Copié !' : 'Copier'}
          </Button>
        </div>
        <pre className="bg-gray-900 rounded p-4 overflow-x-auto">
          <code className="text-sm text-gray-300">{apiMethodsCode}</code>
        </pre>
      </Card>

      <h2 className="text-2xl font-bold mt-10 mb-4">Composant React</h2>
      <p className="text-gray-300 mb-4">Le SDK fournit un composant React prêt à l'emploi.</p>
      <Card className="bg-gray-800 border-gray-700 p-6 my-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-cyan-400">React / TSX</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyCode(reactCode, 'react')}
            className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied === 'react' ? 'Copié !' : 'Copier'}
          </Button>
        </div>
        <pre className="bg-gray-900 rounded p-4 overflow-x-auto">
          <code className="text-sm text-gray-300">{reactCode}</code>
        </pre>
      </Card>

      <h2 className="text-2xl font-bold mt-10 mb-4">Compatibilité navigateurs</h2>
      <ul className="space-y-2 text-gray-300">
        <li>Chrome 80+, Firefox 78+, Safari 14+, Edge 80+</li>
        <li>Mobile : iOS Safari 14+, Chrome Android 80+</li>
        <li>Taille du bundle : ~18 Ko gzippé</li>
        <li>Aucune dépendance externe</li>
      </ul>
    </DocPageTemplate>
  );
}

const WidgetSDKPageMemo = memo(WidgetSDKPageContent);

export default function WidgetSDKPage() {
  return (
    <ErrorBoundary componentName="WidgetSDKPage">
      <WidgetSDKPageMemo />
    </ErrorBoundary>
  );
}
