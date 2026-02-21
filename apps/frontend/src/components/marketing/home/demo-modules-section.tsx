'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Camera, Box, Sparkles, BarChart3, Wand2, ArrowRight } from 'lucide-react';
import {
  ScrollReveal,
  TiltCard,
  MagneticButton,
  GradientText,
  PremiumSectionHeader,
  GlowOrb,
} from '@/components/ui/premium';

const demoModules = [
  {
    id: 'virtual-try-on',
    title: 'Virtual Try-On',
    description: 'Vos clients essaient vos produits en direct depuis leur navigateur. Réduisez les retours de 40% grâce à l\'essayage virtuel AR.',
    icon: Camera,
    href: '/demo/virtual-try-on',
    gradient: 'from-cyan-500 to-indigo-500',
    badge: 'Réalité Augmentée',
    iconBg: 'rgba(6,182,212,0.12)',
    features: ['Tracking facial haute précision', 'Compatible mobile et desktop', 'Intégration en 1 clic', '-40% de retours produits'],
  },
  {
    id: '3d-configurator',
    title: 'Configurateur 3D',
    description: 'Offrez à vos clients une visualisation produit photoréaliste à 360°. +35% de taux de conversion en moyenne.',
    icon: Box,
    href: '/demo/3d-configurator',
    gradient: 'from-violet-500 to-purple-500',
    badge: 'Rendu temps réel',
    iconBg: 'rgba(124,58,237,0.12)',
    features: ['Rendu photoréaliste PBR', 'Matériaux personnalisables', 'Export haute qualité', '+35% de conversions'],
  },
  {
    id: 'ai-agents',
    title: 'Agents IA',
    description: 'Automatisez la création de designs, l\'analyse de données et le support client avec nos agents IA spécialisés.',
    icon: Sparkles,
    href: '/demo/ai-agents',
    gradient: 'from-pink-500 to-rose-500',
    badge: 'Intelligence Artificielle',
    iconBg: 'rgba(236,72,153,0.12)',
    features: ['Génération de designs IA', 'Analyses prédictives', 'Support automatisé 24/7', 'Personnalisation contextuelle'],
  },
  {
    id: 'smart-analytics',
    title: 'Smart Analytics',
    description: 'Suivez chaque interaction, identifiez les tendances et optimisez vos campagnes avec des insights actionnables.',
    icon: BarChart3,
    href: '/demo/analytics',
    gradient: 'from-emerald-500 to-teal-500',
    badge: 'Business Intelligence',
    iconBg: 'rgba(16,185,129,0.12)',
    features: ['Funnels de conversion', 'Prédictions IA', 'Détection d\'anomalies', 'Recommandations temps réel'],
  },
  {
    id: 'ar-experience',
    title: 'Experience AR',
    description: 'Créez des expériences immersives en réalité augmentée directement intégrées à votre boutique e-commerce.',
    icon: Wand2,
    href: '/demo/ar-experience',
    gradient: 'from-amber-500 to-orange-500',
    badge: 'WebXR',
    iconBg: 'rgba(245,158,11,0.12)',
    features: ['Placement de produits en AR', 'Compatible tous navigateurs', 'Integration Shopify native', 'Engagement x3'],
  },
];

function DemoModulesSectionContent() {
  return (
    <section id="demo-modules" className="relative py-24 sm:py-32 bg-dark-bg overflow-hidden">
      {/* Background orbs */}
      <GlowOrb
        className="-bottom-40 left-1/4"
        color="rgba(99,102,241,0.06)"
        size="500px"
        blur={100}
      />
      <GlowOrb
        className="-top-20 right-1/4"
        color="rgba(124,58,237,0.05)"
        size="400px"
        blur={80}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal direction="up">
          <PremiumSectionHeader
            badge="Demos interactives"
            title={
              <>
                Explorez nos{' '}
                <GradientText variant="cyan" className="font-editorial italic">
                  modules en direct
                </GradientText>
              </>
            }
            subtitle="Testez nos 5 modules principaux avec des démos interactives. Aucun compte requis."
            className="mb-16 sm:mb-20"
          />
        </ScrollReveal>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-12">
          {demoModules.map((mod, index) => {
            const Icon = mod.icon;
            return (
              <ScrollReveal
                key={mod.id}
                direction="up"
                delay={index * 80}
              >
                <TiltCard
                  tiltStrength={5}
                  glareColor="rgba(99,102,241,0.06)"
                  className="h-full"
                >
                  <div className="group relative p-6 sm:p-8 h-full flex flex-col">
                    {/* Hover gradient */}
                    <div
                      className={`absolute inset-0 rounded-[inherit] bg-gradient-to-br ${mod.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`}
                    />

                    <div className="relative z-10 flex flex-col flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-5">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ background: mod.iconBg }}
                        >
                          <Icon className="w-5 h-5 text-white/80" />
                        </div>
                        <span
                          className={`px-2.5 py-1 bg-gradient-to-r ${mod.gradient} text-white text-[10px] font-bold rounded-full`}
                        >
                          {mod.badge}
                        </span>
                      </div>

                      {/* Content */}
                      <h3 className="text-lg font-bold text-white mb-2">{mod.title}</h3>
                      <p className="text-sm text-white/50 leading-relaxed mb-4">{mod.description}</p>

                      {/* Features */}
                      <ul className="space-y-2 mb-6 flex-1">
                        {mod.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-white/50">
                            <span className={`w-1 h-1 rounded-full bg-gradient-to-r ${mod.gradient} flex-shrink-0`} />
                            {f}
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <Link href={mod.href}>
                        <MagneticButton variant="secondary" size="md" className="w-full">
                          Tester la démo
                          <ArrowRight className="w-3.5 h-3.5" />
                        </MagneticButton>
                      </Link>
                    </div>
                  </div>
                </TiltCard>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Main CTA */}
        <ScrollReveal direction="up" delay={200}>
          <div className="text-center">
            <Link href="/demo">
              <MagneticButton variant="primary" size="xl" glow>
                Voir toutes les démos
                <ArrowRight className="w-5 h-5" />
              </MagneticButton>
            </Link>
          </div>
        </ScrollReveal>

        {/* Bottom glow separator */}
        <div className="mt-24 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
      </div>
    </section>
  );
}

const DemoModulesSectionContentMemo = memo(DemoModulesSectionContent);

export function DemoModulesSection() {
  return <DemoModulesSectionContentMemo />;
}
