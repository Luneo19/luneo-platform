'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  ShoppingCart,
  Store,
  Package,
  TrendingUp,
  Zap,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Eye,
  Share2,
  CreditCard,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { PageHero, SectionHeader } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';

export default function EcommercePage() {
  const [selectedPlatform, setSelectedPlatform] = useState('Shopify');
  const [contact, setContact] = useState({ email: '', brand: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleDemoRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contact.email || !contact.brand) {
      setSubmitError('Merci de renseigner votre email et votre marque.');
      return;
    }
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await api.post('/api/v1/emails/send-welcome', {
        email: contact.email,
        brandName: contact.brand,
        subject: `Demande demo Luneo Ecommerce (${selectedPlatform})`,
        customMessage:
          contact.message ||
          `Integrer Luneo avec ${selectedPlatform} (configurateur produits + sync commandes)`,
      });
      setSubmitted(true);
      setContact({ email: '', brand: '', message: '' });
    } catch (error) {
      logger.error('Submit contact form failed', {
        error,
        platform: selectedPlatform,
        email: contact.email,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      setSubmitError("Impossible d'envoyer la demande. Reessayez dans un instant.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const platforms = [
    {
      name: 'Shopify',
      description: 'Integration native complete',
      icon: '🛍️',
      features: ['Sync temps reel', 'Webhooks', 'API v2023'],
    },
    {
      name: 'WooCommerce',
      description: 'Plugin WordPress officiel',
      icon: '🛒',
      features: ['Installation 1-click', 'Personnalisation', 'Multi-langue'],
    },
    {
      name: 'PrestaShop',
      description: 'Module certifie',
      icon: '📦',
      features: ['Auto-update', 'Multi-boutiques', 'Responsive'],
    },
    {
      name: 'Magento',
      description: 'Extension enterprise',
      icon: '🏢',
      features: ['Scalable', 'B2B/B2C', 'Multi-devises'],
    },
  ];

  const features = [
    {
      icon: <ShoppingCart className="w-6 h-6" />,
      title: 'Panier Personnalise',
      description: 'Vos clients personnalisent avant d\'ajouter au panier.',
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: 'Gestion Stock',
      description: 'Sync automatique des stocks entre votre e-shop et Luneo.',
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: 'Paiement Integre',
      description: 'Stripe, PayPal, tous moyens de paiement supportes.',
    },
    {
      icon: <Truck className="w-6 h-6" />,
      title: 'Print on Demand',
      description: 'Connexion directe Printful, Printify, Gelato.',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Analytics',
      description: 'Tracking conversions, designs populaires, ROI.',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Webhooks',
      description: 'Notifications temps reel sur commandes, paiements.',
    },
  ];

  const benefits = [
    {
      title: 'Conversion',
      description: 'Augmentation moyenne',
      stat: '+35%',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Panier Moyen',
      description: 'Valeur augmentee',
      stat: '+28%',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Installation',
      description: 'Temps setup',
      stat: '< 15m',
      color: 'from-orange-500 to-red-500',
    },
    {
      title: 'Support',
      description: 'Temps de reponse',
      stat: '< 2h',
      color: 'from-green-500 to-teal-500',
    },
  ];

  const workflow = [
    {
      step: '1',
      title: 'Installer le plugin',
      description: 'Installation en 1-click sur votre plateforme',
    },
    {
      step: '2',
      title: 'Connecter vos produits',
      description: 'Import automatique de votre catalogue',
    },
    {
      step: '3',
      title: 'Configurer les options',
      description: 'Definissez quels produits sont personnalisables',
    },
    {
      step: '4',
      title: 'Vendre plus !',
      description: 'Vos clients personnalisent et commandent',
    },
  ];

  return (
    <ErrorBoundary level="page" componentName="EcommercePage">
    <>
      <PageHero
        title="E-commerce"
        description="Connectez Luneo à votre boutique en ligne. Shopify, WooCommerce, Magento, PrestaShop - intégration native en 15 minutes. Augmentez vos conversions de 35%."
        badge="Intégration E-commerce"
        gradient="from-emerald-600 via-green-600 to-teal-600"
        cta={{
          label: 'Voir la démo',
          href: '#ecommerce-demo-form'
        }}
      />

    <div className="min-h-screen bg-white text-gray-900">

      {/* Platforms */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Toutes les Plateformes
            </h2>
            <p className="text-xl text-gray-400">Integration native certifiee</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {platforms.map((platform) => (
              <Card
                key={platform.name}
                onClick={() => setSelectedPlatform(platform.name)}
                className={`p-6 bg-gray-800/50 border-2 transition-all cursor-pointer ${
                  selectedPlatform === platform.name
                    ? 'border-emerald-400 shadow-lg shadow-emerald-500/20'
                    : 'border-gray-700 hover:border-emerald-500/50'
                }`}
              >
                <div className="text-6xl mb-4 text-center">{platform.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2 text-center">{platform.name}</h3>
                <p className="text-sm text-gray-400 mb-4 text-center">{platform.description}</p>
                <div className="space-y-2">
                  {platform.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo form */}
      <section id="ecommerce-demo-form" className="py-20 px-4 bg-gray-900 border-y border-gray-800">
        <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-2">
          <Card className="p-8 bg-gray-900 border-emerald-500/30">
            <h2 className="text-2xl font-bold text-white mb-4">Demande de demo {selectedPlatform}</h2>
            <p className="text-gray-400 mb-6">
              {/* eslint-disable-next-line no-irregular-whitespace */}
              On installe la demo complete (webhooks, produits, analytics) sur votre boutique en moins de 2 heures.
            </p>
            <form className="space-y-4" onSubmit={handleDemoRequest}>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Email</label>
                <Input
                  type="email"
                  placeholder="vous@marque.com"
                  value={contact.email}
                  onChange={(e) => setContact((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Marque</label>
                <Input
                  placeholder="Nom de votre boutique"
                  value={contact.brand}
                  onChange={(e) => setContact((prev) => ({ ...prev, brand: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Message</label>
                <Textarea
                  rows={4}
                  placeholder="Ex. : connecter configurateur 3D, activer Printful, multi-langue..."
                  value={contact.message}
                  onChange={(e) => setContact((prev) => ({ ...prev, message: e.target.value }))}
                />
              </div>
              {submitError && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
                  {submitError}
                </div>
              )}
              {submitted && (
                <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-2">
                  {/* eslint-disable-next-line no-irregular-whitespace */}
                  Merci ! Notre equipe vous contacte tres vite pour le deploiement.
                </div>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 h-12 text-lg"
              >
                {isSubmitting ? 'Envoi en cours...' : 'Recevoir la demo configuree'}
              </Button>
            </form>
          </Card>
          <Card className="p-8 bg-gray-900 border-blue-500/30">
            <h3 className="text-xl font-bold text-white mb-4">Ce que comprend la demo</h3>
            <ul className="space-y-4 text-gray-300">
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                Plugin {selectedPlatform} configure + pipeline webhook complet.
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                Catalogue de produits personnalisables (2D/3D) + print on demand.
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                Acces aux dashboards analytics (ventes, conversions, tracking designs).
              </li>
              <li className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                {/* eslint-disable-next-line no-irregular-whitespace */}
                Support Slack + onboarding 1:1, SLA &lt; 2 h pendant la phase de test.
              </li>
            </ul>
            <p className="mt-6 text-sm text-gray-400">
              Cette demo est gratuite pendant 14 jours. Aucun paiement requis, vous pouvez la
              lancer sur un duplicata de votre boutique ou un environnement sandbox.
            </p>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <Card key={i} className="p-6 bg-gray-800/50 border-gray-700">
                <div className="w-12h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, i) => (
              <div key={i} className="text-center">
                <div
                  className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${benefit.color} rounded-full mb-4`}
                >
                  <span className="text-3xl font-bold text-white">{benefit.stat}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                <p className="text-gray-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20 px-4 bg-gray-800/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Installation Simple</h2>
            <p className="text-xl text-gray-400">4 etapes, 15 minutes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {workflow.map((item, i) => (
              <div key={i} className="relative">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full mb-4 text-white text-2xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </div>
                {i < workflow.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-emerald-500 to-green-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <CTASectionNew />
    </div>
    </>
    </ErrorBoundary>
  );
}
