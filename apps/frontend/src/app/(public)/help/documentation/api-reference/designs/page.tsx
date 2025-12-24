'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function APIDesignsPageContent() {
  const createDesignExample = useMemo(() => `fetch('https://api.luneo.app/v1/designs', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My Design',
    template: 't-shirt',
    customizations: {
      color: '#FF0000',
      text: 'Hello World'
    }
  })
})`, []);

  const listDesignsExample = useMemo(() => `fetch('https://api.luneo.app/v1/designs', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})`, []);

  const getDesignExample = useMemo(() => `fetch('https://api.luneo.app/v1/designs/design_123', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})`, []);

  return (
    <DocPageTemplate
      title="API Designs"
      description="Créez et gérez vos designs via l'API"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'API Reference', href: '/help/documentation/api-reference' },
        { label: 'Designs', href: '/help/documentation/api-reference/designs' }
      ]}
      relatedLinks={[
        { title: 'Créer un design', href: '/help/documentation/api-reference/create-design', description: 'Guide complet' },
        { title: 'Endpoints', href: '/help/documentation/api-reference/endpoints', description: 'Tous les endpoints' }
      ]}
    >
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">POST /api/v1/designs</h2>
        <p className="text-gray-300 mb-4">Crée un nouveau design</p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">{createDesignExample}</pre>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">GET /api/v1/designs</h2>
        <p className="text-gray-300 mb-4">Liste tous vos designs</p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">{listDesignsExample}</pre>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">GET /api/v1/designs/:id</h2>
        <p className="text-gray-300 mb-4">Récupère un design spécifique</p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">{getDesignExample}</pre>
        </div>
      </section>
    </DocPageTemplate>
  );
}

const APIDesignsPageMemo = memo(APIDesignsPageContent);

export default function APIDesignsPage() {
  return (
    <ErrorBoundary componentName="APIDesignsPage">
      <APIDesignsPageMemo />
    </ErrorBoundary>
  );
}
