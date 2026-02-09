'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Palette, Box, Glasses, BarChart3 } from 'lucide-react';
import { ScrollReveal, AnimatedCounter, useParallax } from '@/components/marketing/shared/scroll-reveal';
import { AnimatedBorder, AnimatedBorderCTA } from '@/components/ui/animated-border';
import { PartnerLogos } from '@/components/marketing/shared/partner-logos';
import { Showcase3D } from './showcase-3d';

// =============================================================================
// DATA
// =============================================================================

const PRODUCT_TABS = [
  { id: 'design', label: 'Design Studio', icon: Palette, color: 'from-purple-500 to-fuchsia-500' },
  { id: '3d', label: 'Configurateur 3D', icon: Box, color: 'from-blue-500 to-cyan-500' },
  { id: 'ar', label: 'Virtual Try-On', icon: Glasses, color: 'from-pink-500 to-rose-500' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'from-emerald-500 to-teal-500' },
] as const;

const STATS = [
  { value: '10K+', label: 'Utilisateurs actifs' },
  { value: '500+', label: 'Marques' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9/5', label: 'Note clients' },
];

// =============================================================================
// HERO COMPONENT
// =============================================================================

export function HeroSectionNew() {
  const [activeTab, setActiveTab] = useState(0);
  const [mounted, setMounted] = useState(false);
  const parallaxRef = useParallax(0.15);

  useEffect(() => { setMounted(true); }, []);

  // Auto-rotate tabs
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % PRODUCT_TABS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="dark-section relative min-h-screen pt-24 sm:pt-28 pb-16 sm:pb-20 noise-overlay">
      {/* Background gradient mesh */}
      <div className="absolute inset-0 gradient-mesh-hero" />

      {/* Animated gradient orbs - smaller on mobile */}
      <div ref={parallaxRef} className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[300px] sm:w-[450px] lg:w-[600px] h-[300px] sm:h-[450px] lg:h-[600px] rounded-full bg-purple-500/[0.07] blur-[80px] sm:blur-[120px] -top-[100px] sm:-top-[200px] -right-[50px] sm:-right-[100px] animate-float gpu-accelerated" />
        <div className="absolute w-[250px] sm:w-[400px] lg:w-[500px] h-[250px] sm:h-[400px] lg:h-[500px] rounded-full bg-pink-500/[0.06] blur-[60px] sm:blur-[100px] bottom-[10%] -left-[80px] sm:-left-[150px] animate-float gpu-accelerated" style={{ animationDelay: '-7s' }} />
        <div className="absolute w-[200px] sm:w-[300px] lg:w-[400px] h-[200px] sm:h-[300px] lg:h-[400px] rounded-full bg-blue-500/[0.05] blur-[50px] sm:blur-[80px] top-[40%] left-[30%] animate-float gpu-accelerated" style={{ animationDelay: '-14s' }} />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(168,85,247,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(168,85,247,0.3) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <ScrollReveal animation="fade-down" duration={500}>
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/[0.04] border border-white/[0.08] rounded-full text-xs sm:text-sm font-medium text-slate-300 backdrop-blur-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Decouvrez Luneo 2.0</span>
              <ArrowRight className="w-3 h-3 text-purple-400" />
            </div>
          </div>
        </ScrollReveal>

        {/* Main Heading */}
        <ScrollReveal animation="fade-up" delay={100} duration={700}>
          <div className="max-w-4xl mx-auto text-center mb-6 sm:mb-8">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight mb-5 sm:mb-6">
              <span className="text-white">Creez des </span>
              <span className="italic text-gradient-purple">experiences produit</span>
              <span className="text-white block mt-1">exceptionnelles</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 px-2">
              La plateforme tout-en-un qui aide les marques a concevoir, developper et livrer
              des experiences de personnalisation avec une rapidite et une qualite inegalees.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-14">
              <Link href="/register" className="w-full sm:w-auto">
                <AnimatedBorderCTA speed="normal">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-bold shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  >
                    Essai gratuit
                    <ArrowRight className="ml-2 w-4 sm:w-5 h-4 sm:h-5" />
                  </Button>
                </AnimatedBorderCTA>
              </Link>
              <Link href="/demo" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold border-white/[0.1] text-slate-300 hover:text-white hover:bg-white/[0.04] hover:border-white/[0.2]"
                >
                  <Play className="mr-2 w-4 sm:w-5 h-4 sm:h-5" />
                  Voir la demo
                </Button>
              </Link>
            </div>
          </div>
        </ScrollReveal>

        {/* Product Tabs Showcase */}
        <ScrollReveal animation="fade-up" delay={250} duration={800}>
          <div className="max-w-5xl mx-auto mb-12 sm:mb-16">
            {/* Tab Buttons - horizontally scrollable on mobile */}
            <div className="flex justify-start sm:justify-center gap-1.5 sm:gap-2 mb-6 sm:mb-8 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              {PRODUCT_TABS.map((tab, idx) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(idx)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                      activeTab === idx
                        ? 'bg-white/[0.1] text-white border border-white/[0.12] shadow-glow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    <span className="hidden xs:inline sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content - Dashboard Mockup */}
            <div className="relative">
              <AnimatedBorder speed="slow" rounded="rounded-xl sm:rounded-2xl">
                <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
                  {/* Browser chrome */}
                  <div className="flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-2.5 sm:py-3.5 bg-white/[0.02] border-b border-white/[0.04]">
                    <div className="flex gap-1.5 sm:gap-2">
                      <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-red-500/60" />
                      <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-yellow-500/60" />
                      <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-green-500/60" />
                    </div>
                    <div className="flex-1 text-center text-[10px] sm:text-xs text-slate-500 font-medium">
                      luneo.app/{PRODUCT_TABS[activeTab].id}
                    </div>
                  </div>

                  {/* 3D Content area */}
                  <div className="min-h-[260px] sm:min-h-[350px] md:min-h-[400px]">
                    <Showcase3D activeTab={activeTab} />
                  </div>
                </div>
              </AnimatedBorder>

              {/* Glow effect behind mockup */}
              <div className={`absolute inset-0 -z-10 rounded-2xl blur-3xl opacity-20 bg-gradient-to-br ${PRODUCT_TABS[activeTab].color} transition-all duration-700 gpu-accelerated`} />
            </div>
          </div>
        </ScrollReveal>

        {/* Stats Bar */}
        <ScrollReveal animation="fade-up" delay={100}>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 md:gap-12 mb-12 sm:mb-16">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center min-w-[70px]">
                <AnimatedCounter
                  value={stat.value}
                  className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-display"
                />
                <div className="text-[10px] sm:text-xs md:text-sm text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Client Logos Marquee */}
        <ScrollReveal animation="fade" delay={200}>
          <PartnerLogos />
        </ScrollReveal>

        {/* Glowing separator at bottom */}
        <div className="mt-16 sm:mt-20 glow-separator" />
      </div>
    </section>
  );
}

// ProductShowcase replaced by Showcase3D component (showcase-3d/index.tsx)
