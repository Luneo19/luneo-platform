'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Palette, Box, Camera, Sparkles, Store, Megaphone, Share2, Briefcase, ArrowRight, Zap, Shield, Globe } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHero, SectionHeader, FeatureCard } from '@/components/marketing/shared';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';
import { AnimatedBorder } from '@/components/ui/animated-border';
import {
  GlowOrb,
  GradientText,
  PremiumSectionHeader,
  TiltCard,
  MagneticButton,
  OrbitingCircles,
  OrbitIcon,
} from '@/components/ui/premium';

function SolutionsHubPageContent() {
  const solutions = useMemo(() => [
    { 
      title: 'Virtual Try-On', 
      description: 'Essayage virtuel en temps reel avec MediaPipe et realite augmentee pour une experience client immersive', 
      icon: Camera,
      href: '/solutions/virtual-try-on', 
      gradient: 'from-cyan-500 to-indigo-500',
      iconBg: 'rgba(6,182,212,0.12)',
    },
    { 
      title: 'Configurator 3D', 
      description: 'Visualisation 3D photorealiste de vos produits avec Three.js et rendu haute qualite', 
      icon: Box,
      href: '/solutions/configurator-3d', 
      gradient: 'from-violet-500 to-purple-500',
      iconBg: 'rgba(124,58,237,0.12)',
    },
    { 
      title: 'Visual Customizer', 
      description: 'Editeur visuel puissant avec Konva.js pour personnaliser vos produits en temps reel', 
      icon: Palette,
      href: '/solutions/customizer', 
      gradient: 'from-indigo-500 to-violet-500',
      iconBg: 'rgba(99,102,241,0.12)',
    },
    { 
      title: '3D Asset Hub', 
      description: 'Gestion professionnelle de vos assets 3D avec bibliotheque centralisee et optimisee', 
      icon: Sparkles,
      href: '/solutions/3d-asset-hub', 
      gradient: 'from-emerald-500 to-teal-500',
      iconBg: 'rgba(16,185,129,0.12)',
    },
    { 
      title: 'AI Design Hub', 
      description: 'Generez des milliers de designs avec l\'IA DALL-E 3 en quelques minutes', 
      icon: Sparkles,
      href: '/solutions/ai-design-hub', 
      gradient: 'from-pink-500 to-rose-500',
      iconBg: 'rgba(236,72,153,0.12)',
    },
    { 
      title: 'Branding', 
      description: 'Brand kit complet pour maintenir la coherence visuelle de votre marque', 
      icon: Briefcase,
      href: '/solutions/branding', 
      gradient: 'from-indigo-500 to-cyan-500',
      iconBg: 'rgba(99,102,241,0.12)',
    },
    { 
      title: 'E-commerce', 
      description: 'Integrations natives avec Shopify, WooCommerce et autres plateformes', 
      icon: Store,
      href: '/solutions/ecommerce', 
      gradient: 'from-emerald-500 to-green-500',
      iconBg: 'rgba(16,185,129,0.12)',
    },
    { 
      title: 'Marketing', 
      description: 'Campagnes marketing automatisees avec generation de visuels en masse', 
      icon: Megaphone,
      href: '/solutions/marketing', 
      gradient: 'from-amber-500 to-orange-500',
      iconBg: 'rgba(245,158,11,0.12)',
    },
    { 
      title: 'Social Media', 
      description: 'Gestion et creation de contenu pour tous vos reseaux sociaux', 
      icon: Share2,
      href: '/solutions/social', 
      gradient: 'from-pink-500 to-fuchsia-500',
      iconBg: 'rgba(236,72,153,0.12)',
    },
  ], []);

  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-28 pb-12 sm:pt-36 sm:pb-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-500/[0.06] rounded-full blur-[140px]" />
          <div className="absolute top-20 right-1/4 w-[300px] h-[300px] bg-violet-500/[0.04] rounded-full blur-[100px]" />
        </div>

        {/* Orbiting decorative elements */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden lg:block opacity-25">
          <OrbitingCircles radius={280} duration={30} pathColor="rgba(99,102,241,0.1)" pathGlow>
            <OrbitIcon glowColor="rgba(99,102,241,0.2)" size={32}>
              <Zap className="w-4 h-4 text-indigo-400" />
            </OrbitIcon>
            <OrbitIcon glowColor="rgba(139,92,246,0.2)" size={32}>
              <Shield className="w-4 h-4 text-violet-400" />
            </OrbitIcon>
            <OrbitIcon glowColor="rgba(6,182,212,0.2)" size={32}>
              <Globe className="w-4 h-4 text-cyan-400" />
            </OrbitIcon>
          </OrbitingCircles>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-indigo-300 text-xs font-semibold uppercase tracking-widest">Solutions</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]">
            Nos{' '}
            <GradientText variant="violet" className="font-editorial italic">
              Solutions
            </GradientText>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-white/50 leading-relaxed">
            9 solutions professionnelles pour transformer votre business e-commerce et offrir des experiences de personnalisation exceptionnelles
          </p>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="relative py-16 sm:py-24 overflow-hidden">
        <GlowOrb className="-bottom-40 left-1/4" color="rgba(99,102,241,0.06)" size="500px" blur={100} />
        <GlowOrb className="-top-20 right-1/4" color="rgba(124,58,237,0.05)" size="400px" blur={80} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {solutions.map((solution, index) => {
              const Icon = solution.icon;
              return (
                <ScrollReveal key={solution.title} animation="fade-up" delay={index * 80}>
                  <TiltCard tiltStrength={5} glareColor="rgba(99,102,241,0.06)" className="h-full">
                    <div className="group relative p-6 sm:p-8 h-full flex flex-col">
                      {/* Hover gradient */}
                      <div className={`absolute inset-0 rounded-[inherit] bg-gradient-to-br ${solution.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`} />
                      <div className="relative z-10 flex flex-col flex-1">
                        {/* Icon with glow */}
                        <div className="relative w-12 h-12 mb-5">
                          <div
                            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{ background: solution.iconBg, boxShadow: `0 0 20px ${solution.iconBg}` }}
                          />
                          <div
                            className="relative w-12 h-12 rounded-xl flex items-center justify-center border border-white/[0.06] group-hover:border-white/[0.12] transition-colors duration-500"
                            style={{ background: solution.iconBg }}
                          >
                            <Icon className="w-5 h-5 text-white/80 group-hover:text-white transition-colors duration-300" />
                          </div>
                        </div>
                        <span className={`inline-block text-[10px] font-bold uppercase tracking-[0.15em] bg-gradient-to-r ${solution.gradient} bg-clip-text text-transparent mb-3`}>
                          Solution
                        </span>
                        <h3 className="text-lg font-bold text-white mb-2">{solution.title}</h3>
                        <p className="text-sm text-white/50 leading-relaxed mb-6 flex-1">{solution.description}</p>
                        <Link href={solution.href}>
                          <MagneticButton variant="secondary" size="md" className="w-full">
                            Decouvrir
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
        </div>

        {/* Bottom glow separator */}
        <div className="mt-24 mx-auto max-w-7xl px-4 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
      </section>
    </>
  );
}

export default function SolutionsHubPage() {
  return (
    <ErrorBoundary level="page" componentName="SolutionsHubPage">
      <SolutionsHubPageContent />
    </ErrorBoundary>
  );
}
