'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X, ArrowRight } from 'lucide-react';
import {
  ScrollReveal,
  TiltCard,
  MagneticButton,
  GradientText,
  PremiumSectionHeader,
  GlowOrb,
} from '@/components/ui/premium';

const plans = [
  {
    name: 'Starter',
    description: 'Parfait pour les createurs et les petites boutiques',
    monthlyPrice: 19,
    yearlyPrice: 15.83,
    href: '/pricing?plan=starter',
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
    yearlyPrice: 40.83,
    href: '/pricing?plan=professional',
    features: [
      { text: 'Projets illimites', included: true },
      { text: 'Analytics avances', included: true },
      { text: 'Support prioritaire', included: true },
      { text: '50GB de stockage', included: true },
      { text: 'Integrations personnalisees', included: true },
      { text: 'Securite avancee', included: false },
    ],
    cta: 'Choisir ce plan',
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'Pour les grandes organisations avec des besoins personnalises',
    monthlyPrice: 99,
    yearlyPrice: 82.50,
    href: '/contact?type=enterprise',
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
    <section id="pricing" className="relative py-24 sm:py-32 bg-dark-bg overflow-hidden">
      {/* Background orbs */}
      <GlowOrb
        className="-top-40 right-0"
        color="rgba(168,85,247,0.06)"
        size="600px"
        blur={120}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal direction="up">
          <PremiumSectionHeader
            badge="Tarifs"
            title={
              <>
                Tarification{' '}
                <GradientText variant="violet" className="font-editorial italic">
                  simple et transparente
                </GradientText>
              </>
            }
            subtitle="Choisissez le plan qui vous convient. Essai gratuit 14 jours inclus."
            className="mb-12 sm:mb-16"
          />
        </ScrollReveal>

        {/* Toggle */}
        <ScrollReveal direction="up" delay={80}>
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-12">
            <span className={`text-xs sm:text-sm font-medium transition-colors ${!isYearly ? 'text-white' : 'text-white/60'}`}>
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
            <span className={`text-xs sm:text-sm font-medium transition-colors ${isYearly ? 'text-white' : 'text-white/60'}`}>
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
              direction="up"
              delay={index * 100}
            >
              <TiltCard
                tiltStrength={4}
                glareColor="rgba(99,102,241,0.06)"
                className={`h-full ${plan.popular ? 'md:scale-[1.03]' : ''}`}
              >
                <div
                  className={`relative p-6 sm:p-8 h-full flex flex-col ${
                    plan.popular ? 'ring-1 ring-indigo-500/20' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-px left-1/2 -translate-x-1/2">
                      <div className="px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-b-lg">
                        Le plus populaire
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-xs text-white/40">{plan.description}</p>
                  </div>

                  <div className="mb-8 flex items-baseline">
                    <span className="text-lg font-semibold text-white/50">EUR</span>
                    <span className="text-5xl font-extrabold text-white ml-2 font-editorial tabular-nums">
                      {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-sm text-white/40 ml-1">/mois</span>
                  </div>

                  <ul className="mb-8 space-y-3 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-white/20 flex-shrink-0" />
                        )}
                        <span className={feature.included ? 'text-white/70' : 'text-white/30'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link href={plan.href}>
                    <MagneticButton
                      variant={plan.popular ? 'primary' : 'secondary'}
                      size="lg"
                      glow={plan.popular}
                      className="w-full"
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </MagneticButton>
                  </Link>
                </div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>

        {/* Bottom glow separator */}
        <div className="mt-24 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
      </div>
    </section>
  );
}
