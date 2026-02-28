'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { ArrowRight, Key, Settings, CheckCircle, Copy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function ConfigurationPageContent() {
  const [copied, setCopied] = React.useState(false);

  const copyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const envExample = useMemo(() => `# Luneo Configuration
NEXT_PUBLIC_LUNEO_API_KEY=your_api_key_here
NEXT_PUBLIC_LUNEO_PROJECT_ID=your_project_id

# Backend API (NestJS)
NEXT_PUBLIC_API_URL=https://api.luneo.app

# Stripe (Payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...`, []);

  const configSteps = useMemo(() => [
    {
      icon: <Key className="w-6 h-6" />,
      title: 'Clé API',
      description: 'Récupérez votre clé API depuis le dashboard',
      action: 'Obtenir la clé'
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: 'Variables d\'environnement',
      description: 'Configurez les variables dans .env.local',
      action: 'Voir la doc'
    }
  ], []);

  return (
    <DocPageTemplate
      title="Configuration"
      description="Configurez votre projet Luneo avec les variables d'environnement"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Quickstart', href: '/help/documentation/quickstart' },
        { label: 'Configuration', href: '/help/documentation/quickstart/configuration' }
      ]}
      relatedLinks={[
        { title: 'Installation', href: '/help/documentation/quickstart/installation', description: 'Guide d\'installation' },
        { title: 'Déploiement', href: '/help/documentation/quickstart/deploy', description: 'Guide de déploiement' }
      ]}
    >
      <div className="grid min-[480px]:grid-cols-2 gap-6 mb-8">
        {configSteps.map((step, index) => (
          <Card key={index} className="p-6 bg-gray-800/50 border-gray-700">
            <div className="flex items-start gap-4">
              <div className="text-blue-400">{step.icon}</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-gray-300 mb-4">{step.description}</p>
                <Button variant="outline" size="sm">
                  {step.action}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Fichier .env.local</h2>
        <div className="relative">
          <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 font-mono overflow-x-auto">
            {envExample}
          </pre>
          <button
            onClick={() => copyCode(envExample)}
            className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
          >
            {copied ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </Card>

      <div className="bg-green-900/20 border border-green-700 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-green-400 mb-2">Configuration terminée</h3>
            <p className="text-gray-300 text-sm">
              Votre projet est maintenant configuré. Vous pouvez passer à l'étape suivante : créer votre premier customizer.
            </p>
          </div>
        </div>
      </div>
    </DocPageTemplate>
  );
}

const ConfigurationPageMemo = memo(ConfigurationPageContent);

export default function ConfigurationPage() {
  return (
    <ErrorBoundary componentName="ConfigurationPage">
      <ConfigurationPageMemo />
    </ErrorBoundary>
  );
}
