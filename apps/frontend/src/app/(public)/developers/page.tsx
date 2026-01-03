'use client';

/**
 * Developer Documentation Page
 * D-002: Page /developers avec documentation interactive
 */

import { useState, memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import {
  Code,
  Key,
  Webhook,
  Book,
  Terminal,
  Copy,
  Check,
  ChevronRight,
  Zap,
  Shield,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const codeExamples = {
  curl: `curl -X GET "https://api.luneo.app/v1/designs" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
  javascript: `import { Luneo } from '@luneo/sdk';

const luneo = new Luneo({ apiKey: 'YOUR_API_KEY' });

// List all designs
const designs = await luneo.designs.list();

// Create a new design
const design = await luneo.designs.create({
  name: 'My Design',
  templateId: 'template_xxx',
  canvasData: { objects: [] }
});`,
  python: `from luneo import Luneo

client = Luneo(api_key="YOUR_API_KEY")

# List all designs
designs = client.designs.list()

# Create a new design
design = client.designs.create(
    name="My Design",
    template_id="template_xxx",
    canvas_data={"objects": []}
)`,
  php: `<?php
use Luneo\\Client;

$luneo = new Client('YOUR_API_KEY');

// List all designs
$designs = $luneo->designs->list();

// Create a new design
$design = $luneo->designs->create([
    'name' => 'My Design',
    'templateId' => 'template_xxx',
    'canvasData' => ['objects' => []]
]);`,
};

const endpoints = [
  {
    method: 'GET',
    path: '/v1/designs',
    description: 'Liste tous les designs',
    auth: true,
  },
  {
    method: 'POST',
    path: '/v1/designs',
    description: 'Créer un nouveau design',
    auth: true,
  },
  {
    method: 'GET',
    path: '/v1/designs/:id',
    description: 'Récupérer un design',
    auth: true,
  },
  {
    method: 'PATCH',
    path: '/v1/designs/:id',
    description: 'Mettre à jour un design',
    auth: true,
  },
  {
    method: 'DELETE',
    path: '/v1/designs/:id',
    description: 'Supprimer un design',
    auth: true,
  },
  {
    method: 'GET',
    path: '/v1/templates',
    description: 'Liste les templates disponibles',
    auth: true,
  },
  {
    method: 'GET',
    path: '/v1/products',
    description: 'Liste les produits',
    auth: true,
  },
  {
    method: 'POST',
    path: '/v1/orders',
    description: 'Créer une commande',
    auth: true,
  },
];

const webhooks = [
  {
    event: 'design.created',
    description: 'Un design a été créé',
  },
  {
    event: 'design.updated',
    description: 'Un design a été modifié',
  },
  {
    event: 'design.deleted',
    description: 'Un design a été supprimé',
  },
  {
    event: 'order.created',
    description: 'Une commande a été créée',
  },
  {
    event: 'order.completed',
    description: 'Une commande est terminée',
  },
  {
    event: 'subscription.updated',
    description: "L'abonnement a été modifié",
  },
];

function DevelopersPageContent() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState('javascript');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero */}
      <div className="bg-gradient-to-b from-blue-900/20 to-slate-950 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-full text-blue-400 text-sm mb-6">
              <Code className="w-4 h-4" />
              API Documentation
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">
              Construisez avec Luneo
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
              Intégrez la personnalisation de produits dans votre application
              avec notre API REST et nos SDKs.
            </p>
            <div className="flex gap-4 justify-center">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Key className="w-4 h-4 mr-2" />
                Obtenir une clé API
              </Button>
              <Button variant="outline" className="border-slate-700">
                <Book className="w-4 h-4 mr-2" />
                Guide complet
              </Button>
            </div>
          </motion>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Quick Start */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Start</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              {
                step: '1',
                title: 'Obtenez votre clé API',
                description: 'Créez un compte et générez votre clé API dans les paramètres.',
                icon: Key,
              },
              {
                step: '2',
                title: 'Installez le SDK',
                description: 'npm install @luneo/sdk ou utilisez directement l\'API REST.',
                icon: Terminal,
              },
              {
                step: '3',
                title: 'Faites votre premier appel',
                description: 'Listez vos designs ou créez-en un nouveau.',
                icon: Zap,
              },
            ].map((item, i) => (
              <Card key={i} className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                      {item.step}
                    </div>
                    <item.icon className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Code Examples */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Exemples de code</h2>
          
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <Tabs value={activeLanguage} onValueChange={setActiveLanguage}>
                <TabsList className="bg-slate-800">
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="php">PHP</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-slate-950 rounded-lg p-4 overflow-x-auto text-sm">
                  <code className="text-slate-300">
                    {codeExamples[activeLanguage as keyof typeof codeExamples]}
                  </code>
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(
                    codeExamples[activeLanguage as keyof typeof codeExamples],
                    'code'
                  )}
                >
                  {copiedCode === 'code' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* API Reference */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Référence API</h2>
          
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-0">
              <div className="divide-y divide-slate-800">
                {endpoints.map((endpoint, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                          endpoint.method === 'GET'
                            ? 'bg-green-500/20 text-green-400'
                            : endpoint.method === 'POST'
                            ? 'bg-blue-500/20 text-blue-400'
                            : endpoint.method === 'PATCH'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {endpoint.method}
                      </span>
                      <code className="text-slate-300 font-mono text-sm">
                        {endpoint.path}
                      </code>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-400">{endpoint.description}</span>
                      {endpoint.auth && (
                        <Shield className="w-4 h-4 text-amber-400" aria-label="Auth required" />
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Webhooks */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Webhooks</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-blue-400" />
                  Événements disponibles
                </CardTitle>
                <CardDescription>
                  Recevez des notifications en temps réel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {webhooks.map((webhook, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0"
                    >
                      <code className="text-blue-400 text-sm font-mono">
                        {webhook.event}
                      </code>
                      <span className="text-sm text-slate-400">{webhook.description}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Configuration</CardTitle>
                <CardDescription>
                  Comment configurer vos webhooks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-slate-950 rounded-lg p-4 text-sm overflow-x-auto">
                  <code className="text-slate-300">{`{
  "url": "https://yourapp.com/webhook",
  "events": ["design.created", "order.completed"],
  "secret": "whsec_xxx"
}`}</code>
                </pre>
                <p className="mt-4 text-sm text-slate-400">
                  Utilisez le secret pour vérifier la signature des webhooks
                  et garantir leur authenticité.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Rate Limits */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Limites de débit</h2>
          
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { plan: 'Starter', limit: '100 req/min', burst: '200' },
                  { plan: 'Professional', limit: '500 req/min', burst: '1000' },
                  { plan: 'Business', limit: '2000 req/min', burst: '5000' },
                ].map((tier, i) => (
                  <div key={i} className="p-4 bg-slate-800/50 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">{tier.plan}</h4>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Clock className="w-4 h-4" />
                      {tier.limit}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Burst: {tier.burst}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-slate-400">
                Les headers <code className="text-blue-400">X-RateLimit-*</code> sont inclus
                dans chaque réponse pour vous aider à gérer vos quotas.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* SDKs */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">SDKs officiels</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'JavaScript/TypeScript', pkg: '@luneo/sdk', status: 'stable' },
              { name: 'Python', pkg: 'luneo-python', status: 'stable' },
              { name: 'PHP', pkg: 'luneo/luneo-php', status: 'beta' },
            ].map((sdk, i) => (
              <Card key={i} className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-white mb-2">{sdk.name}</h4>
                  <code className="text-sm text-blue-400">{sdk.pkg}</code>
                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        sdk.status === 'stable'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {sdk.status}
                    </span>
                    <Button size="sm" variant="ghost">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

const MemoizedDevelopersPageContent = memo(DevelopersPageContent);

export default function DevelopersPage() {
  return (
    <ErrorBoundary level="page" componentName="DevelopersPage">
      <MemoizedDevelopersPageContent />
    </ErrorBoundary>
  );
}
