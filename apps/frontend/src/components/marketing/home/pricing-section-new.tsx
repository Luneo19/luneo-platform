'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, X, ArrowRight } from 'lucide-react';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';

const plans = [
  {
    name: 'Starter',
    description: 'Parfait pour les individus et les petits projets',
    monthlyPrice: 19,
    yearlyPrice: 15,
    features: [
      { text: "Jusqu'a 5 projets", included: true },
      { text: 'Analytics de base', included: true },
      { text: 'Support email 24/7', included: true },
      { text: '5GB de stockage', included: true },
      { text: 'Integrations personnalisees', included: false },
      { text: 'Securite avancee', included: false },
    ],
    cta: 'Commencer',
    popular: false,
  },
  {
    name: 'Professional',
    description: 'Ideal pour les equipes et entreprises en croissance',
    monthlyPrice: 49,
    yearlyPrice: 39,
    features: [
      { text: 'Projets illimites', included: true },
      { text: 'Analytics avances', included: true },
      { text: 'Support prioritaire', included: true },
      { text: '50GB de stockage', included: true },
      { text: 'Integrations personnalisees', included: true },
      { text: 'Securite avancee', included: false },
    ],
    cta: 'Commencer',
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'Pour les grandes organisations avec des besoins personnalises',
    monthlyPrice: 99,
    yearlyPrice: 79,
    features: [
      { text: 'Tout dans Professional', included: true },
      { text: 'Gestionnaire de compte dedie', included: true },
      { text: 'Formation personnalisee', included: true },
      { text: 'Stockage illimite', included: true },
      { text: 'Integrations personnalisees', included: true },
      { text: 'Securite avancee', included: true },
    ],
    cta: 'Contacter les ventes',
    popular: false,
  },
];

export function PricingSectionNew() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="dark-section relative py-20 sm:py-24 md:py-32 noise-overlay">
      <div className="absolute inset-0 gradient-mesh-purple opacity-30" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal animation="fade-up">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-[10px] sm:text-xs font-semibold rounded-full mb-4 sm:mb-5 uppercase tracking-wider">
              Tarifs
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-5">
              <span className="text-white">Tarification </span>
              <span className="italic text-gradient-purple">simple et transparente</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-400 px-2">
              Choisissez le plan qui vous convient. Essai gratuit 14 jours inclus.
            </p>
          </div>
        </ScrollReveal>

        {/* Toggle */}
        <ScrollReveal animation="fade-up" delay={100}>
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-12">
            <span className={`text-xs sm:text-sm font-medium transition-colors ${!isYearly ? 'text-white' : 'text-slate-500'}`}>
              Mensuel
            </span>
            <label className="relative w-12 sm:w-14 h-6 sm:h-7 cursor-pointer">
              <input
                type="checkbox"
                checked={isYearly}
                onChange={(e) => setIsYearly(e.target.checked)}
                className="sr-only"
              />
              <span
                className={`absolute inset-0 rounded-full transition-colors ${
                  isYearly ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-white/[0.1]'
                }`}
              />
              <span
                className={`absolute w-[18px] sm:w-[22px] h-[18px] sm:h-[22px] bg-white rounded-full top-[3px] sm:top-0.5 left-[3px] sm:left-0.5 transition-transform shadow-sm ${
                  isYearly ? 'translate-x-6 sm:translate-x-7' : ''
                }`}
              />
            </label>
            <span className={`text-xs sm:text-sm font-medium transition-colors ${isYearly ? 'text-white' : 'text-slate-500'}`}>
              Annuel{' '}
              <span className="bg-green-500/20 text-green-400 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border border-green-500/30">
                -20%
              </span>
            </span>
          </div>
        </ScrollReveal>

        {/* Pricing Grid - Stripe style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <ScrollReveal
              key={plan.name}
              animation="fade-up"
              staggerIndex={index}
              staggerDelay={120}
              delay={150}
            >
              <div
                className={`relative p-6 sm:p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 h-full flex flex-col ${
                  plan.popular
                    ? 'bg-dark-card/80 border-purple-500/30 shadow-glow-sm md:scale-[1.02]'
                    : 'bg-dark-card/60 border-white/[0.04] hover:border-white/[0.08]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 sm:px-4 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap">
                    Le plus populaire
                  </div>
                )}

                <div className="mb-5 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500">{plan.description}</p>
                </div>

                <div className="mb-6 sm:mb-8 flex items-baseline">
                  <span className="text-base sm:text-xl font-semibold text-slate-400">EUR</span>
                  <span className="text-4xl sm:text-5xl font-extrabold text-white ml-1.5 sm:ml-2 font-display">
                    {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-xs sm:text-sm text-slate-500 ml-1">/mois</span>
                </div>

                <ul className="mb-6 sm:mb-8 space-y-2.5 sm:space-y-3 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm">
                      {feature.included ? (
                        <Check className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-green-400 flex-shrink-0" />
                      ) : (
                        <X className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-700 flex-shrink-0" />
                      )}
                      <span className={feature.included ? 'text-slate-300' : 'text-slate-600'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.name === 'Enterprise' ? '/contact' : '/register'}>
                  <Button
                    className={`w-full font-semibold text-xs sm:text-sm ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-3.5 sm:w-4 h-3.5 sm:h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Glowing separator */}
        <div className="mt-16 sm:mt-24 glow-separator" />
      </div>
    </section>
  );
}
