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

const TIMELINE = [
  { period: '2024 Q1', title: "L'idée naît", desc: "Née d'une vraie frustration." },
  { period: '2024 Q2', title: 'Premier prototype', desc: 'Des nuits blanches à construire le rêve.' },
  { period: '2024 Q3', title: '100 premiers utilisateurs', desc: 'Le moment de la validation.' },
  { period: '2024 Q4', title: 'Agents IA conversationnels', desc: 'Le tournant.' },
  { period: '2025', title: 'Scale international', desc: "L'expansion internationale." },
  { period: '2026', title: 'Plateforme complète', desc: 'La vision réalisée.' },
] as const;

function AboutPageContent() {
  const { t } = useI18n();

  const values = [
    { icon: <Zap className="w-6 h-6" />, titleKey: 'innovation' as const, descKey: 'innovationDesc', color: 'orange' as const },
    { icon: <Heart className="w-6 h-6" />, titleKey: 'simplicity' as const, descKey: 'simplicityDesc', color: 'pink' as const },
    { icon: <Shield className="w-6 h-6" />, titleKey: 'reliability' as const, descKey: 'reliabilityDesc', color: 'blue' as const },
    { icon: <Users className="w-6 h-6" />, titleKey: 'support' as const, descKey: 'supportDesc', color: 'purple' as const },
  ];

  return (
    <>
      <PageHero
        title="Chaque marque mérite les meilleurs outils"
        description={'Quand nous avons lancé notre première entreprise, nous aurions tout donné pour avoir accès à des outils comme Luneo. Aujourd\'hui, nous offrons à des milliers de marques la possibilité d\'optimiser leur chiffre d\'affaires et de grandir sereinement.'}
        gradient="from-blue-600 via-purple-600 to-pink-600"
      />

      {/* Vision & Impact */}
      <section className="dark-section relative noise-overlay py-24 sm:py-32">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-12">
              <Eye className="w-16 h-16 mx-auto mb-6 text-purple-400" />
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">Des milliers de marques font confiance à Luneo</h2>
              <p className="text-slate-300 leading-relaxed">Notre plateforme accompagne les marques au quotidien avec des résultats concrets.</p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
            <ScrollReveal delay={0}>
              <Card className="p-6 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] text-center" data-animate="fade-up">
                <p className="text-2xl sm:text-3xl font-bold text-white">+10 000</p>
                <p className="text-slate-400 text-sm mt-1">agents IA déployés</p>
              </Card>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <Card className="p-6 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] text-center" data-animate="fade-up">
                <p className="text-2xl sm:text-3xl font-bold text-white">98,5 %</p>
                <p className="text-slate-400 text-sm mt-1">uptime</p>
              </Card>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <Card className="p-6 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] text-center" data-animate="fade-up">
                <p className="text-2xl sm:text-3xl font-bold text-white">12</p>
                <p className="text-slate-400 text-sm mt-1">pays</p>
              </Card>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <Card className="p-6 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] text-center" data-animate="fade-up">
                <p className="text-2xl sm:text-3xl font-bold text-white">+40 %</p>
                <p className="text-slate-400 text-sm mt-1">conversions</p>
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
              {TIMELINE.map((milestone, i) => (
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
            subtitle="Des passionnés qui croient que chaque marque mérite les mêmes armes que les plus grandes. Nous construisons Luneo au quotidien, avec la même exigence que nous aimerions la trouver ailleurs."
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
                  <p className="text-slate-400 text-sm">Au service de votre réussite, chaque jour.</p>
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
              <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-white">Notre promesse</h2>
              <p className="text-slate-300 text-lg leading-relaxed">
                {'Nous ne vendons pas juste un outil. Nous construisons le pont entre votre vision et la réalité. Chaque fonctionnalité est pensée pour vous faire gagner du temps, de l\'argent, et de la tranquillité.'}
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
