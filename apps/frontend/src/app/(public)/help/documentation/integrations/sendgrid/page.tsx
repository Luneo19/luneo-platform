'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function SendGridIntegrationPageContent() {
  const features = useMemo(() => [
    'Templates emails',
    'Envoi automatique',
    'Analytics'
  ], []);

  return (
    <DocPageTemplate
      title="SendGrid Integration"
      description="Intégrez SendGrid pour l'envoi d'emails transactionnels"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Intégrations', href: '/help/documentation/integrations' },
        { label: 'SendGrid', href: '/help/documentation/integrations/sendgrid' }
      ]}
      relatedLinks={[
        { title: 'Slack', href: '/help/documentation/integrations/slack', description: 'Notifications Slack' },
        { title: 'Webhooks', href: '/help/documentation/api-reference/webhooks', description: 'Webhooks API' }
      ]}
    >
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Email Marketing</h2>
        <div className="space-y-2 text-gray-300">
          {features.map((feature, index) => (
            <div key={index} className="flex gap-2">
              <CheckCircle className="w-5 h-5 text-cyan-400" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </Card>
    </DocPageTemplate>
  );
}

const SendGridIntegrationPageMemo = memo(SendGridIntegrationPageContent);

export default function SendGridIntegrationPage() {
  return (
    <ErrorBoundary componentName="SendGridIntegrationPage">
      <SendGridIntegrationPageMemo />
    </ErrorBoundary>
  );
}
