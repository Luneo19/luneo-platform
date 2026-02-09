'use client';

import { UserPlus, Settings, Rocket } from 'lucide-react';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';

const steps = [
  {
    number: '01',
    title: 'Creez votre compte',
    description: "Inscrivez-vous en quelques secondes avec juste votre email. Aucune carte bancaire requise pour commencer l'essai gratuit de 14 jours.",
    icon: UserPlus,
    gradient: 'from-purple-500 to-fuchsia-500',
  },
  {
    number: '02',
    title: 'Configurez votre espace',
    description: 'Personnalisez votre environnement, importez vos produits, invitez votre equipe et configurez les integrations.',
    icon: Settings,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    number: '03',
    title: 'Lancez et developpez',
    description: 'Mettez en ligne vos produits personnalises et developpez sans effort au fur et a mesure que votre entreprise grandit.',
    icon: Rocket,
    gradient: 'from-emerald-500 to-teal-500',
  },
];

export function HowItWorksNew() {
  return (
    <section id="how-it-works" className="dark-section relative py-20 sm:py-24 md:py-32 noise-overlay">
      <div className="absolute inset-0 gradient-mesh-purple opacity-30" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal animation="fade-up">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-semibold rounded-full mb-4 sm:mb-5 uppercase tracking-wider">
              Comment ca marche
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-5">
              <span className="text-white">Lancez-vous en </span>
              <span className="italic text-gradient-purple">3 etapes simples</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-400 px-2">
              De zero au lancement en un temps record.
            </p>
          </div>
        </ScrollReveal>

        {/* Steps */}
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <ScrollReveal
                key={step.number}
                animation="fade-left"
                staggerIndex={index}
                staggerDelay={150}
                delay={100}
              >
                <div className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 md:gap-10 p-6 sm:p-8 md:p-10 bg-dark-card/60 backdrop-blur-sm rounded-2xl border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300">
                  {/* Number */}
                  <div className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gradient-purple flex-shrink-0 font-display">
                    {step.number}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1.5 sm:mb-2">{step.title}</h3>
                    <p className="text-xs sm:text-sm md:text-base text-slate-500 leading-relaxed">{step.description}</p>
                  </div>

                  {/* Icon */}
                  <div className="flex-shrink-0 hidden sm:block">
                    <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.15))' }}>
                      <Icon className="w-5 sm:w-6 h-5 sm:h-6 text-white/70" />
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Glowing separator */}
        <div className="mt-16 sm:mt-24 glow-separator" />
      </div>
    </section>
  );
}
