'use client';

import { useState } from 'react';
import { FadeIn } from '@/components/animations/fade-in';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';

const PLANS = [
  {
    name: 'Free',
    price: 0,
    period: '/mois',
    conversations: '50',
    agents: '1',
    kb: '1',
    team: '1',
    cta: 'Commencer',
    popular: false,
  },
  {
    name: 'Starter',
    price: 49,
    period: '/mois',
    conversations: '500',
    agents: '3',
    kb: '10',
    team: '5',
    cta: 'Essai gratuit',
    popular: false,
  },
  {
    name: 'Pro',
    price: 149,
    period: '/mois',
    conversations: '2 000',
    agents: '10',
    kb: 'Illimité',
    team: '20',
    cta: 'Essai gratuit',
    popular: true,
  },
  {
    name: 'Business',
    price: 399,
    period: '/mois',
    conversations: 'Illimité',
    agents: 'Illimité',
    kb: 'Illimité',
    team: 'Illimité',
    cta: 'Contacter',
    popular: false,
  },
  {
    name: 'Enterprise',
    price: null,
    period: '',
    conversations: 'Custom',
    agents: 'Custom',
    kb: 'Custom',
    team: 'Custom',
    cta: 'Contacter',
    popular: false,
  },
];

export function PricingSectionNew() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="relative py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-12">
            <span className="text-violet-400 text-sm font-semibold tracking-wider uppercase">
              Tarifs
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mt-4 mb-6">
              Simple et transparent
            </h2>
            <div className="flex items-center justify-center gap-3 mb-8">
              <span className={`text-sm ${!yearly ? 'text-white' : 'text-white/40'}`}>
                Mensuel
              </span>
              <button
                type="button"
                onClick={() => setYearly(!yearly)}
                className={`relative w-14 h-7 rounded-full transition-colors ${yearly ? 'bg-violet-600' : 'bg-white/10'}`}
                aria-label={yearly ? 'Passer au mensuel' : 'Passer à l\'annuel'}
              >
                <div
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform duration-300 ${yearly ? 'translate-x-7' : 'translate-x-1'}`}
                />
              </button>
              <span className={`text-sm ${yearly ? 'text-white' : 'text-white/40'}`}>
                Annuel <span className="text-violet-400 font-medium">-20%</span>
              </span>
            </div>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {PLANS.map((plan, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div
                className={`relative rounded-2xl p-6 transition-all duration-300 ${
                  plan.popular
                    ? 'border-2 border-violet-500/50 bg-violet-500/5 shadow-xl shadow-violet-500/10 scale-105'
                    : 'border border-white/[0.06] bg-white/[0.02]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-xs font-semibold text-white flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Populaire
                  </div>
                )}
                <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-6">
                  {plan.price !== null ? (
                    <>
                      <span className="text-3xl font-bold text-white">
                        {yearly ? Math.round(plan.price * 0.8) : plan.price}€
                      </span>
                      <span className="text-white/40 text-sm">{plan.period}</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-white">Sur devis</span>
                  )}
                </div>
                <ul className="space-y-3 mb-8 text-sm">
                  {[
                    `${plan.conversations} conversations`,
                    `${plan.agents} agents`,
                    `${plan.kb} bases`,
                    `${plan.team} membres`,
                  ].map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-white/60">
                      <Check className="w-4 h-4 text-violet-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block">
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500'
                        : 'bg-white/[0.06] text-white hover:bg-white/[0.1] border border-white/[0.06]'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
