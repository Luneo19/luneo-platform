'use client';

import { UserPlus, Settings, Rocket } from 'lucide-react';
import {
  ScrollReveal,
  TiltCard,
  GradientText,
  PremiumSectionHeader,
  GlowOrb,
} from '@/components/ui/premium';

const steps = [
  {
    number: '01',
    title: 'Creez votre compte',
    description: "Inscrivez-vous en quelques secondes avec juste votre email. Aucune carte bancaire requise pour commencer l'essai gratuit de 14 jours.",
    icon: UserPlus,
    gradient: 'from-indigo-500 to-violet-500',
    iconBg: 'rgba(99,102,241,0.12)',
  },
  {
    number: '02',
    title: 'Configurez votre espace',
    description: 'Personnalisez votre environnement, importez vos produits, invitez votre equipe et configurez les integrations.',
    icon: Settings,
    gradient: 'from-violet-500 to-purple-500',
    iconBg: 'rgba(124,58,237,0.12)',
  },
  {
    number: '03',
    title: 'Lancez et developpez',
    description: 'Mettez en ligne vos produits personnalises et developpez sans effort au fur et a mesure que votre entreprise grandit.',
    icon: Rocket,
    gradient: 'from-emerald-500 to-cyan-500',
    iconBg: 'rgba(16,185,129,0.12)',
  },
];

export function HowItWorksNew() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32 bg-dark-bg overflow-hidden">
      {/* Background orbs */}
      <GlowOrb
        className="-top-20 left-1/2 -translate-x-1/2"
        color="rgba(124,58,237,0.06)"
        size="700px"
        blur={120}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal direction="up">
          <PremiumSectionHeader
            badge="Comment ca marche"
            title={
              <>
                Lancez-vous en{' '}
                <GradientText variant="violet" className="font-editorial italic">
                  3 etapes simples
                </GradientText>
              </>
            }
            subtitle="De zero au lancement en un temps record."
            className="mb-16 sm:mb-20"
          />
        </ScrollReveal>

        {/* Steps */}
        <div className="max-w-4xl mx-auto space-y-5">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <ScrollReveal
                key={step.number}
                direction="left"
                delay={index * 120}
              >
                <TiltCard
                  tiltStrength={4}
                  glareColor="rgba(99,102,241,0.06)"
                  className="h-full"
                >
                  <div className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 md:gap-10 p-6 sm:p-8 md:p-10 h-full">
                    {/* Hover gradient */}
                    <div
                      className={`absolute inset-0 rounded-[inherit] bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`}
                    />

                    {/* Number */}
                    <div className="relative z-10 flex-shrink-0">
                      <span
                        className={`text-5xl sm:text-6xl md:text-7xl font-extrabold bg-gradient-to-br ${step.gradient} bg-clip-text text-transparent font-editorial`}
                      >
                        {step.number}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 flex-1">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">{step.title}</h3>
                      <p className="text-sm md:text-base text-white/50 leading-relaxed">{step.description}</p>
                    </div>

                    {/* Icon */}
                    <div className="relative z-10 flex-shrink-0 hidden sm:block">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center"
                        style={{ background: step.iconBg }}
                      >
                        <Icon className="w-6 h-6 text-white/80" />
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Bottom glow separator */}
        <div className="mt-24 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
      </div>
    </section>
  );
}
