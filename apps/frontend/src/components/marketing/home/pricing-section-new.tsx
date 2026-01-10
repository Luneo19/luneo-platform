'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    description: 'Parfait pour les individus et les petits projets',
    monthlyPrice: 19,
    yearlyPrice: 15,
    features: [
      { text: 'Jusqu\'à 5 projets', included: true },
      { text: 'Analytics de base', included: true },
      { text: 'Support email 24/7', included: true },
      { text: '5GB de stockage', included: true },
      { text: 'Intégrations personnalisées', included: false },
      { text: 'Sécurité avancée', included: false },
    ],
    cta: 'Commencer',
    popular: false,
  },
  {
    name: 'Professional',
    description: 'Idéal pour les équipes et entreprises en croissance',
    monthlyPrice: 49,
    yearlyPrice: 39,
    features: [
      { text: 'Projets illimités', included: true },
      { text: 'Analytics avancés', included: true },
      { text: 'Support prioritaire', included: true },
      { text: '50GB de stockage', included: true },
      { text: 'Intégrations personnalisées', included: true },
      { text: 'Sécurité avancée', included: false },
    ],
    cta: 'Commencer',
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'Pour les grandes organisations avec des besoins personnalisés',
    monthlyPrice: 99,
    yearlyPrice: 79,
    features: [
      { text: 'Tout dans Professional', included: true },
      { text: 'Gestionnaire de compte dédié', included: true },
      { text: 'Formation personnalisée', included: true },
      { text: 'Stockage illimité', included: true },
      { text: 'Intégrations personnalisées', included: true },
      { text: 'Sécurité avancée', included: true },
    ],
    cta: 'Contacter les ventes',
    popular: false,
  },
];

/**
 * Pricing Section - Pricing plans with monthly/yearly toggle
 * Based on Pandawa template, adapted for Luneo
 */
export function PricingSectionNew() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 sm:py-32 bg-gray-50 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16" data-animate="fade-up">
          <span className="inline-block px-3.5 py-1.5 bg-indigo-100 text-indigo-600 text-xs font-semibold rounded-full mb-4 uppercase tracking-wider">
            Tarifs
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Tarification{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              simple et transparente
            </span>
          </h2>
          <p className="text-lg text-gray-600">
            Choisissez le plan qui vous convient. Tous les plans incluent un essai gratuit de 14 jours.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12" data-animate="fade-up" data-delay="100">
          <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
            Mensuel
          </span>
          <label className="relative w-14 h-7 cursor-pointer">
            <input
              type="checkbox"
              checked={isYearly}
              onChange={(e) => setIsYearly(e.target.checked)}
              className="sr-only"
            />
            <span
              className={`absolute inset-0 rounded-full transition-colors ${
                isYearly ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            />
            <span
              className={`absolute w-[22px] h-[22px] bg-white rounded-full top-0.5 left-0.5 transition-transform shadow-sm ${
                isYearly ? 'translate-x-7' : ''
              }`}
            />
          </label>
          <span className={`text-sm font-medium ${isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
            Annuel{' '}
            <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded-full text-xs font-semibold">
              Économisez 20%
            </span>
          </span>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative p-10 rounded-2xl border transition-all hover:-translate-y-2 hover:shadow-xl ${
                plan.popular
                  ? 'bg-white border-2 border-indigo-600 scale-105'
                  : 'bg-white border-gray-100'
              }`}
              data-animate="fade-up"
              data-delay={index * 100}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
                  Le plus populaire
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-500">{plan.description}</p>
              </div>
              <div className="mb-8 flex items-baseline">
                <span className="text-2xl font-semibold text-gray-900">€</span>
                <span className="text-5xl font-extrabold text-gray-900 ml-1">
                  {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                </span>
                <span className="text-base text-gray-500 ml-1">/mois</span>
              </div>
              <ul className="mb-8 space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    )}
                    <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
              <Link href={plan.name === 'Enterprise' ? '/contact' : '/register'}>
                <Button
                  className={`w-full ${
                    plan.popular
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                      : 'bg-white border-2 border-gray-200 hover:border-indigo-600 hover:text-indigo-600'
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
