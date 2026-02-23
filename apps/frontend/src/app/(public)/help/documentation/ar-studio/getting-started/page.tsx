'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function WidgetChatPageContent() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const embedScript = useMemo(() => `<!-- Ajoutez avant la fermeture de </body> -->
<script
  src="https://cdn.luneo.app/widget/v1/chat.js"
  data-agent-id="agent_abc123"
  data-theme="dark"
  data-position="bottom-right"
  data-primary-color="#8B5CF6"
  data-locale="fr"
  async>
</script>`, []);

  const reactExample = useMemo(() => `import { LuneoChatWidget } from '@luneo/react';

export default function Layout({ children }) {
  return (
    <>
      {children}
      <LuneoChatWidget
        agentId="agent_abc123"
        theme="dark"
        position="bottom-right"
        primaryColor="#8B5CF6"
        locale="fr"
        welcomeMessage="Bonjour ! Comment puis-je vous aider ?"
        placeholder="Écrivez votre message..."
      />
    </>
  );
}`, []);

  const configExample = useMemo(() => `const response = await fetch('https://api.luneo.app/api/v1/widgets', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    agent_id: "agent_abc123",
    name: "Widget Support",
    config: {
      theme: "dark",
      position: "bottom-right",
      primary_color: "#8B5CF6",
      welcome_message: "Bonjour ! Comment puis-je vous aider ?",
      allowed_domains: ["monsite.fr", "app.monsite.fr"],
      collect_email: true,
      show_sources: true
    }
  })
});

const widget = await response.json();`, []);

  const customizations = useMemo(() => [
    { param: 'theme', values: 'light | dark | auto', desc: 'Thème du widget, auto suit les préférences système' },
    { param: 'position', values: 'bottom-right | bottom-left', desc: 'Position du bouton de chat sur la page' },
    { param: 'primary_color', values: 'hex color', desc: 'Couleur principale du widget (bouton, liens, bulles)' },
    { param: 'welcome_message', values: 'string', desc: 'Message d\'accueil affiché à l\'ouverture du chat' },
    { param: 'collect_email', values: 'boolean', desc: 'Demander l\'email du visiteur avant la conversation' },
    { param: 'show_sources', values: 'boolean', desc: 'Afficher les sources RAG utilisées dans les réponses' },
    { param: 'allowed_domains', values: 'string[]', desc: 'Domaines autorisés à charger le widget' },
  ], []);

  return (
    <DocPageTemplate
      title="Widget Chat"
      description="Intégrez un agent conversationnel sur votre site en quelques minutes avec le widget chat Luneo"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Widget Chat', href: '/help/documentation/ar-studio' },
        { label: 'Premiers pas', href: '/help/documentation/ar-studio/getting-started' }
      ]}
      relatedLinks={[
        { title: 'Configuration IA', href: '/help/documentation/ai/generation', description: 'Configurer les modèles' },
        { title: 'Déployer un agent', href: '/help/documentation/quickstart/first-customizer', description: 'Guide pas à pas' }
      ]}
    >
      <Card className="bg-white/[0.02] border-white/[0.06] p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-3">Installation rapide</h2>
        <p className="text-white/60 mb-4">
          Le widget chat Luneo s'intègre sur n'importe quel site web avec une seule ligne de script.
          Il se connecte automatiquement à votre agent IA et gère les conversations en temps réel.
        </p>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Script HTML</h3>
          <button
            onClick={() => copyCode(embedScript, 'embed')}
            className="p-2 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg border border-white/[0.06]"
          >
            {copied === 'embed' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-white/40" />
            )}
          </button>
        </div>
        <div className="bg-black/40 rounded-lg p-4">
          <pre className="text-sm text-white/70 overflow-x-auto">
            <code>{embedScript}</code>
          </pre>
        </div>
      </Card>

      <Card className="bg-white/[0.02] border-white/[0.06] p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Composant React</h2>
          <button
            onClick={() => copyCode(reactExample, 'react')}
            className="p-2 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg border border-white/[0.06]"
          >
            {copied === 'react' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-white/40" />
            )}
          </button>
        </div>
        <p className="text-white/60 mb-4">Si vous utilisez React ou Next.js, préférez le composant dédié :</p>
        <div className="bg-black/40 rounded-lg p-4">
          <pre className="text-sm text-white/70 overflow-x-auto">
            <code>{reactExample}</code>
          </pre>
        </div>
      </Card>

      <Card className="bg-white/[0.02] border-white/[0.06] p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Personnalisation</h2>
        <div className="space-y-3">
          {customizations.map((c) => (
            <div key={c.param} className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg">
              <div className="flex items-center gap-3 mb-1">
                <code className="text-purple-400 font-mono text-sm">{c.param}</code>
                <span className="text-xs text-white/40">{c.values}</span>
              </div>
              <p className="text-sm text-white/50">{c.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-white/[0.02] border-white/[0.06] p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Configuration via API</h2>
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

      <Card className="bg-blue-500/10 border-blue-500/20 p-6">
        <h3 className="text-xl font-bold text-white mb-3">Déploiement</h3>
        <ul className="space-y-2 text-sm text-white/60">
          <li>• Configurez les <code className="bg-white/[0.06] px-1.5 py-0.5 rounded text-purple-400">allowed_domains</code> pour sécuriser l'accès</li>
          <li>• Testez le widget en mode preview depuis le dashboard avant de publier</li>
          <li>• Activez la collecte d'emails pour identifier les visiteurs et les retrouver dans le CRM</li>
          <li>• Utilisez <code className="bg-white/[0.06] px-1.5 py-0.5 rounded text-purple-400">show_sources: true</code> pour renforcer la confiance avec les sources RAG</li>
          <li>• Le widget est responsive et s'adapte automatiquement aux écrans mobiles</li>
        </ul>
      </Card>
    </DocPageTemplate>
  );
}

const WidgetChatPageMemo = memo(WidgetChatPageContent);

export default function WidgetChatPage() {
  return (
    <ErrorBoundary componentName="WidgetChatPage">
      <WidgetChatPageMemo />
    </ErrorBoundary>
  );
}
