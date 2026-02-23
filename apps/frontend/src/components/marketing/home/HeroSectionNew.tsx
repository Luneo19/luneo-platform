'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Play, Sparkles, Bot, Zap, Shield } from 'lucide-react';
import { AgentDemoShowcase } from './AgentDemoShowcase';
import { FireflyCTA } from '@/components/ui/firefly-cta';

const ROTATING_WORDS = [
  'votre Support Client',
  'votre E-commerce',
  'vos Ventes',
  'votre Marketing',
  'votre Support Technique',
  'votre FAQ',
];

const STATS = [
  { target: 2450, suffix: '+', label: 'Agents déployés', icon: Bot },
  { target: 1000000, suffix: '+', label: 'Conversations', icon: Zap },
  { target: 98, suffix: '%', label: 'Satisfaction', icon: Shield },
];

function AnimatedCounter({
  target,
  suffix,
  duration = 2,
  inView,
}: {
  target: number;
  suffix: string;
  duration?: number;
  inView: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, inView]);

  const display =
    target >= 1000000
      ? `${(count / 1000000).toFixed(1)}M`
      : target >= 1000
        ? count.toLocaleString('fr-FR')
        : count;

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}

export function HeroSectionNew() {
  const [wordIndex, setWordIndex] = useState(0);
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: '-40px' });

  useEffect(() => {
    const interval = setInterval(
      () => setWordIndex((i) => (i + 1) % ROTATING_WORDS.length),
      2500,
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center overflow-hidden bg-[#030014]">
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-[15%] left-[20%] w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-[120px]"
        animate={{ x: [0, 30, -20, 0], y: [0, -20, 15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[30%] right-[15%] w-[450px] h-[450px] rounded-full bg-indigo-500/15 blur-[120px]"
        animate={{ x: [0, -25, 20, 0], y: [0, 25, -15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[20%] left-[40%] w-[400px] h-[400px] rounded-full bg-emerald-500/12 blur-[120px]"
        animate={{ x: [0, 20, -30, 0], y: [0, -15, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#030014]" />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-32 pb-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2 mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-white/[0.08] to-cyan-500/0 animate-[text-shimmer_3s_linear_infinite] bg-[length:200%_100%]" />
            <Sparkles className="w-4 h-4 text-cyan-400 relative z-10" />
            <span className="text-sm text-white/70 font-medium relative z-10">
              Nouveau — Agents IA multi-langues disponibles
            </span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-6"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.1] tracking-tight">
            <span className="block">Déployez des agents IA pour</span>
            <span className="block mt-2 h-[1.2em] relative">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -24, filter: 'blur(4px)' }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="absolute inset-x-0 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-emerald-400"
                >
                  {ROTATING_WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-base sm:text-lg lg:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Créez, entraînez et déployez des agents conversationnels alimentés par vos données.{' '}
          <span className="text-white/80 font-medium">En 15 minutes, sans code.</span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <FireflyCTA color="rainbow" speed="normal">
            <Link
              href="/register"
              className="group relative inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10">Commencer gratuitement</span>
              <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </FireflyCTA>
          <Link
            href="/#demo"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-all duration-300"
          >
            <Play className="w-4 h-4" />
            Voir une démo
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          ref={statsRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-8 sm:gap-16"
        >
          {STATS.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1">
                <AnimatedCounter target={stat.target} suffix={stat.suffix} inView={statsInView} />
              </div>
              <div className="text-sm text-white/40 flex items-center gap-1.5 justify-center">
                <stat.icon className="w-3.5 h-3.5" />
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Agent Demo Showcase */}
        <AgentDemoShowcase />
      </div>
    </section>
  );
}
