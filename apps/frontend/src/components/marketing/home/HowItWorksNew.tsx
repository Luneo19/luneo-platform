'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Upload, Settings, Rocket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Step {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  iconColor: string;
}

const STEPS: Step[] = [
  {
    number: '01',
    icon: Upload,
    title: 'Importez vos données',
    description:
      "Chargez vos documents, connectez votre site web ou vos APIs. Notre moteur d'indexation vectorielle traite automatiquement vos données.",
    gradient: 'from-indigo-500 to-cyan-500',
    iconColor: 'text-indigo-400',
  },
  {
    number: '02',
    icon: Settings,
    title: 'Configurez votre agent',
    description:
      'Choisissez un template ou créez votre agent depuis zéro. Définissez le ton, les langues et les règles de réponse.',
    gradient: 'from-cyan-500 to-emerald-500',
    iconColor: 'text-cyan-400',
  },
  {
    number: '03',
    icon: Rocket,
    title: 'Déployez sur vos canaux',
    description:
      'Widget web, email, Slack, WhatsApp — déployez votre agent sur tous vos canaux en un clic. Votre support client est opérationnel.',
    gradient: 'from-emerald-500 to-indigo-500',
    iconColor: 'text-emerald-400',
  },
];

function StepCard({ step, index }: { step: Step; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.2, ease: 'easeOut' }}
      className="relative flex-1 text-center lg:text-left"
    >
      <div className="flex flex-col items-center lg:items-start">
        <span
          className={`text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r ${step.gradient} opacity-20 select-none leading-none mb-4`}
        >
          {step.number}
        </span>

        <div className="relative mb-6">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} bg-opacity-10 flex items-center justify-center border border-white/[0.08]`}
            style={{ background: `linear-gradient(135deg, rgba(99,102,241,0.12), rgba(6,182,212,0.08))` }}
          >
            <motion.div
              animate={isInView ? { rotate: [0, -5, 5, 0] } : {}}
              transition={{ duration: 0.6, delay: index * 0.2 + 0.4, ease: 'easeInOut' }}
            >
              <step.icon className={`w-8 h-8 ${step.iconColor}`} />
            </motion.div>
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-3">
          {step.title}
        </h3>
        <p className="text-white/60 leading-relaxed text-sm max-w-xs">
          {step.description}
        </p>
      </div>
    </motion.div>
  );
}

export function HowItWorksNew() {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' });
  const lineRef = useRef<HTMLDivElement>(null);
  const lineInView = useInView(lineRef, { once: true, margin: '-40px' });

  return (
    <section id="how-it-works" className="relative py-32 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center mb-20"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium tracking-wide uppercase mb-6">
            Comment ça marche
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mt-4 mb-6">
            Déployez votre premier agent en{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              3 étapes
            </span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            De l&apos;import de vos données au déploiement sur vos canaux, en seulement 15 minutes.
          </p>
        </motion.div>

        <div className="relative">
          <div ref={lineRef} className="hidden lg:block absolute top-[72px] left-[12%] right-[12%] h-px overflow-hidden">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={lineInView ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
              className="h-full w-full origin-left bg-gradient-to-r from-indigo-500/40 via-cyan-500/40 to-emerald-500/40"
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-12 lg:gap-8">
            {STEPS.map((step, i) => (
              <StepCard key={i} step={step} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
