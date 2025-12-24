'use client';

import React, { memo, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { Building2, Shield, Zap, Users, HeadphonesIcon, CloudCog, Check } from 'lucide-react';

function EnterprisePageContent() {
  const features = useMemo(() => [
    {
      icon: Shield,
      title: 'SLA 99.99%',
      description: 'Garantie de disponibilité avec pénalités contractuelles',
    },
    {
      icon: HeadphonesIcon,
      title: 'Support Dédié 24/7',
      description: 'Équipe dédiée avec temps de réponse < 1h',
    },
    {
      icon: CloudCog,
      title: 'Infrastructure Dédiée',
      description: 'Instances dédiées, CDN privé, custom domain',
    },
    {
      icon: Users,
      title: 'Formation & Onboarding',
      description: 'Formation complète de vos équipes + documentation custom',
    },
    {
      icon: Zap,
      title: 'Quotas Illimités',
      description: 'Génération illimitée, stockage illimité, API sans limite',
    },
    {
      icon: Building2,
      title: 'White-Label',
      description: 'Personnalisation complète avec votre marque',
    },
  ], []);

  const plans = useMemo(() => [
    {
      name: 'Enterprise Starter',
      price: '2 500€',
      period: '/mois',
      features: [
        'Jusqu\'à 50 utilisateurs',
        '100 000 générations/mois',
        'Support prioritaire',
        'SLA 99.9%',
        'Formation incluse',
        'API dédiée',
      ],
    },
    {
      name: 'Enterprise Pro',
      price: '5 000€',
      period: '/mois',
      features: [
        'Jusqu\'à 200 utilisateurs',
        'Générations illimitées',
        'Support dédié 24/7',
        'SLA 99.99%',
        'Infrastructure dédiée',
        'White-label disponible',
        'Custom features',
      ],
      popular: true,
    },
    {
      name: 'Enterprise Custom',
      price: 'Sur mesure',
      period: '',
      features: [
        'Utilisateurs illimités',
        'Volume sur mesure',
        'On-premise possible',
        'SLA personnalisé',
        'Développement custom',
        'Intégrations sur mesure',
        'CSM dédié',
      ],
    },
  ], []);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Building2 className="w-5 h-5" />
              <span className="text-sm font-semibold">Luneo Enterprise</span>
            </div>
            <h1 className="text-5xl font-bold mb-6">
              Propulsez Votre Entreprise avec Luneo
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Solutions personnalisées, SLA garantis, support dédié 24/7 pour les grandes entreprises qui veulent scaler sans limite.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Parler à notre équipe
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors border border-white/40"
              >
                Voir les tarifs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Pourquoi les Entreprises Choisissent Luneo
          </h2>
          <p className="text-xl text-gray-300">
            Des outils professionnels pour des besoins professionnels
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all">
              <feature.icon className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="bg-gray-800/30 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Plans Enterprise
            </h2>
            <p className="text-xl text-gray-600">
              Choisissez le plan adapté à votre croissance
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-white rounded-2xl p-8 ${
                  plan.popular ? 'ring-2 ring-blue-600 shadow-2xl scale-105' : 'shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className="bg-blue-600 text-white text-sm font-semibold px-4 py-1 rounded-full inline-block mb-4">
                    Le plus populaire
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact"
                  className={`block text-center py-3 px-6 rounded-lg font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Contactez-nous
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Prêt à Discuter de Vos Besoins ?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Notre équipe Enterprise est disponible pour comprendre vos besoins spécifiques et vous proposer une solution sur mesure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Réserver une démo
            </Link>
            <a
              href="mailto:enterprise@luneo.app"
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/20"
            >
              enterprise@luneo.app
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

const EnterprisePageMemo = memo(EnterprisePageContent);

export default function EnterprisePage() {
  return (
    <ErrorBoundary componentName="EnterprisePage">
      <EnterprisePageMemo />
    </ErrorBoundary>
  );
}
