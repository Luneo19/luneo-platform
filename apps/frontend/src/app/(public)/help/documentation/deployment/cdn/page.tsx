'use client';

import React, { memo, useMemo } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function DeploymentCDNPageContent() {
  const cloudflareSteps = useMemo(() => [
    'Créez un compte Cloudflare',
    'Ajoutez votre domaine',
    'Configurez les DNS vers Vercel',
    'Activez le mode proxy (orange cloud)'
  ], []);

  return (
    <DocPageTemplate
      title="Configuration CDN"
      description="Optimisez la livraison de vos assets avec un CDN global"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Deployment', href: '/help/documentation/deployment' },
        { label: 'CDN', href: '/help/documentation/deployment/cdn' }
      ]}
      relatedLinks={[
        { title: 'Vercel', href: '/help/documentation/deployment/vercel', description: 'Déploiement Vercel' },
        { title: 'Docker', href: '/help/documentation/deployment/docker', description: 'Containerisation' }
      ]}
    >
      <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">CDN Vercel (Intégré)</h2>
        <p className="text-gray-300 mb-4">
          Vercel inclut un CDN global automatique. Vos images et assets sont automatiquement distribués sur 100+ edge locations.
        </p>
        <div className="p-3 bg-green-900/20 border border-green-500/30 rounded">
          <p className="text-sm text-green-300">✅ Aucune configuration nécessaire - Activé automatiquement</p>
        </div>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <h2 className="text-2xl font-bold mb-4">CDN Cloudflare (Optionnel)</h2>
        <p className="text-gray-300 mb-4">Pour un contrôle avancé:</p>
        <ol className="space-y-2 text-gray-300 text-sm">
          {cloudflareSteps.map((step, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-400 mr-2">{index + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Card>
    </DocPageTemplate>
  );
}

const DeploymentCDNPageMemo = memo(DeploymentCDNPageContent);

export default function DeploymentCDNPage() {
  return (
    <ErrorBoundary componentName="DeploymentCDNPage">
      <DeploymentCDNPageMemo />
    </ErrorBoundary>
  );
}
