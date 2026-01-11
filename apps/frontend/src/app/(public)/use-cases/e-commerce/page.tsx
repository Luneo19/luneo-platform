'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { ShoppingCart, Check } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHero, SectionHeader } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';

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
    <>
      <PageHero
        title="E-commerce & Print-on-Demand"
        description="Ajoutez la personnalisation 3D/AR à votre boutique. Augmentez vos conversions de 35%."
        badge="Cas d'usage"
        gradient="from-indigo-600 via-blue-600 to-cyan-600"
        cta={{
          label: 'Voir intégration Shopify',
          href: '/integrations/shopify'
        }}
      />

      <div className="min-h-screen bg-white text-gray-900">
        <section className="max-w-7xl mx-auto px-4 py-20 bg-gray-50">
          <SectionHeader
            title="Fonctionnalités E-commerce"
            description="Tout ce dont vous avez besoin pour transformer votre boutique"
          />
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            {features.map((feature) => (
              <div key={feature} className="flex items-start gap-3 bg-white p-4 rounded-lg border border-gray-200">
                <Check className="w-6 h-6 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </section>

        <CTASectionNew />
      </div>
    </>
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



