'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function APIOrdersPageContent() {
  const createOrderExample = useMemo(() => `fetch('https://api.luneo.app/v1/orders', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    designId: 'design_123',
    quantity: 100,
    shipping: {
      name: 'John Doe',
      address: '123 Main St',
      city: 'Paris',
      country: 'FR'
    }
  })
})`, []);

  const getOrderExample = useMemo(() => `fetch('https://api.luneo.app/v1/orders/order_123', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})`, []);

  const updateOrderExample = useMemo(() => `fetch('https://api.luneo.app/v1/orders/order_123', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'shipped',
    trackingNumber: 'TRACK123'
  })
})`, []);

  return (
    <DocPageTemplate
      title="API Orders"
      description="Gérez les commandes de vos clients"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'API Reference', href: '/help/documentation/api-reference' },
        { label: 'Orders', href: '/help/documentation/api-reference/orders' }
      ]}
      relatedLinks={[
        { title: 'Créer une commande', href: '/help/documentation/api-reference/create-order', description: 'Guide complet' },
        { title: 'Endpoints', href: '/help/documentation/api-reference/endpoints', description: 'Tous les endpoints' }
      ]}
    >
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">POST /api/v1/orders</h2>
        <p className="text-gray-300 mb-4">Crée une nouvelle commande</p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">{createOrderExample}</pre>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">GET /api/v1/orders/:id</h2>
        <p className="text-gray-300 mb-4">Récupère une commande</p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">{getOrderExample}</pre>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">PATCH /api/v1/orders/:id</h2>
        <p className="text-gray-300 mb-4">Met à jour le statut d'une commande</p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">{updateOrderExample}</pre>
        </div>
      </section>
    </DocPageTemplate>
  );
}

const APIOrdersPageMemo = memo(APIOrdersPageContent);

export default function APIOrdersPage() {
  return (
    <ErrorBoundary componentName="APIOrdersPage">
      <APIOrdersPageMemo />
    </ErrorBoundary>
  );
}
