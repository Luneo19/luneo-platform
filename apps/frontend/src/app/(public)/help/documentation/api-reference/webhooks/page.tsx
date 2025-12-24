'use client';

import React, { memo, useMemo, useCallback } from 'react';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';
import { Code, Copy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function WebhooksPageContent() {
  const [copied, setCopied] = React.useState(false);

  const exampleCode = useMemo(() => `const express = require('express');
const crypto = require('crypto');

app.post('/webhooks/luneo', (req, res) => {
  const signature = req.headers['x-luneo-signature'];
  const payload = JSON.stringify(req.body);
  
  // Vérifier la signature HMAC
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return res.status(401).send('Invalid signature');
  }
  
  const { event, data } = req.body;
  
  switch (event) {
    case 'design.completed':
      // Traiter le design complété
      break;
    case 'order.paid':
      // Traiter la commande payée
      break;
  }
  
  res.status(200).send('OK');
});`, []);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(exampleCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [exampleCode]);

  const events = useMemo(() => [
    { event: 'design.completed', description: 'Un design a été généré avec succès' },
    { event: 'design.failed', description: 'La génération d\'un design a échoué' },
    { event: 'order.created', description: 'Une nouvelle commande a été créée' },
    { event: 'order.paid', description: 'Une commande a été payée' },
    { event: 'order.shipped', description: 'Une commande a été expédiée' },
  ], []);

  return (
    <DocPageTemplate
      title="Webhooks"
      description="Recevez des notifications en temps réel sur les événements Luneo"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'API Reference', href: '/help/documentation/api-reference' },
        { label: 'Webhooks', href: '/help/documentation/api-reference/webhooks' }
      ]}
      relatedLinks={[
        { title: 'Sécurité', href: '/help/documentation/security/authentication', description: 'Sécuriser vos webhooks' },
        { title: 'Endpoints', href: '/help/documentation/api-reference/endpoints', description: 'Liste des endpoints API' }
      ]}
    >
      <Card className="bg-gray-800 border-gray-700 p-6 my-8">
        <div className="flex flex-col sm:flex-row items-center justify-start sm:justify-between gap-3 sm:gap-0 mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Code className="w-5 h-5 mr-2" />
            Exemple de webhook handler
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={copyCode}
            className="border-pink-500 text-pink-400 hover:bg-pink-500 hover:text-white"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied ? 'Copié !' : 'Copier'}
          </Button>
        </div>
        <pre className="bg-gray-900 rounded p-4 overflow-x-auto">
          <code className="text-sm text-gray-300">{exampleCode}</code>
        </pre>
      </Card>

      <h2 className="text-2xl font-bold mt-8 mb-4">Événements disponibles</h2>
      <ul className="space-y-4">
        {events.map((item, index) => (
          <li key={index}>
            <strong>{item.event}</strong> - {item.description}
          </li>
        ))}
      </ul>

      <h2 className="text-2xl font-bold mt-8 mb-4">Sécurité</h2>
      <p className="text-gray-300">
        Tous les webhooks sont signés avec HMAC-SHA256. Vérifiez toujours la signature avant de traiter un événement.
      </p>
    </DocPageTemplate>
  );
}

const WebhooksPageMemo = memo(WebhooksPageContent);

export default function WebhooksPage() {
  return (
    <ErrorBoundary componentName="WebhooksPage">
      <WebhooksPageMemo />
    </ErrorBoundary>
  );
}
