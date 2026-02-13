'use client';

import React, { memo } from 'react';
import {
  Target,
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
const MILESTONE_KEYS = ['launch', 'ai', 'threeD', 'scale'] as const;
const MILESTONE_YEARS = ['2024', '2024', '2024', '2025'] as const;
const TEAM_COLORS = ['blue', 'purple', 'green', 'blue', 'purple', 'green'] as const;

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
        title={t('public.about.missionTitle')}
        description={t('public.about.missionDescription')}
        badge={t('public.about.badge')}
        gradient="from-blue-600 via-purple-600 to-pink-600"
      />

      {/* Mission & Vision */}
      <section className="dark-section relative noise-overlay py-24 sm:py-32">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ScrollReveal>
              <Card className="p-8 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04]" data-animate="fade-right">
                <Target className="w-16 h-16 mb-6 text-purple-400" />
                <h2 className="text-3xl font-bold mb-4 text-white">{t('public.about.missionCardTitle')}</h2>
                <p className="text-slate-300 leading-relaxed">{t('public.about.missionCardDescription')}</p>
              </Card>
            </ScrollReveal>
            <ScrollReveal>
              <Card className="p-8 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04]" data-animate="fade-left">
                <Eye className="w-16 h-16 mb-6 text-purple-400" />
                <h2 className="text-3xl font-bold mb-4 text-white">{t('public.about.visionCardTitle')}</h2>
                <p className="text-slate-300 leading-relaxed">{t('public.about.visionCardDescription')}</p>
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
            description={t('public.about.valuesSubtitle')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <FeatureCard
                key={value.titleKey}
                icon={value.icon}
                title={t(`public.about.${value.titleKey}`)}
                description={t(`public.about.${value.descKey}`)}
                color={value.color}
                delay={index * 100}
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
            description={t('public.about.historySubtitle')}
          />
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {MILESTONE_KEYS.map((key, i) => (
                <ScrollReveal key={key} delay={i * 100}>
                  <div className="flex gap-6" data-animate="fade-right" data-delay={i * 100}>
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                        {MILESTONE_YEARS[i]}
                      </div>
                    </div>
                    <div className="flex-1 pb-8 border-l-2 border-white/[0.04] pl-6">
                      <h3 className="text-2xl font-bold mb-2 text-white">{t(`public.about.milestones.${key}`)}</h3>
                      <p className="text-slate-300">{t(`public.about.milestones.${key}Desc`)}</p>
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
            description={t('public.about.teamSubtitle')}
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
                  <h3 className="text-xl font-bold mb-2 text-white">{t('public.about.companyName')}</h3>
                  <p className="text-slate-300">{t(`public.about.teamRoles.${roleKey}`)}</p>
                </Card>
              </ScrollReveal>
            ))}
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
