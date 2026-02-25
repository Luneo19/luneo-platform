'use client';

import React, { memo } from 'react';
import {
  Eye,
  Heart,
  Zap,
  Shield,
  Users,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHero, SectionHeader, FeatureCard } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';
import { useI18n } from '@/i18n/useI18n';

const TEAM_ROLE_KEYS = ['ceo', 'cto', 'headOfDesign', 'leadEngineer', 'productManager', 'uxDesigner'] as const;
const TEAM_COLORS = ['blue', 'purple', 'green', 'blue', 'purple', 'green'] as const;

const TIMELINE_FR = [
  { period: '2024 Q1', title: "Le constat", desc: 'Des équipes support débordées, des délais qui explosent, des clients frustrés.' },
  { period: '2024 Q2', title: 'Premier agent IA', desc: 'Un prototype simple qui répond plus vite et plus juste qu’un script classique.' },
  { period: '2024 Q3', title: 'Premiers résultats client', desc: 'Des tickets résolus automatiquement et un vrai gain de temps pour les équipes.' },
  { period: '2024 Q4', title: 'Plateforme Luneo', desc: 'Passage du prototype à une plateforme multi-canaux, prête pour la production.' },
  { period: '2025', title: 'Scale B2B', desc: 'Déploiements sur plusieurs secteurs avec exigences sécurité et conformité.' },
  { period: '2026', title: 'Agent IA OS', desc: 'Une orchestration complète : support, ventes, opérations et analytics.' },
] as const;

const TIMELINE_EN = [
  { period: '2024 Q1', title: 'The trigger', desc: 'Support teams were overloaded, response time was growing, and customers were frustrated.' },
  { period: '2024 Q2', title: 'First AI agent', desc: 'A simple prototype answering faster and more accurately than static scripts.' },
  { period: '2024 Q3', title: 'First customer wins', desc: 'Automated ticket resolution with measurable time savings for teams.' },
  { period: '2024 Q4', title: 'Luneo platform', desc: 'From prototype to multi-channel platform, ready for production workloads.' },
  { period: '2025', title: 'B2B scale', desc: 'Rollouts across industries with enterprise security and governance requirements.' },
  { period: '2026', title: 'AI Agent OS', desc: 'Full orchestration across support, sales, operations and analytics.' },
] as const;

function AboutPageContent() {
  const { t, locale } = useI18n();
  const isEn = locale === 'en';
  const timeline = isEn ? TIMELINE_EN : TIMELINE_FR;

  const values = [
    { icon: <Zap className="w-6 h-6" />, titleKey: 'innovation' as const, descKey: 'innovationDesc', color: 'orange' as const },
    { icon: <Heart className="w-6 h-6" />, titleKey: 'simplicity' as const, descKey: 'simplicityDesc', color: 'pink' as const },
    { icon: <Shield className="w-6 h-6" />, titleKey: 'reliability' as const, descKey: 'reliabilityDesc', color: 'blue' as const },
    { icon: <Users className="w-6 h-6" />, titleKey: 'support' as const, descKey: 'supportDesc', color: 'purple' as const },
  ];

  return (
    <>
      <PageHero
        title={
          isEn
            ? 'AI agents should create value, not complexity'
            : 'Les agents IA doivent créer de la valeur, pas de la complexité'
        }
        description={
          isEn
            ? 'Luneo was built to help teams handle more requests with better quality, without emergency hiring. We turn internal knowledge into production-ready AI agents that resolve, assist and convert.'
            : "Luneo est née d'un besoin simple : aider les équipes à absorber plus de demandes, avec une meilleure qualité, sans recruter en urgence. Nous transformons vos connaissances internes en agents IA opérationnels qui résolvent, assistent et convertissent."
        }
        gradient="from-blue-600 via-purple-600 to-pink-600"
      />

      {/* Vision & Impact */}
      <section className="dark-section relative noise-overlay py-24 sm:py-32">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-12">
              <Eye className="w-16 h-16 mx-auto mb-6 text-purple-400" />
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
                {isEn ? 'A mission focused on business impact' : 'Une mission orientée impact business'}
              </h2>
              <p className="text-slate-300 leading-relaxed">
                {isEn
                  ? 'Our goal is not to replace teams, but to give them back time for high-value conversations.'
                  : "Notre objectif n'est pas de remplacer les équipes, mais de leur redonner du temps pour les conversations à forte valeur."}
              </p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
            <ScrollReveal delay={0}>
              <Card className="p-6 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] text-center" data-animate="fade-up">
                <p className="text-2xl sm:text-3xl font-bold text-white">-63 %</p>
                <p className="text-slate-400 text-sm mt-1">{isEn ? 'average resolution time' : 'temps moyen de résolution'}</p>
              </Card>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <Card className="p-6 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] text-center" data-animate="fade-up">
                <p className="text-2xl sm:text-3xl font-bold text-white">+38 %</p>
                <p className="text-slate-400 text-sm mt-1">
                  {isEn ? 'support team productivity' : 'productivité des équipes support'}
                </p>
              </Card>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <Card className="p-6 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] text-center" data-animate="fade-up">
                <p className="text-2xl sm:text-3xl font-bold text-white">24/7</p>
                <p className="text-slate-400 text-sm mt-1">{isEn ? 'customer support coverage' : 'couverture service client'}</p>
              </Card>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <Card className="p-6 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] text-center" data-animate="fade-up">
                <p className="text-2xl sm:text-3xl font-bold text-white">-28 %</p>
                <p className="text-slate-400 text-sm mt-1">{isEn ? 'annual operational cost' : 'coût opérationnel annuel'}</p>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="dark-section relative noise-overlay py-24 sm:py-32">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader
            title={t('public.about.valuesTitle')}
            subtitle={t('public.about.valuesSubtitle')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <FeatureCard
                key={value.titleKey}
                icon={value.icon}
                title={t(`public.about.${value.titleKey}`)}
                description={t(`public.about.${value.descKey}`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="dark-section relative noise-overlay py-24 sm:py-32">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader
            title={t('public.about.historyTitle')}
            subtitle={t('public.about.historySubtitle')}
          />
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {timeline.map((milestone, i) => (
                <ScrollReveal key={milestone.period + milestone.title} delay={i * 100}>
                  <div className="flex gap-6" data-animate="fade-right" data-delay={i * 100}>
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm text-center px-1">
                        {milestone.period}
                      </div>
                    </div>
                    <div className="flex-1 pb-8 border-l-2 border-white/[0.04] pl-6">
                      <h3 className="text-2xl font-bold mb-2 text-white">{milestone.title}</h3>
                      <p className="text-slate-300">{milestone.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="dark-section relative noise-overlay py-24 sm:py-32">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader
            title={t('public.about.teamTitle')}
            subtitle={
              isEn
                ? 'A product, AI and ops team with one obsession: measurable production outcomes, not just promises.'
                : "Une équipe produit, IA et ops qui construit avec une obsession : des résultats mesurables en production, pas juste des promesses."
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {TEAM_ROLE_KEYS.map((roleKey, i) => (
              <ScrollReveal key={roleKey} delay={i * 100}>
                <Card className="p-6 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] text-center hover:-translate-y-1 transition-all" data-animate="fade-up" data-delay={i * 100}>
                  <div className={`w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br ${
                    TEAM_COLORS[i] === 'blue' ? 'from-blue-500 to-cyan-500' :
                    TEAM_COLORS[i] === 'purple' ? 'from-purple-500 to-pink-500' :
                    'from-green-500 to-emerald-500'
                  } flex items-center justify-center text-white font-bold text-2xl`}>
                    {roleKey.slice(0, 2).toUpperCase()}
                  </div>
                  <h3 className="text-xl font-bold mb-1 text-white">{t(`public.about.teamRoles.${roleKey}`)}</h3>
                  <p className="text-slate-400 text-sm">
                    {isEn
                      ? 'Focused on customer value, reliability and fast execution.'
                      : "Focus sur la valeur client, la fiabilité et la vitesse d'exécution."}
                  </p>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Notre promesse */}
      <section className="dark-section relative noise-overlay py-24 sm:py-32">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <ScrollReveal>
              <Heart className="w-16 h-16 mx-auto mb-6 text-purple-400" />
              <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-white">
                {isEn ? 'Our product promise' : 'Notre promesse produit'}
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed">
                {isEn
                  ? 'Give you a platform that understands your processes, integrates with your stack, and proves ROI in weeks. Fewer repetitive tickets, higher satisfaction, and teams focused on strategic work.'
                  : "Vous donner une plateforme qui comprend vos processus, s'intègre à vos outils et prouve son ROI en quelques semaines. Moins de tickets répétitifs, plus de satisfaction client, et des équipes qui reprennent la main sur les sujets stratégiques."}
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <CTASectionNew />
    </>
  );
}

const MemoizedAboutPageContent = memo(AboutPageContent);

export default function AboutPage() {
  return (
    <ErrorBoundary level="page" componentName="AboutPage">
      <MemoizedAboutPageContent />
    </ErrorBoundary>
  );
}
