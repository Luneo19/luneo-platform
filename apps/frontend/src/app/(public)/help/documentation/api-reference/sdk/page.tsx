'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function SDKOverviewPageContent() {
  const sdks = useMemo(() => [
    {
      name: 'Widget JavaScript SDK',
      description: 'Intégrez le chat IA directement sur votre site web. Script tag ou module NPM.',
      install: 'npm install @luneo/widget',
      example: `import { LuneoWidget } from '@luneo/widget';

LuneoWidget.init({
  agentId: 'agent_abc123',
  token: 'pk_live_xxxxxxxxxxxxxxxx',
  theme: 'dark',
  language: 'fr',
  position: 'bottom-right'
});

// Ou via script tag :
// <script src="https://cdn.luneo.app/widget.js"
//   data-agent-id="agent_abc123"
//   data-token="pk_live_xxxxxxxxxxxxxxxx" async></script>`,
      docLink: '/help/documentation/api-reference/js-sdk',
      docLabel: 'Documentation complète du Widget SDK',
      badges: ['JavaScript', 'TypeScript', 'React', 'Vue', 'HTML']
    },
    {
      name: 'Client REST API',
      description: 'Client HTTP pour interagir avec l\'API Luneo depuis votre backend ou vos scripts.',
      install: 'npm install @luneo/api-client',
      example: `import { LuneoClient } from '@luneo/api-client';

const client = new LuneoClient({
  apiKey: process.env.LUNEO_API_KEY
});

const agent = await client.agents.create({
  name: 'Assistant Support',
  model: 'gpt-4o',
  instructions: 'Tu es un assistant de support client.'
});

const conversation = await client.conversations.create({
  agentId: agent.id,
  channel: 'web'
});

const reply = await client.conversations.sendMessage(conversation.id, {
  content: 'Bonjour, j\\'ai besoin d\\'aide',
  role: 'user'
});`,
      docLink: '/help/documentation/api-reference/endpoints',
      docLabel: 'Référence complète des endpoints',
      badges: ['Node.js', 'TypeScript', 'Backend']
    },
    {
      name: 'API REST directe',
      description: 'Utilisez l\'API REST directement avec curl, fetch ou tout client HTTP.',
      install: '# Aucune installation requise — utilisez fetch, axios ou curl',
      example: `curl -X POST https://api.luneo.app/api/v1/agents \\\\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\\\
  -H "Content-Type: application/json" \\\\
  -d '{
    "name": "Mon Agent",
    "model": "gpt-4o",
    "instructions": "Tu es un assistant commercial."
  }'

# Envoyer un message
curl -X POST https://api.luneo.app/api/v1/conversations/conv_123/messages \\\\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\\\
  -H "Content-Type: application/json" \\\\
  -d '{
    "content": "Quels sont vos tarifs ?",
    "role": "user"
  }'`,
      docLink: '/help/documentation/api-reference',
      docLabel: 'Documentation API Reference',
      badges: ['curl', 'Python', 'PHP', 'Ruby', 'Go']
    }
  ], []);

  return (
    <DocPageTemplate
      title="Vue d'ensemble des SDKs"
      description="Choisissez la bonne méthode d'intégration pour votre projet"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'API Reference', href: '/help/documentation/api-reference' },
        { label: 'SDKs', href: '/help/documentation/api-reference/sdk' }
      ]}
      relatedLinks={[
        { title: 'Widget SDK', href: '/help/documentation/api-reference/js-sdk', description: 'SDK JavaScript pour le widget chat' },
        { title: 'Agents API', href: '/help/documentation/api-reference/designs', description: 'Créer et gérer vos agents IA' },
        { title: 'Endpoints', href: '/help/documentation/api-reference/endpoints', description: 'Référence complète de l\'API' }
      ]}
    >
      <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-bold text-blue-300 mb-2">Quelle méthode choisir ?</h3>
        <ul className="text-gray-300 space-y-2 text-sm">
          <li><strong className="text-white">Widget SDK</strong> — Vous voulez ajouter un chat IA sur votre site web en quelques minutes</li>
          <li><strong className="text-white">Client REST API</strong> — Vous construisez une intégration backend ou un workflow automatisé</li>
          <li><strong className="text-white">API REST directe</strong> — Vous utilisez un langage non-JavaScript ou préférez des appels HTTP bruts</li>
        </ul>
      </div>

      {sdks.map((sdk, index) => (
        <div key={index} className="bg-gray-800/50 rounded-xl shadow-lg p-8 mb-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-2">
            {sdk.name}
          </h2>
          <p className="text-gray-300 mb-4">{sdk.description}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {sdk.badges.map((badge) => (
              <span key={badge} className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300 font-medium">
                {badge}
              </span>
            ))}
          </div>
          
          <div className="mb-2">
            <span className="text-sm font-semibold text-green-400">Installation</span>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4">
            <pre className="text-sm text-green-400">{sdk.install}</pre>
          </div>

          <div className="mb-2">
            <span className="text-sm font-semibold text-yellow-400">Exemple</span>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-300">{sdk.example}</pre>
          </div>

          <Link href={sdk.docLink} className="inline-block mt-4 text-blue-400 hover:text-blue-300 font-medium">
            {sdk.docLabel} →
          </Link>
        </div>
      ))}

      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mt-8">
        <h2 className="text-xl font-bold text-white mb-4">Authentification</h2>
        <p className="text-gray-300 mb-4">Toutes les requêtes API nécessitent une authentification :</p>
        <ul className="text-gray-300 space-y-2 text-sm">
          <li><strong className="text-white">Widget SDK</strong> — Utilisez une clé publique <code className="text-blue-400 bg-gray-900 px-2 py-0.5 rounded">pk_live_xxx</code> (côté client, restreinte par domaine)</li>
          <li><strong className="text-white">API Backend</strong> — Utilisez un token JWT <code className="text-blue-400 bg-gray-900 px-2 py-0.5 rounded">Bearer YOUR_JWT_TOKEN</code> via le header Authorization</li>
          <li><strong className="text-white">Webhooks</strong> — Signés avec HMAC-SHA256 pour vérification</li>
        </ul>
      </div>

      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mt-6">
        <h2 className="text-xl font-bold text-white mb-4">Limites par plan</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-400 border-b border-gray-700">
              <tr>
                <th className="py-2 pr-4">Plan</th>
                <th className="py-2 pr-4">Agents</th>
                <th className="py-2 pr-4">Conversations/mois</th>
                <th className="py-2 pr-4">Messages/mois</th>
                <th className="py-2">Rate limit</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-gray-800">
                <td className="py-2 pr-4 font-semibold">Free</td>
                <td className="py-2 pr-4">1</td>
                <td className="py-2 pr-4">100</td>
                <td className="py-2 pr-4">1 000</td>
                <td className="py-2">10 req/min</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2 pr-4 font-semibold text-blue-400">Pro — 49€</td>
                <td className="py-2 pr-4">5</td>
                <td className="py-2 pr-4">5 000</td>
                <td className="py-2 pr-4">50 000</td>
                <td className="py-2">60 req/min</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2 pr-4 font-semibold text-purple-400">Business — 149€</td>
                <td className="py-2 pr-4">20</td>
                <td className="py-2 pr-4">25 000</td>
                <td className="py-2 pr-4">250 000</td>
                <td className="py-2">200 req/min</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-semibold text-orange-400">Enterprise</td>
                <td className="py-2 pr-4">Illimité</td>
                <td className="py-2 pr-4">Illimité</td>
                <td className="py-2 pr-4">Illimité</td>
                <td className="py-2">Sur mesure</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </DocPageTemplate>
  );
}

const SDKOverviewPageMemo = memo(SDKOverviewPageContent);

export default function SDKOverviewPage() {
  return (
    <ErrorBoundary componentName="SDKOverviewPage">
      <SDKOverviewPageMemo />
    </ErrorBoundary>
  );
}
