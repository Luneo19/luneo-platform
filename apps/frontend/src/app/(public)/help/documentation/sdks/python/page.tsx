'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function PythonSDKPage() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const installCode = `pip install luneo-sdk`;

  const initExample = `import os
from luneo import LuneoClient

client = LuneoClient(
    api_key=os.environ['LUNEO_API_KEY'],
    base_url='https://api.luneo.app/api/v1',
)`;

  const agentsExample = `# Lister vos agents
agents = client.agents.list()
for agent in agents:
    print(f'{agent.id}: {agent.name}')

# Récupérer un agent
agent = client.agents.get('agent_xxx')
print(agent.name, agent.status)

# Créer un agent
new_agent = client.agents.create(
    name='Support Client',
    description='Agent de support pour les questions fréquentes',
    model='gpt-4o',
    instructions='Tu es un assistant de support client pour Luneo.',
    temperature=0.7,
)
print(f'Agent créé: {new_agent.id}')

# Mettre à jour un agent
client.agents.update('agent_xxx', name='Support V2', temperature=0.5)

# Supprimer un agent
client.agents.delete('agent_xxx')`;

  const knowledgeExample = `# Créer une base de connaissances
kb = client.knowledge_bases.create(
    name='FAQ Support',
    description='Questions fréquentes du support client',
)

# Ajouter des documents
client.knowledge_bases.add_document(
    knowledge_base_id=kb.id,
    content='Comment réinitialiser mon mot de passe ?\\n\\n'
            'Allez dans Paramètres > Sécurité > Réinitialiser.',
    metadata={'category': 'compte', 'priority': 'high'},
)

# Importer un fichier
with open('faq.pdf', 'rb') as f:
    client.knowledge_bases.upload_file(
        knowledge_base_id=kb.id,
        file=f,
        filename='faq.pdf',
    )

# Associer une base de connaissances à un agent
client.agents.update(
    'agent_xxx',
    knowledge_base_ids=[kb.id],
)`;

  const conversationsExample = `# Lister les conversations d'un agent
conversations = client.conversations.list(agent_id='agent_xxx', limit=20)

# Récupérer une conversation avec ses messages
conversation = client.conversations.get('conv_xxx')
for msg in conversation.messages:
    print(f'[{msg.role}] {msg.content}')

# Envoyer un message via l'API (server-side)
response = client.conversations.send_message(
    conversation_id='conv_xxx',
    content='Quel est le statut de ma commande #12345 ?',
)
print(f'Réponse: {response.content}')

# Créer une nouvelle conversation
new_conv = client.conversations.create(
    agent_id='agent_xxx',
    user_id='user_123',
    metadata={'source': 'api', 'channel': 'support'},
)`;

  const asyncExample = `import asyncio
from luneo import AsyncLuneoClient

async def main():
    client = AsyncLuneoClient(api_key='sk_live_xxx')

    agents = await client.agents.list()
    print(f'{len(agents)} agents trouvés')

    response = await client.conversations.send_message(
        conversation_id='conv_xxx',
        content='Bonjour !',
    )
    print(f'Réponse: {response.content}')

asyncio.run(main())`;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-4">
          ← Documentation
        </Link>
        <h1 className="text-4xl font-bold text-white mb-4">Python SDK</h1>
        <p className="text-xl text-gray-400">
          Client Python pour l&apos;API REST Luneo. Gérez vos agents IA, bases de connaissances et conversations.
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
          Créez, listez, mettez à jour et supprimez vos agents IA.
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
          Alimentez vos agents avec des documents et données personnalisées.
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
        <h2 className="text-2xl font-bold text-white mb-4">Conversations</h2>
        <p className="text-gray-400 mb-4">
          Gérez les conversations et envoyez des messages côté serveur.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {conversationsExample}
          </pre>
          <button onClick={() => copyCode(conversationsExample, 'conversations')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'conversations' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Client asynchrone</h2>
        <p className="text-gray-400 mb-4">
          Utilisez <code className="text-blue-400">AsyncLuneoClient</code> pour les applications async/await.
        </p>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
            {asyncExample}
          </pre>
          <button onClick={() => copyCode(asyncExample, 'async')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
            {copied === 'async' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </Card>
    </div>
  );
}
