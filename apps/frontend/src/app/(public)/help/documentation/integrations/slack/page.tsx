'use client';

import React, { memo, useMemo } from 'react';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function SlackIntegrationPageContent() {
  const events = useMemo(() => [
    'Design créé avec succès',
    'Commande passée',
    'Paiement reçu',
    'Erreur de génération'
  ], []);

  const installationSteps = useMemo(() => [
    'Accédez aux paramètres de votre compte Luneo',
    'Cliquez sur "Intégrations" puis "Slack"',
    'Autorisez Luneo à accéder à votre workspace',
    'Choisissez le canal de notification'
  ], []);

  return (
    <DocPageTemplate
      title="Intégration Slack"
      description="Connectez Luneo à votre workspace Slack pour recevoir des notifications"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Intégrations', href: '/help/documentation/integrations' },
        { label: 'Slack', href: '/help/documentation/integrations/slack' }
      ]}
      relatedLinks={[
        { title: 'SendGrid', href: '/help/documentation/integrations/sendgrid', description: 'Notifications email' },
        { title: 'Webhooks', href: '/help/documentation/api-reference/webhooks', description: 'Webhooks API' }
      ]}
    >
      <h2 className="text-2xl font-bold mt-8 mb-4">Configuration Slack</h2>
      <p className="text-gray-300 mb-6">
        Recevez des notifications Slack quand vos designs sont prêts ou quand des commandes sont passées.
      </p>

      <Card className="bg-gray-800 border-gray-700 p-6 my-6">
        <h3 className="text-xl font-semibold mb-4">Événements notifiés</h3>
        <ul className="space-y-2 text-gray-300">
          {events.map((event, index) => (
            <li key={index}>• {event}</li>
          ))}
        </ul>
      </Card>

      <h2 className="text-2xl font-bold mt-8 mb-4">Installation</h2>
      <ol className="space-y-4 text-gray-300">
        {installationSteps.map((step, index) => (
          <li key={index} className="flex items-start">
            <span className="text-blue-400 mr-3 font-bold">{index + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </DocPageTemplate>
  );
}

const SlackIntegrationPageMemo = memo(SlackIntegrationPageContent);

export default function SlackIntegrationPage() {
  return (
    <ErrorBoundary componentName="SlackIntegrationPage">
      <SlackIntegrationPageMemo />
    </ErrorBoundary>
  );
}
