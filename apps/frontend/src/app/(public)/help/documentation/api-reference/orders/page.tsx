'use client';

import React, { memo, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function APIConversationsPageContent() {
  const createConversationExample = useMemo(() => `curl -X POST https://api.luneo.app/api/v1/conversations \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agentId": "agent_abc123",
    "channel": "web",
    "metadata": {
      "userId": "user_456",
      "source": "widget",
      "page": "/pricing"
    }
  }'`, []);

  const createConversationJs = useMemo(() => `const response = await fetch('https://api.luneo.app/api/v1/conversations', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    agentId: 'agent_abc123',
    channel: 'web',
    metadata: {
      userId: 'user_456',
      source: 'widget',
      page: '/pricing'
    }
  })
});

const conversation = await response.json();`, []);

  const sendMessageExample = useMemo(() => `curl -X POST https://api.luneo.app/api/v1/conversations/conv_xyz789/messages \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "Quels sont vos tarifs pour le plan Business ?",
    "role": "user"
  }'`, []);

  const sendMessageJs = useMemo(() => `const response = await fetch(
  'https://api.luneo.app/api/v1/conversations/conv_xyz789/messages',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: 'Quels sont vos tarifs pour le plan Business ?',
      role: 'user'
    })
  }
);

const message = await response.json();`, []);

  const streamResponseExample = useMemo(() => `curl -N https://api.luneo.app/api/v1/conversations/conv_xyz789/messages/stream \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -H "Accept: text/event-stream" \\
  -d '{
    "content": "Expliquez-moi le fonctionnement du RAG",
    "role": "user"
  }'

# Réponse (Server-Sent Events) :
# data: {"type":"token","content":"Le"}
# data: {"type":"token","content":" RAG"}
# data: {"type":"token","content":" (Retrieval"}
# data: {"type":"token","content":"-Augmented"}
# ...
# data: {"type":"done","messageId":"msg_abc"}`, []);

  const listConversationsExample = useMemo(() => `curl "https://api.luneo.app/api/v1/conversations?agentId=agent_abc123&status=active&page=1&limit=20" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`, []);

  const getConversationExample = useMemo(() => `curl https://api.luneo.app/api/v1/conversations/conv_xyz789 \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`, []);

  const conversationResponseExample = useMemo(() => `{
  "id": "conv_xyz789",
  "agentId": "agent_abc123",
  "channel": "web",
  "status": "active",
  "metadata": {
    "userId": "user_456",
    "source": "widget",
    "page": "/pricing"
  },
  "messages": [
    {
      "id": "msg_001",
      "role": "assistant",
      "content": "Bonjour ! Comment puis-je vous aider ?",
      "createdAt": "2025-12-15T10:00:00Z"
    },
    {
      "id": "msg_002",
      "role": "user",
      "content": "Quels sont vos tarifs ?",
      "createdAt": "2025-12-15T10:00:15Z"
    },
    {
      "id": "msg_003",
      "role": "assistant",
      "content": "Nous proposons 3 plans : Free (gratuit), Pro (49€/mois) et Business (149€/mois)...",
      "sources": [
        { "documentId": "doc_pricing", "chunk": "Plans tarifaires...", "score": 0.95 }
      ],
      "createdAt": "2025-12-15T10:00:17Z"
    }
  ],
  "tokensUsed": 342,
  "satisfaction": 5,
  "createdAt": "2025-12-15T10:00:00Z",
  "updatedAt": "2025-12-15T10:05:00Z"
}`, []);

  const closeConversationExample = useMemo(() => `curl -X PATCH https://api.luneo.app/api/v1/conversations/conv_xyz789 \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "status": "closed",
    "satisfaction": 5,
    "tags": ["support", "pricing"]
  }'`, []);

  return (
    <DocPageTemplate
      title="API Conversations"
      description="Gérez les sessions de chat entre vos agents IA et vos utilisateurs"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'API Reference', href: '/help/documentation/api-reference' },
        { label: 'Conversations', href: '/help/documentation/api-reference/orders' }
      ]}
      relatedLinks={[
        { title: 'Agents API', href: '/help/documentation/api-reference/designs', description: 'Créer et configurer vos agents' },
        { title: 'Widget SDK', href: '/help/documentation/api-reference/js-sdk', description: 'Intégrer le chat sur votre site' },
        { title: 'Tous les endpoints', href: '/help/documentation/api-reference/endpoints', description: 'Référence complète' }
      ]}
    >
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">POST /api/v1/conversations</h2>
        <p className="text-gray-300 mb-2">Crée une nouvelle conversation avec un agent. Chaque conversation est liée à un agent et un canal.</p>
        
        <div className="mt-4 mb-2">
          <span className="text-sm font-semibold text-blue-400">curl</span>
        </div>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
          <pre className="text-sm">{createConversationExample}</pre>
        </div>

        <div className="mb-2">
          <span className="text-sm font-semibold text-yellow-400">JavaScript</span>
        </div>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">{createConversationJs}</pre>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">POST /api/v1/conversations/:id/messages</h2>
        <p className="text-gray-300 mb-2">Envoie un message dans une conversation. L'agent répond automatiquement.</p>
        
        <div className="mt-4 mb-2">
          <span className="text-sm font-semibold text-blue-400">curl</span>
        </div>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
          <pre className="text-sm">{sendMessageExample}</pre>
        </div>

        <div className="mb-2">
          <span className="text-sm font-semibold text-yellow-400">JavaScript</span>
        </div>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">{sendMessageJs}</pre>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">POST /api/v1/conversations/:id/messages/stream</h2>
        <p className="text-gray-300 mb-4">Envoie un message et reçoit la réponse en streaming (Server-Sent Events). Recommandé pour une meilleure UX.</p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">{streamResponseExample}</pre>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Objet Conversation (réponse)</h2>
        <p className="text-gray-300 mb-4">Structure complète d'une conversation avec ses messages et métadonnées :</p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">{conversationResponseExample}</pre>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">GET /api/v1/conversations</h2>
        <p className="text-gray-300 mb-4">Liste les conversations avec filtrage et pagination.</p>

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
                <td className="py-2 pr-4 font-mono text-blue-400">agentId</td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2">Filtrer par agent</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2 pr-4 font-mono text-blue-400">status</td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2">active, closed, archived</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2 pr-4 font-mono text-blue-400">channel</td>
                <td className="py-2 pr-4">string</td>
                <td className="py-2">web, slack, whatsapp, email</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2 pr-4 font-mono text-blue-400">page</td>
                <td className="py-2 pr-4">number</td>
                <td className="py-2">Numéro de page (défaut : 1)</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2 pr-4 font-mono text-blue-400">limit</td>
                <td className="py-2 pr-4">number</td>
                <td className="py-2">Résultats par page (défaut : 20)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">{listConversationsExample}</pre>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">GET /api/v1/conversations/:id</h2>
        <p className="text-gray-300 mb-4">Récupère une conversation complète avec tous ses messages.</p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">{getConversationExample}</pre>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">PATCH /api/v1/conversations/:id</h2>
        <p className="text-gray-300 mb-4">Clôture une conversation et ajoute un score de satisfaction ou des tags.</p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">{closeConversationExample}</pre>
        </div>
      </section>
    </DocPageTemplate>
  );
}

const APIConversationsPageMemo = memo(APIConversationsPageContent);

export default function APIConversationsPage() {
  return (
    <ErrorBoundary componentName="APIConversationsPage">
      <APIConversationsPageMemo />
    </ErrorBoundary>
  );
}
