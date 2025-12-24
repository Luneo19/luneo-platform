'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  Zap,
  Mail,
  CreditCard,
  Package,
  Code,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

const integrations = [
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Intégration native pour synchroniser produits et commandes avec votre boutique Shopify',
    icon: <ShoppingCart className="w-8 h-8" />,
    href: '/integrations/shopify',
    color: 'from-green-500 to-emerald-500',
    badge: 'Populaire',
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'Connectez votre boutique WooCommerce pour automatiser la personnalisation',
    icon: <ShoppingCart className="w-8 h-8" />,
    href: '/integrations/woocommerce',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Gestion des paiements sécurisée avec Stripe',
    icon: <CreditCard className="w-8 h-8" />,
    href: '/integrations/stripe',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    id: 'printful',
    name: 'Printful',
    description: 'Intégration Print-on-Demand pour production automatique',
    icon: <Package className="w-8 h-8" />,
    href: '/integrations/printful',
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Automatisez vos workflows avec des milliers d\'applications',
    icon: <Zap className="w-8 h-8" />,
    href: '/integrations/zapier',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'make',
    name: 'Make (Integromat)',
    description: 'Automatisation avancée avec Make',
    icon: <Code className="w-8 h-8" />,
    href: '/integrations/make',
    color: 'from-purple-500 to-pink-500',
  },
];

function IntegrationsOverviewPageContent() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            Intégrations
          </h1>
          <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
            Connectez Luneo à vos outils préférés pour automatiser vos workflows
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                Commencer gratuitement
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/help/documentation/integrations">
              <Button size="lg" variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => (
            <Link key={integration.id} href={integration.href}>
              <Card className="h-full p-6 bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${integration.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                    {integration.icon}
                  </div>
                  {integration.badge && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
                      {integration.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{integration.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{integration.description}</p>
                <div className="flex items-center text-blue-400 text-sm font-medium group-hover:text-blue-300 transition-colors">
                  En savoir plus
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-16">
        <Card className="p-8 md:p-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Besoin d'une intégration personnalisée ?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Notre API REST est complète et documentée. Créez votre propre intégration ou contactez-nous pour une solution sur mesure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/help/documentation/api-reference">
              <Button size="lg" className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20">
                Voir la documentation API
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-2 border-white/50 text-white hover:bg-white/20">
                Nous contacter
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Pourquoi choisir nos intégrations ?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <CheckCircle className="w-6 h-6" />,
              title: 'Installation rapide',
              description: 'Connectez vos outils en quelques clics, sans code',
            },
            {
              icon: <Zap className="w-6 h-6" />,
              title: 'Synchronisation temps réel',
              description: 'Vos données sont toujours à jour automatiquement',
            },
            {
              icon: <Code className="w-6 h-6" />,
              title: 'API complète',
              description: 'Créez vos propres intégrations avec notre API REST',
            },
          ].map((feature, idx) => (
            <div key={idx} className="text-center">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 mx-auto mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const IntegrationsOverviewPageMemo = memo(IntegrationsOverviewPageContent);

export default function IntegrationsOverviewPage() {
  return (
    <ErrorBoundary level="page" componentName="IntegrationsOverviewPage">
      <IntegrationsOverviewPageMemo />
    </ErrorBoundary>
  );
}
