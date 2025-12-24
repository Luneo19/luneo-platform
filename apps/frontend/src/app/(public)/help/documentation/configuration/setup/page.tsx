'use client';

import React, { memo } from 'react';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';
import { Card } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function ConfigSetupPageContent() {
  return (
    <DocPageTemplate
      title="Configuration Initiale"
      description="Guide de configuration initiale de Luneo"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Configuration', href: '/help/documentation/configuration' },
        { label: 'Configuration initiale', href: '/help/documentation/configuration/setup' }
      ]}
      relatedLinks={[
        { title: 'Variables d\'environnement', href: '/help/documentation/configuration/environment-variables', description: 'Configurer les variables d\'environnement' },
        { title: 'Démarrage rapide', href: '/help/quick-start', description: 'Guide de démarrage rapide' }
      ]}
    >
      <h2 className="text-2xl font-bold mt-8 mb-4">Étapes de configuration</h2>

      <Card className="bg-gray-800 border-gray-700 p-6 my-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
          1. Créer votre compte
        </h3>
        <p className="text-gray-300">
          Inscrivez-vous sur <a href="/register" className="text-blue-400 hover:underline">app.luneo.app</a> et confirmez votre email.
        </p>
      </Card>

      <Card className="bg-gray-800 border-gray-700 p-6 my-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
          2. Obtenir votre clé API
        </h3>
        <p className="text-gray-300">
          Rendez-vous dans les paramètres de votre compte pour générer une clé API.
        </p>
      </Card>

      <Card className="bg-gray-800 border-gray-700 p-6 my-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
          3. Configurer les webhooks
        </h3>
        <p className="text-gray-300">
          Configurez vos webhooks pour recevoir des notifications en temps réel.
        </p>
      </Card>

      <Card className="bg-gray-800 border-gray-700 p-6 my-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
          4. Tester l'API
        </h3>
        <p className="text-gray-300">
          Utilisez notre collection Postman ou faites votre première requête API.
        </p>
      </Card>

      <h2 className="text-2xl font-bold mt-8 mb-4">Prochaines étapes</h2>
      <ul className="space-y-2">
        <li>• <a href="/help/documentation/api-reference/create-design" className="text-blue-400 hover:underline">Créer votre premier design</a></li>
        <li>• <a href="/help/documentation/configuration/monitoring" className="text-blue-400 hover:underline">Configurer le monitoring</a></li>
        <li>• <a href="/help/documentation/security/authentication" className="text-blue-400 hover:underline">Sécuriser votre intégration</a></li>
      </ul>
    </DocPageTemplate>
  );
}

const ConfigSetupPageMemo = memo(ConfigSetupPageContent);

export default function ConfigSetupPage() {
  return (
    <ErrorBoundary componentName="ConfigSetupPage">
      <ConfigSetupPageMemo />
    </ErrorBoundary>
  );
}
