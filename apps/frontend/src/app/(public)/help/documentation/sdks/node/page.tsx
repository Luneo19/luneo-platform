'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function NodeSDKPage() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const installCode = `npm install @luneo/sdk`;

  const initExample = `import { LuneoClient } from '@luneo/sdk';

const client = new LuneoClient({
  apiKey: process.env.LUNEO_API_KEY,
  baseUrl: 'https://api.luneo.app/api/v1',
});`;

  const agentsExample = `// Lister les agents
const agents = await client.agents.list();
console.log(\`\${agents.length} agents trouvés\`);

// Récupérer un agent
const agent = await client.agents.get('agent_xxx');
console.log(agent.name, agent.status);

// Créer un agent
const newAgent = await client.agents.create({
  name: 'Support Client',
  description: 'Agent de support pour les questions fréquentes',
  model: 'gpt-4o',
  instructions: 'Tu es un assistant de support client pour Luneo.',
  temperature: 0.7,
});
console.log('Agent créé:', newAgent.id);

// Mettre à jour un agent
await client.agents.update('agent_xxx', {
  name: 'Support V2',
  temperature: 0.5,
});

// Supprimer un agent
await client.agents.delete('agent_xxx');`;

  const knowledgeExample = `// Créer une base de connaissances
const kb = await client.knowledgeBases.create({
  name: 'FAQ Support',
  description: 'Questions fréquentes du support client',
});

// Ajouter un document texte
await client.knowledgeBases.addDocument(kb.id, {
  content: 'Comment réinitialiser mon mot de passe ?\\n\\n' +
           'Allez dans Paramètres > Sécurité > Réinitialiser.',
  metadata: { category: 'compte', priority: 'high' },
});

// Importer un fichier
const fs = require('fs');
await client.knowledgeBases.uploadFile(kb.id, {
  file: fs.createReadStream('./faq.pdf'),
  filename: 'faq.pdf',
});

// Associer la base de connaissances à un agent
await client.agents.update('agent_xxx', {
  knowledgeBaseIds: [kb.id],
});`;

  const expressExample = `import express from 'express';
import { LuneoClient } from '@luneo/sdk';

const app = express();
const client = new LuneoClient({ apiKey: process.env.LUNEO_API_KEY });

app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { agentId, message, userId } = req.body;

  let conversation = await client.conversations.findOrCreate({
    agentId,
    userId,
    metadata: { source: 'web-app' },
  });

  const response = await client.conversations.sendMessage(conversation.id, {
    content: message,
  });

  res.json({
    reply: response.content,
    conversationId: conversation.id,
  });
});

app.get('/api/agents', async (req, res) => {
  const agents = await client.agents.list();
  res.json(agents);
});

app.listen(3000);`;

  const webhookExample = `import crypto from 'crypto';

app.post('/webhooks/luneo', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-luneo-signature'];
  const payload = req.body.toString();

  const expected = crypto
    .createHmac('sha256', process.env.LUNEO_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  if (signature !== expected) {
    return res.status(401).json({ error: 'Signature invalide' });
  }

  const event = JSON.parse(payload);

  switch (event.type) {
    case 'conversation.created':
      console.log('Nouvelle conversation:', event.data.id);
      break;
    case 'message.received':
      console.log('Message reçu:', event.data.content);
      break;
    case 'agent.updated':
      console.log('Agent mis à jour:', event.data.id);
      break;
  }

  res.json({ received: true });
});`;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-4">
          ← Documentation
        </Link>
        <h1 className="text-4xl font-bold text-white mb-4">Node.js SDK</h1>
        <p className="text-xl text-gray-400">
          Client Node.js pour l&apos;API REST Luneo. Gestion serveur des agents, conversations et bases de connaissances.
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
        <h2 className="text-2xl font-bold text-white mb-4">Initialisation</h2>
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
        <h2 className="text-2xl font-bold text-white mb-4">Gestion des agents</h2>
        <p className="text-gray-400 mb-4">
          CRUD complet sur vos agents IA depuis le backend.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {agentsExample}
          </pre>
          <button onClick={() => copyCode(agentsExample, 'agents')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'agents' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Bases de connaissances</h2>
        <p className="text-gray-400 mb-4">
          Gérez les documents qui alimentent vos agents.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {knowledgeExample}
          </pre>
          <button onClick={() => copyCode(knowledgeExample, 'knowledge')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'knowledge' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Exemple Express.js</h2>
        <p className="text-gray-400 mb-4">
          Intégration complète avec un serveur Express pour un chat backend.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {expressExample}
          </pre>
          <button onClick={() => copyCode(expressExample, 'express')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'express' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Webhooks</h2>
        <p className="text-gray-400 mb-4">
          Vérifiez la signature et traitez les événements Luneo en temps réel.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {webhookExample}
          </pre>
          <button onClick={() => copyCode(webhookExample, 'webhook')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'webhook' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>
    </div>
  );
}
