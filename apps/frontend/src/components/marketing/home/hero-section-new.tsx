'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Palette, Box, Glasses, BarChart3, Star } from 'lucide-react';
import { ScrollReveal, AnimatedCounter, useParallax } from '@/components/marketing/shared/scroll-reveal';

// =============================================================================
// DATA
// =============================================================================

const PRODUCT_TABS = [
  { id: 'design', label: 'Design Studio', icon: Palette, color: 'from-purple-500 to-fuchsia-500' },
  { id: '3d', label: 'Configurateur 3D', icon: Box, color: 'from-blue-500 to-cyan-500' },
  { id: 'ar', label: 'Virtual Try-On', icon: Glasses, color: 'from-pink-500 to-rose-500' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'from-emerald-500 to-teal-500' },
] as const;

const CLIENT_LOGOS = [
  'Shopify', 'WooCommerce', 'Stripe', 'Printful', 'Adobe', 'Figma',
  'Shopify', 'WooCommerce', 'Stripe', 'Printful', 'Adobe', 'Figma',
];

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
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-bold shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  Essai gratuit
                  <ArrowRight className="ml-2 w-4 sm:w-5 h-4 sm:h-5" />
                </Button>
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
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
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
              <div className="bg-dark-card rounded-xl sm:rounded-2xl border border-white/[0.06] overflow-hidden shadow-2xl shadow-black/40">
                {/* Browser chrome */}
                <div className="flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-2.5 sm:py-3.5 bg-white/[0.02] border-b border-white/[0.04]">
                  <div className="flex gap-1.5 sm:gap-2">
                    <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-red-500/60" />
                    <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-yellow-500/60" />
                    <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 text-center text-[10px] sm:text-xs text-slate-600 font-medium">
                    luneo.app/{PRODUCT_TABS[activeTab].id}
                  </div>
                </div>

                {/* Content area */}
                <div className="p-4 sm:p-6 md:p-8 min-h-[260px] sm:min-h-[350px] md:min-h-[400px] flex items-center justify-center">
                  <ProductShowcase activeTab={activeTab} />
                </div>
              </div>

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
                <div className="text-[10px] sm:text-xs md:text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Client Logos Marquee */}
        <ScrollReveal animation="fade" delay={200}>
          <div className="relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-dark-bg to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-dark-bg to-transparent z-10" />
            <div className="flex animate-marquee gap-8 sm:gap-12 items-center gpu-accelerated">
              {CLIENT_LOGOS.map((logo, i) => (
                <div key={i} className="flex-shrink-0 text-slate-600 text-xs sm:text-sm font-semibold tracking-wider uppercase opacity-50 hover:opacity-80 transition-opacity">
                  {logo}
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Glowing separator at bottom */}
        <div className="mt-16 sm:mt-20 glow-separator" />
      </div>
    </section>
  );
}

// =============================================================================
// PRODUCT SHOWCASE COMPONENT
// =============================================================================

function ProductShowcase({ activeTab }: { activeTab: number }) {
  const showcases = [
    // Design Studio
    <div key="design" className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      <div className="sm:col-span-2 bg-white/[0.03] rounded-xl p-4 sm:p-6 border border-white/[0.04]">
        <div className="text-xs text-purple-400 font-semibold mb-3 uppercase tracking-wider">Editeur 2D</div>
        <div className="space-y-2.5 sm:space-y-3">
          <div className="h-2.5 sm:h-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full w-3/4" />
          <div className="h-2.5 sm:h-3 bg-white/[0.04] rounded-full w-full" />
          <div className="h-2.5 sm:h-3 bg-white/[0.04] rounded-full w-2/3" />
        </div>
        <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-3">
          <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-white/[0.06]" />
          <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-lg bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border border-white/[0.06]" />
          <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-lg bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-white/[0.06]" />
        </div>
      </div>
      <div className="bg-white/[0.03] rounded-xl p-3 sm:p-4 border border-white/[0.04] flex flex-col justify-between">
        <div className="text-xs text-slate-500 mb-2">Couleurs</div>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {['bg-purple-500', 'bg-pink-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'].map((c, i) => (
            <div key={i} className={`w-full aspect-square rounded-lg ${c} opacity-60`} />
          ))}
        </div>
      </div>
    </div>,

    // 3D Configurator
    <div key="3d" className="w-full flex flex-col items-center">
      <div className="w-36 sm:w-48 h-36 sm:h-48 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/[0.06] flex items-center justify-center mb-4">
        <Box className="w-14 sm:w-20 h-14 sm:h-20 text-blue-400/60" />
      </div>
      <div className="flex gap-3 sm:gap-4 mt-4">
        {['Vue Face', 'Vue Cote', 'Vue Dos'].map((v) => (
          <div key={v} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white/[0.04] text-[10px] sm:text-xs text-slate-400 border border-white/[0.06]">{v}</div>
        ))}
      </div>
    </div>,

    // Virtual Try-On
    <div key="ar" className="w-full flex flex-col items-center">
      <div className="relative w-44 sm:w-56 h-44 sm:h-56 rounded-2xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-white/[0.06] flex items-center justify-center mb-4">
        <Glasses className="w-14 sm:w-20 h-14 sm:h-20 text-pink-400/60" />
        <div className="absolute -top-2 -right-2 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-[10px] text-green-400 font-semibold">LIVE</div>
      </div>
      <div className="text-xs sm:text-sm text-slate-400">Essayage en temps reel avec camera</div>
    </div>,

    // Analytics
    <div key="analytics" className="w-full grid grid-cols-2 gap-3 sm:gap-4">
      <div className="bg-white/[0.03] rounded-xl p-3 sm:p-5 border border-white/[0.04]">
        <div className="text-[10px] sm:text-xs text-emerald-400 font-semibold mb-1">Conversions</div>
        <div className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">+45.2%</div>
        <div className="flex items-end gap-0.5 sm:gap-1 h-12 sm:h-16">
          {[40, 55, 35, 70, 60, 85, 90].map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-emerald-500/40 to-emerald-400/20" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
      <div className="bg-white/[0.03] rounded-xl p-3 sm:p-5 border border-white/[0.04]">
        <div className="text-[10px] sm:text-xs text-blue-400 font-semibold mb-1">Revenue</div>
        <div className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">48.3K EUR</div>
        <svg viewBox="0 0 100 40" className="w-full h-12 sm:h-16">
          <path d="M0,35 Q15,30 25,25 T50,15 T75,10 T100,5" fill="none" stroke="url(#lg)" strokeWidth="2" />
          <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient></defs>
        </svg>
      </div>
    </div>,
  ];

  return (
    <div className="w-full transition-all duration-500 animate-fade-in" key={activeTab}>
      {showcases[activeTab]}
    </div>
  );
}
