'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { ShoppingCart, Check } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHero, SectionHeader } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';

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

      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        <section className="dark-section relative noise-overlay max-w-7xl mx-auto px-4 py-20">
          <div className="absolute inset-0 gradient-mesh-purple" />
          <div className="relative z-10">
            <SectionHeader
              title="Fonctionnalités E-commerce"
              description="Tout ce dont vous avez besoin pour transformer votre boutique"
            />
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              {features.map((feature) => (
                <ScrollReveal key={feature}>
                  <div className="flex items-start gap-3 bg-dark-card/60 backdrop-blur-sm p-4 rounded-lg border border-white/[0.04]">
                    <Check className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <span className="text-slate-300">{feature}</span>
                  </div>
                </ScrollReveal>
              ))}
            </div>
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



