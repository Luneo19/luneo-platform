'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { Rocket, CheckCircle, Copy } from 'lucide-react';
import { Card } from '@/components/ui/card';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function DeployPageContent() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const vercelDeploy = useMemo(() => 'vercel --prod', []);
  const netlifyDeploy = useMemo(() => 'netlify deploy --prod', []);
  const dockerDeploy = useMemo(() => `docker build -t luneo-app .
docker run -p 3000:3000 luneo-app`, []);

  const platforms = useMemo(() => [
    {
      name: 'Vercel',
      description: 'Déploiement recommandé pour Next.js',
      command: vercelDeploy,
      id: 'vercel',
      color: 'border-blue-500'
    },
    {
      name: 'Netlify',
      description: 'Alternative populaire pour les apps React',
      command: netlifyDeploy,
      id: 'netlify',
      color: 'border-green-500'
    },
    {
      name: 'Docker',
      description: 'Déploiement sur votre propre infrastructure',
      command: dockerDeploy,
      id: 'docker',
      color: 'border-purple-500'
    }
  ], [vercelDeploy, netlifyDeploy, dockerDeploy]);

  return (
    <DocPageTemplate
      title="Deploy Production"
      description="Déployez votre application Luneo sur Vercel, Netlify ou votre serveur"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Quickstart', href: '/help/documentation/quickstart' },
        { label: 'Déploiement', href: '/help/documentation/quickstart/deploy' }
      ]}
      relatedLinks={[
        { title: 'Configuration', href: '/help/documentation/quickstart/configuration', description: 'Configuration du projet' },
        { title: 'Vercel', href: '/help/documentation/deployment/vercel', description: 'Guide Vercel complet' }
      ]}
    >
      {platforms.map((platform, index) => (
        <Card key={index} className={`p-6 bg-gray-800/50 border-gray-700 ${platform.color} mb-8`}>
          <div className="flex items-start gap-4 mb-4">
            <Rocket className="w-6 h-6 text-blue-400 flex-shrink-0" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">{platform.name}</h2>
              <p className="text-gray-300">{platform.description}</p>
            </div>
          </div>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
              {platform.command}
            </pre>
            <button
              onClick={() => copyCode(platform.command, platform.id)}
              className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
            >
              {copied === platform.id ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </Card>
      ))}

      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-blue-400 mb-2">Conseil</h3>
            <p className="text-gray-300 text-sm">
              Assurez-vous d'avoir configuré toutes les variables d'environnement sur votre plateforme de déploiement avant de déployer.
            </p>
          </div>
        </div>
      </div>
    </DocPageTemplate>
  );
}

const DeployPageMemo = memo(DeployPageContent);

export default function DeployPage() {
  return (
    <ErrorBoundary componentName="DeployPage">
      <DeployPageMemo />
    </ErrorBoundary>
  );
}
