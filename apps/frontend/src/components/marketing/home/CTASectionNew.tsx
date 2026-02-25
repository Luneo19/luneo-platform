'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Shield, Lock, Headphones } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';

export function CTASectionNew() {
  const { locale } = useI18n();
  const isEn = locale === 'en';
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const trustBadges = isEn
    ? [
        { icon: Shield, label: 'GDPR compliant' },
        { icon: Lock, label: 'AES-256 encryption' },
        { icon: Headphones, label: '24/7 support' },
      ]
    : [
        { icon: Shield, label: 'RGPD Conforme' },
        { icon: Lock, label: 'Chiffrement AES-256' },
        { icon: Headphones, label: 'Support 24/7' },
      ];

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-600/[0.07] blur-[100px]"
        />
        <motion.div
          animate={{
            x: [0, -20, 0],
            y: [0, 30, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-cyan-600/[0.06] blur-[100px]"
        />
        <motion.div
          animate={{
            x: [0, 15, 0],
            y: [0, 15, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-emerald-600/[0.05] blur-[100px]"
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            {isEn ? 'Ready to automate ' : 'Prêt à automatiser '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
              {isEn ? 'your support' : 'votre support'}
            </span>
            {' '}?
          </h2>

          <p className="text-lg sm:text-xl text-white/60 max-w-xl mx-auto mb-10">
            {isEn
              ? 'Join 2,450+ companies using Luneo to deliver exceptional customer support, 24/7.'
              : 'Rejoignez 2,450+ entreprises qui utilisent Luneo pour offrir un support client exceptionnel, 24/7.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14">
            <Link
              href="/register"
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-cyan-600 to-emerald-600" />
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10">{isEn ? 'Create my first agent' : 'Créer mon premier agent'}</span>
              <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>

            <Link
              href="/pricing"
              className="group inline-flex items-center gap-2 text-white/60 hover:text-white text-lg font-medium transition-colors duration-200"
            >
              {isEn ? 'View pricing' : 'Voir la tarification'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
            className="flex flex-wrap items-center justify-center gap-6 sm:gap-8"
          >
            {trustBadges.map((badge, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-sm text-white/50"
              >
                <badge.icon className="w-4 h-4 text-emerald-400/70" />
                {badge.label}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
