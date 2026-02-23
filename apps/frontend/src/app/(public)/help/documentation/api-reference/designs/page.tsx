'use client';

import React, { memo, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function APIAgentsPageContent() {
  const createAgentCurl = useMemo(() => `curl -X POST https://api.luneo.app/api/v1/agents \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Assistant Support",
    "description": "Agent de support client pour le e-commerce",
    "model": "gpt-4o",
    "instructions": "Tu es un assistant de support client. Réponds de manière professionnelle et concise.",
    "temperature": 0.7,
    "knowledgeBaseIds": ["kb_abc123"],
    "channels": ["web", "slack"],
    "welcomeMessage": "Bonjour ! Comment puis-je vous aider ?",
    "language": "fr"
  }'`, []);

  const createAgentJs = useMemo(() => `const response = await fetch('https://api.luneo.app/api/v1/agents', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Assistant Support',
    description: 'Agent de support client pour le e-commerce',
    model: 'gpt-4o',
    instructions: 'Tu es un assistant de support client. Réponds de manière professionnelle et concise.',
    temperature: 0.7,
    knowledgeBaseIds: ['kb_abc123'],
    channels: ['web', 'slack'],
    welcomeMessage: 'Bonjour ! Comment puis-je vous aider ?',
    language: 'fr'
  })
});

const agent = await response.json();`, []);

  const listAgentsExample = useMemo(() => `curl https://api.luneo.app/api/v1/agents?page=1&limit=20&status=active \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`, []);

  const getAgentExample = useMemo(() => `curl https://api.luneo.app/api/v1/agents/agent_abc123 \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`, []);

  const updateAgentExample = useMemo(() => `curl -X PATCH https://api.luneo.app/api/v1/agents/agent_abc123 \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "instructions": "Nouvelles instructions pour l agent",
    "temperature": 0.5,
    "status": "active"
  }'`, []);

  const deleteAgentExample = useMemo(() => `curl -X DELETE https://api.luneo.app/api/v1/agents/agent_abc123 \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`, []);

  const agentResponseExample = useMemo(() => `{
  "id": "agent_abc123",
  "name": "Assistant Support",
  "description": "Agent de support client pour le e-commerce",
  "model": "gpt-4o",
  "instructions": "Tu es un assistant de support client...",
  "temperature": 0.7,
  "status": "active",
  "knowledgeBaseIds": ["kb_abc123"],
  "channels": ["web", "slack"],
  "welcomeMessage": "Bonjour ! Comment puis-je vous aider ?",
  "language": "fr",
  "stats": {
    "totalConversations": 1250,
    "avgResponseTime": 1.2,
    "satisfactionScore": 4.6
  },
  "createdAt": "2025-12-01T10:00:00Z",
  "updatedAt": "2025-12-15T14:30:00Z"
}`, []);

  return (
    <DocPageTemplate
      title="API Agents"
      description="Créez et gérez vos agents IA conversationnels via l'API REST"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'API Reference', href: '/help/documentation/api-reference' },
        { label: 'Agents', href: '/help/documentation/api-reference/designs' }
      ]}
      relatedLinks={[
        { title: 'Conversations API', href: '/help/documentation/api-reference/orders', description: 'Gérer les conversations de vos agents' },
        { title: 'Tous les endpoints', href: '/help/documentation/api-reference/endpoints', description: 'Référence complète des endpoints' },
        { title: 'Widget SDK', href: '/help/documentation/api-reference/js-sdk', description: 'Intégrer le widget chat sur votre site' }
      ]}
    >
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">POST /api/v1/agents</h2>
        <p className="text-gray-300 mb-2">Crée un nouvel agent IA. Vous pouvez spécifier le modèle, les instructions, la base de connaissances et les canaux.</p>
        
        <div className="mt-4 mb-2">
          <span className="text-sm font-semibold text-blue-400">curl</span>
        </div>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
          <pre className="text-sm">{createAgentCurl}</pre>
        </div>

        <div className="mb-2">
          <span className="text-sm font-semibold text-yellow-400">JavaScript</span>
        </div>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">{createAgentJs}</pre>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Objet Agent (réponse)</h2>
        <p className="text-gray-300 mb-4">Structure de l'objet retourné par l'API :</p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">{agentResponseExample}</pre>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">GET /api/v1/agents</h2>
        <p className="text-gray-300 mb-4">Liste tous vos agents avec pagination et filtrage par statut.</p>

        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-400 border-b border-gray-700">
              <tr>
                <th className="py-2 pr-4">Paramètre</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2">Description</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-gray-800">
                <td className="py-2 pr-4 font-mono text-blue-400">page</td>
                <td className="py-2 pr-4">number</td>
                <td className="py-2">Numéro de page (défaut : 1)</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2 pr-4 font-mono text-blue-400">limit</td>
                <td className="py-2 pr-4">number</td>
                <td className="py-2">Résultats par page (défaut : 20, max : 100)</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2 pr-4 font-mono text-blue-400">status</td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2">Filtrer par statut : active, inactive, draft</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">{listAgentsExample}</pre>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">GET /api/v1/agents/:id</h2>
        <p className="text-gray-300 mb-4">Récupère les détails d'un agent spécifique, y compris ses statistiques.</p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">{getAgentExample}</pre>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">PATCH /api/v1/agents/:id</h2>
        <p className="text-gray-300 mb-4">Met à jour la configuration d'un agent. Seuls les champs envoyés seront modifiés.</p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">{updateAgentExample}</pre>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">DELETE /api/v1/agents/:id</h2>
        <p className="text-gray-300 mb-4">Supprime un agent et toutes ses données associées. Cette action est irréversible.</p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">{deleteAgentExample}</pre>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Modèles disponibles</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-400 border-b border-gray-700">
              <tr>
                <th className="py-2 pr-4">Modèle</th>
                <th className="py-2 pr-4">Contexte</th>
                <th className="py-2 pr-4">Plans</th>
                <th className="py-2">Description</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-gray-800">
                <td className="py-2 pr-4 font-mono text-green-400">gpt-4o-mini</td>
                <td className="py-2 pr-4">128K</td>
                <td className="py-2 pr-4">Free, Pro, Business</td>
                <td className="py-2">Rapide et économique</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2 pr-4 font-mono text-green-400">gpt-4o</td>
                <td className="py-2 pr-4">128K</td>
                <td className="py-2 pr-4">Pro, Business</td>
                <td className="py-2">Meilleur rapport qualité/coût</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2 pr-4 font-mono text-green-400">claude-3.5-sonnet</td>
                <td className="py-2 pr-4">200K</td>
                <td className="py-2 pr-4">Business, Enterprise</td>
                <td className="py-2">Raisonnement avancé</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </DocPageTemplate>
  );
}

const APIAgentsPageMemo = memo(APIAgentsPageContent);

export default function APIAgentsPage() {
  return (
    <ErrorBoundary componentName="APIAgentsPage">
      <APIAgentsPageMemo />
    </ErrorBoundary>
  );
}
