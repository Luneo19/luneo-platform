'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Brain, BookOpen, BarChart3, Plug, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  glowColor: string;
  bullets: string[];
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: 'easeOut' }}
      className={`group relative h-full rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.05] hover:shadow-2xl ${feature.glowColor}`}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <div
          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
        >
          <feature.icon className="w-7 h-7 text-white" />
        </div>

        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors duration-300">
          {feature.title}
        </h3>

        <p className="text-white/60 mb-6 leading-relaxed text-sm">
          {feature.description}
        </p>

        <ul className="space-y-2.5">
          {feature.bullets.map((bullet, j) => (
            <li key={j} className="flex items-center gap-2.5 text-sm text-white/50">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center">
                <Check className="w-3 h-3 text-emerald-400" />
              </div>
              {bullet}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export function FeaturesSectionNew() {
  const { locale } = useI18n();
  const isEn = locale === 'en';
  const features: Feature[] = isEn
    ? [
        {
          icon: Brain,
          title: 'Intelligent Agents',
          description:
            'RAG-powered conversational agents across multiple LLMs (GPT-4, Claude, Mistral) with answers grounded in your data.',
          gradient: 'from-indigo-500 to-cyan-500',
          glowColor: 'group-hover:shadow-indigo-500/10',
          bullets: ['Multi-model orchestration', 'Retrieval Augmented Generation', 'Tone and policy control'],
        },
        {
          icon: BookOpen,
          title: 'Knowledge Base',
          description:
            'Import documents, websites and APIs. Automatic indexing keeps answers fresh and relevant.',
          gradient: 'from-cyan-500 to-emerald-500',
          glowColor: 'group-hover:shadow-cyan-500/10',
          bullets: ['PDF, DOCX, HTML, CSV import', 'Website crawling', 'Automatic sync'],
        },
        {
          icon: BarChart3,
          title: 'Real-time Analytics',
          description:
            'Track performance, customer satisfaction and operational impact from one dashboard.',
          gradient: 'from-emerald-500 to-indigo-500',
          glowColor: 'group-hover:shadow-emerald-500/10',
          bullets: ['Auto-resolution rate', 'CSAT score', 'Trending topics analysis'],
        },
        {
          icon: Plug,
          title: 'Native Integrations',
          description:
            'Connect your stack in minutes: Shopify, Slack, Zendesk, HubSpot and 30+ integrations.',
          gradient: 'from-indigo-500 to-emerald-500',
          glowColor: 'group-hover:shadow-indigo-500/10',
          bullets: ['E-commerce (Shopify, WooCommerce)', 'Communication (Slack, Teams)', 'CRM (HubSpot, Salesforce)'],
        },
      ]
    : [
        {
          icon: Brain,
          title: 'Agents Intelligents',
          description:
            'Agents conversationnels alimentés par RAG et multi-modèles (GPT-4, Claude, Mistral). Réponses précises basées sur vos données.',
          gradient: 'from-indigo-500 to-cyan-500',
          glowColor: 'group-hover:shadow-indigo-500/10',
          bullets: ['Multi-modèles IA', 'Retrieval Augmented Generation', 'Personnalisation du ton et du style'],
        },
        {
          icon: BookOpen,
          title: 'Base de Connaissances',
          description:
            'Importez vos documents, sites web et APIs. Indexation vectorielle automatique pour des réponses toujours à jour.',
          gradient: 'from-cyan-500 to-emerald-500',
          glowColor: 'group-hover:shadow-cyan-500/10',
          bullets: ['Import PDF, DOCX, HTML, CSV', 'Crawling de sites web', 'Synchronisation automatique'],
        },
        {
          icon: BarChart3,
          title: 'Analytics Temps Réel',
          description:
            'Tableau de bord complet avec métriques de performance, satisfaction client et insights actionables.',
          gradient: 'from-emerald-500 to-indigo-500',
          glowColor: 'group-hover:shadow-emerald-500/10',
          bullets: ['Taux de résolution automatique', 'Score de satisfaction client', 'Analyse des sujets trending'],
        },
        {
          icon: Plug,
          title: 'Intégrations Natives',
          description:
            'Connectez vos outils existants en quelques clics. Shopify, Slack, Zendesk, HubSpot et 30+ intégrations.',
          gradient: 'from-indigo-500 to-emerald-500',
          glowColor: 'group-hover:shadow-indigo-500/10',
          bullets: ['E-commerce (Shopify, WooCommerce)', 'Communication (Slack, Teams)', 'CRM (HubSpot, Salesforce)'],
        },
      ];
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: '-60px' });

  return (
    <section id="features" className="relative py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center mb-20"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium tracking-wide uppercase mb-6">
            {isEn ? 'Features' : 'Fonctionnalités'}
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mt-4 mb-6">
            {isEn ? 'Everything you need for ' : 'Tout ce dont vous avez besoin pour '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
              {isEn ? 'your AI agents' : 'vos agents IA'}
            </span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            {isEn
              ? 'A complete platform to build, train and deploy production-grade conversational agents.'
              : 'Une plateforme complète pour créer, entraîner et déployer des agents conversationnels intelligents.'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, i) => (
            <FeatureCard key={i} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
