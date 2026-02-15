'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Camera, Box, Sparkles, BarChart3, Wand2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';
import { AnimatedBorder, AnimatedBorderCTA } from '@/components/ui/animated-border';

const demoModules = [
  {
    id: 'virtual-try-on',
    title: 'Virtual Try-On',
    description: 'Vos clients essaient vos produits en direct depuis leur navigateur. Reduisez les retours de 40% grace a l\'essayage virtuel AR.',
    icon: Camera,
    href: '/demo/virtual-try-on',
    gradient: 'from-cyan-500 to-blue-500',
    badge: 'Realite Augmentee',
    features: ['Tracking facial haute precision', 'Compatible mobile et desktop', 'Integration en 1 clic', '-40% de retours produits'],
  },
  {
    id: '3d-configurator',
    title: 'Configurateur 3D',
    description: 'Offrez a vos clients une visualisation produit photorealiste a 360°. +35% de taux de conversion en moyenne.',
    icon: Box,
    href: '/demo/3d-configurator',
    gradient: 'from-purple-500 to-pink-500',
    badge: 'Rendu temps reel',
    features: ['Rendu photorealiste PBR', 'Materiaux personnalisables', 'Export haute qualite', '+35% de conversions'],
  },
  {
    id: 'ai-agents',
    title: 'Agents IA',
    description: 'Automatisez la creation de designs, l\'analyse de donnees et le support client avec nos agents IA specialises.',
    icon: Sparkles,
    href: '/demo/ai-agents',
    gradient: 'from-pink-500 to-rose-500',
    badge: 'Intelligence Artificielle',
    features: ['Generation de designs IA', 'Analyses predictives', 'Support automatise 24/7', 'Personnalisation contextuelle'],
  },
  {
    id: 'smart-analytics',
    title: 'Smart Analytics',
    description: 'Suivez chaque interaction, identifiez les tendances et optimisez vos campagnes avec des insights actionnables.',
    icon: BarChart3,
    href: '/demo/analytics',
    gradient: 'from-emerald-500 to-teal-500',
    badge: 'Business Intelligence',
    features: ['Funnels de conversion', 'Predictions IA', 'Detection d\'anomalies', 'Recommandations temps reel'],
  },
  {
    id: 'ar-experience',
    title: 'Experience AR',
    description: 'Creez des experiences immersives en realite augmentee directement integrees a votre boutique e-commerce.',
    icon: Wand2,
    href: '/demo/ar-experience',
    gradient: 'from-amber-500 to-orange-500',
    badge: 'WebXR',
    features: ['Placement de produits en AR', 'Compatible tous navigateurs', 'Integration Shopify native', 'Engagement x3'],
  },
];

function DemoModulesSectionContent() {
  return (
    <section id="demo-modules" className="dark-section relative py-20 sm:py-24 md:py-32 noise-overlay">
      <div className="absolute inset-0 gradient-mesh-purple opacity-30" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal animation="fade-up">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] sm:text-xs font-semibold rounded-full mb-4 sm:mb-5 uppercase tracking-wider">
              Demos interactives
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-5">
              <span className="text-white">Explorez nos </span>
              <span className="italic text-gradient-purple">modules en direct</span>
            </h2>
            <p className="text-base sm:text-lg text-white/70 leading-relaxed px-2">
              Testez nos 5 modules principaux avec des demos interactives. Aucun compte requis.
            </p>
          </div>
        </ScrollReveal>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-10 sm:mb-12">
          {demoModules.map((mod, index) => {
            const Icon = mod.icon;
            return (
              <ScrollReveal
                key={mod.id}
                animation="fade-up"
                staggerIndex={index}
                staggerDelay={80}
                delay={100}
              >
                <AnimatedBorder hoverOnly speed="slow" className="h-full">
                  <div className="group relative backdrop-blur-sm rounded-2xl p-5 sm:p-7 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${mod.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />

                    <div className="relative z-10 flex flex-col flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4 sm:mb-5">
                        <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.15))' }}>
                          <Icon className="w-4 sm:w-5 h-4 sm:h-5 text-white/70" />
                        </div>
                        <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 bg-gradient-to-r ${mod.gradient} text-white text-[9px] sm:text-[10px] font-bold rounded-full`}>
                          {mod.badge}
                        </span>
                      </div>

                      {/* Content */}
                      <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2">{mod.title}</h3>
                      <p className="text-xs sm:text-sm text-white/70 leading-relaxed mb-3 sm:mb-4">{mod.description}</p>

                      {/* Features */}
                      <ul className="space-y-1.5 sm:space-y-2 mb-5 sm:mb-6 flex-1">
                        {mod.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-[10px] sm:text-xs text-white/60">
                            <span className="w-1 h-1 rounded-full bg-purple-500 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <Link href={mod.href}>
                        <AnimatedBorderCTA speed="normal" variant="white">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full bg-white text-black hover:bg-white/90 hover:text-black border-0 font-semibold text-xs sm:text-sm"
                          >
                            Tester la demo
                            <ArrowRight className="w-3 h-3 ml-1.5" />
                          </Button>
                        </AnimatedBorderCTA>
                      </Link>
                    </div>
                  </div>
                </AnimatedBorder>
              </ScrollReveal>
            );
          })}
        </div>

        {/* CTA */}
        <ScrollReveal animation="zoom-in" delay={200}>
          <div className="text-center">
            <Link href="/demo">
              <AnimatedBorderCTA speed="normal">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-bold shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  Voir toutes les demos
                  <ArrowRight className="ml-2 w-4 sm:w-5 h-4 sm:h-5" />
                </Button>
              </AnimatedBorderCTA>
            </Link>
          </div>
        </ScrollReveal>

        {/* Glowing separator */}
        <div className="mt-16 sm:mt-24 glow-separator" />
      </div>
    </section>
  );
}

const DemoModulesSectionContentMemo = memo(DemoModulesSectionContent);

export function DemoModulesSection() {
  return <DemoModulesSectionContentMemo />;
}
