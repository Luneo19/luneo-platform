'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function ShopifyIntegrationDocsPageContent() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300">← Documentation</Link>
          <div className="flex items-center gap-3 mt-4 mb-2">
            <ShoppingBag className="w-10 h-10 text-green-400" />
            <h1 className="text-4xl font-bold text-white">Shopify Integration</h1>
          </div>
          <p className="text-xl text-gray-300">Guide d'intégration Shopify</p>
        </div>

        <div className="prose prose-lg max-w-none prose-invert">
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-white">Installation</h2>
            <ol className="list-decimal pl-6 space-y-3 text-gray-300">
              <li>Allez sur le Shopify App Store</li>
              <li>Recherchez "Luneo 3D/AR Customizer"</li>
              <li>Cliquez sur "Add app"</li>
              <li>Autorisez les permissions</li>
              <li>Configurez votre API key Luneo</li>
            </ol>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-white">Configuration Produit</h2>
            <div className="bg-gray-800/50 border-l-4 border-green-500 p-4 rounded-lg">
              <p className="font-semibold text-white">Dans l'admin Shopify :</p>
              <ol className="list-decimal pl-6 mt-2 space-y-2 text-gray-300">
                <li>Ouvrez un produit</li>
                <li>Section "Luneo Customization"</li>
                <li>Sélectionnez un template</li>
                <li>Configurez les options</li>
                <li>Sauvegardez</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6 text-white">Code Liquid</h2>
            <div className="bg-gray-800/50 border border-gray-700 text-gray-300 p-4 rounded-lg">
              <pre className="text-sm">{`<!-- Dans votre theme.liquid -->
<div id="luneo-customizer"></div>
<script>
  LuneoCustomizer.init({
    productId: {{ product.id }},
    apiKey: 'YOUR_API_KEY'
  });
</script>`}</pre>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const ShopifyIntegrationDocsPageMemo = memo(ShopifyIntegrationDocsPageContent);

export default function ShopifyIntegrationDocsPage() {
  return (
    <ErrorBoundary componentName="ShopifyIntegrationDocsPage">
      <ShopifyIntegrationDocsPageMemo />
    </ErrorBoundary>
  );
}
