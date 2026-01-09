'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FadeIn, SlideUp } from '@/components/animations';
import { Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Starter',
    price: '29',
    period: '/mois',
    description: 'Parfait pour débuter',
    features: [
      '100 designs/mois',
      'Éditeur 2D',
      'Export standard',
      'Support email',
    ],
    cta: 'Commencer',
    popular: false,
  },
  {
    name: 'Pro',
    price: '99',
    period: '/mois',
    description: 'Pour les professionnels',
    features: [
      '1,000 designs/mois',
      'Éditeur 2D/3D',
      'Export print-ready',
      'AR Try-On',
      'Support prioritaire',
    ],
    cta: 'Choisir Pro',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Sur mesure pour votre entreprise',
    features: [
      'Designs illimités',
      'Toutes les fonctionnalités',
      'API personnalisée',
      'Dedicated support',
      'SLA garanti',
    ],
    cta: 'Nous contacter',
    popular: false,
  },
];

/**
 * Pricing Preview Section - Quick pricing overview
 */
export function PricingPreview() {
  return (
    <section className="py-24 sm:py-32 bg-gradient-to-b from-gray-900 to-gray-800 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeIn className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Des tarifs adaptés à vos besoins
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Commencez gratuitement, scalez selon vos besoins
          </p>
          <Link href="/pricing">
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:border-gray-400">
              Voir tous les tarifs
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </FadeIn>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <SlideUp key={index} delay={index * 0.15}>
              <Card
                className={`relative bg-gray-800/50 backdrop-blur-sm border-gray-700 p-8 h-full transition-all ${
                  plan.popular
                    ? 'border-purple-500/50 shadow-lg shadow-purple-500/20 scale-105'
                    : 'hover:border-purple-500/30'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold">
                    Populaire
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-white">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-gray-400 ml-2">
                        {plan.period}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.name === 'Enterprise' ? '/contact' : '/register'}>
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    variant={plan.popular ? 'default' : 'secondary'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </Card>
            </SlideUp>
          ))}
        </div>
      </div>
    </section>
  );
}
