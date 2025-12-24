'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { ShoppingCart, Check } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function EcommerceUseCasePageContent() {
  const features = useMemo(() => [
    'Personnalisation produits en temps réel',
    'Visualisation 3D/AR avant achat',
    'Export print-ready automatique',
    'Intégration Shopify, WooCommerce',
    'Gestion inventaire dynamique',
    'Pricing dynamique selon customization',
    'Checkout Stripe intégré',
    'Fulfillment automatisé (Printful)',
  ], []);
  return (
    <div className="min-h-screen bg-gray-900">
      <section className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-24">
        <div className="max-w-4xl mx-auto px-4">
          <ShoppingCart className="w-16 h-16 mb-6 text-white" />
          <h1 className="text-5xl font-bold mb-6 text-white">E-commerce & Print-on-Demand</h1>
          <p className="text-2xl text-indigo-100 mb-8">
            Ajoutez la personnalisation 3D/AR à votre boutique. Augmentez vos conversions de 35%.
          </p>
          <div className="flex gap-4">
            <Link href="/contact" className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50">
              Parler à un expert
            </Link>
            <Link href="/integrations/shopify" className="bg-white/20 backdrop-blur text-white px-8 py-3 rounded-lg font-semibold border border-white/40 hover:bg-white/30">
              Voir intégration Shopify
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 text-white">Fonctionnalités E-commerce</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature) => (
            <div key={feature} className="flex items-start gap-3">
              <Check className="w-6 h-6 text-green-400 flex-shrink-0" />
              <span className="text-gray-300">{feature}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const EcommerceUseCasePageMemo = memo(EcommerceUseCasePageContent);

export default function EcommerceUseCasePage() {
  return (
    <ErrorBoundary componentName="EcommerceUseCasePage">
      <EcommerceUseCasePageMemo />
    </ErrorBoundary>
  );
}



