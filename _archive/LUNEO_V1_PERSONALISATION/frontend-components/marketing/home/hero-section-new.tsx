'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Play, Sparkles, Palette, Box, Glasses, BarChart3, Zap, Shield, Globe, Cpu } from 'lucide-react';
import {
  MagneticButton,
  ScrollReveal,
  ParticleField,
  AuroraBackground,
  GradientText,
  SectionBadge,
  Typewriter,
  AnimatedCounter,
  OrbitingCircles,
  OrbitIcon,
  ElectricGrid,
} from '@/components/ui/premium';
import { ProductShowcase } from './product-showcase';

const HERO_WORDS = [
  'personnalisation',
  'visualisation 3D',
  'essayage virtuel',
  'design IA',
];

const STATS = [
  { value: 35, suffix: '%', label: 'Conversions en plus' },
  { value: 40, suffix: '%', label: 'Retours en moins' },
  { value: 5, prefix: '<', suffix: 's', label: 'Par génération' },
  { value: 99.9, suffix: '%', decimals: 1, label: 'Uptime garanti' },
];

export function HeroSectionNew() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  return (
    <section className="relative min-h-screen overflow-hidden bg-dark-bg">
      {/* Aurora background orbs */}
      <AuroraBackground className="absolute inset-0" variant="default" />

      {/* Particle mesh */}
      {mounted && (
        <ParticleField
          particleCount={50}
          speed={0.2}
          connectDistance={100}
          style="constellation"
        />
      )}

      {/* Electric grid background (Madgicx-style) */}
      {mounted && (
        <ElectricGrid
          cellSize={80}
          variant="radial"
          opacity={0.6}
          pulseCount={10}
          speed={1.2}
          showNodes={true}
          mouseInteraction={true}
        />
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 lg:pt-44 pb-20 sm:pb-28">
        {/* Badge */}
        <ScrollReveal direction="down" duration={600}>
          <div className="flex justify-center mb-8">
            <SectionBadge>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Découvrez Luneo 2.0 — La plateforme nouvelle génération</span>
            </SectionBadge>
          </div>
        </ScrollReveal>

        {/* Main Headline */}
        <ScrollReveal direction="up" delay={100} duration={800}>
          <div className="max-w-5xl mx-auto text-center mb-8">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-8">
              <span className="text-white">La </span>
              <GradientText variant="indigo" className="font-editorial italic">
                <Typewriter texts={HERO_WORDS} speed={70} deleteSpeed={40} pauseTime={2500} />
              </GradientText>
              <br />
              <span className="text-white">propulsée par l&apos;</span>
              <GradientText variant="violet">IA</GradientText>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-white/60 max-w-3xl mx-auto leading-relaxed mb-10">
              Ajoutez la personnalisation produit à votre boutique en 5 minutes.
              <span className="text-white/80 font-medium"> Customizer 2D, IA générative, 3D, AR — du design client à la livraison.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/register">
                <MagneticButton variant="primary" size="xl" glow>
                  Essayer gratuitement
                  <ArrowRight className="w-5 h-5" />
                </MagneticButton>
              </Link>
              <Link href="/demo/customizer">
                <MagneticButton variant="secondary" size="xl">
                  <Play className="w-5 h-5" />
                  Voir la démo
                </MagneticButton>
              </Link>
            </div>
          </div>
        </ScrollReveal>

        {/* Product Showcase with Orbiting Elements */}
        <ScrollReveal direction="up" delay={250} duration={900}>
          <div className="relative mb-20">
            {/* Orbiting tech icons around the showcase */}
            <div className="absolute inset-0 pointer-events-none hidden lg:block">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                {/* Outer orbit - larger radius, slower */}
                <OrbitingCircles
                  radius={380}
                  duration={30}
                  pathColor="rgba(99, 102, 241, 0.08)"
                  pathGlow
                >
                  <OrbitIcon glowColor="rgba(99, 102, 241, 0.3)" size={44}>
                    <Palette className="w-5 h-5 text-indigo-400" />
                  </OrbitIcon>
                  <OrbitIcon glowColor="rgba(139, 92, 246, 0.3)" size={44}>
                    <Box className="w-5 h-5 text-violet-400" />
                  </OrbitIcon>
                  <OrbitIcon glowColor="rgba(6, 182, 212, 0.3)" size={44}>
                    <Glasses className="w-5 h-5 text-cyan-400" />
                  </OrbitIcon>
                  <OrbitIcon glowColor="rgba(99, 102, 241, 0.3)" size={44}>
                    <BarChart3 className="w-5 h-5 text-indigo-400" />
                  </OrbitIcon>
                </OrbitingCircles>

                {/* Inner orbit - smaller radius, faster, reverse */}
                <OrbitingCircles
                  radius={280}
                  duration={22}
                  reverse
                  pathColor="rgba(139, 92, 246, 0.06)"
                  pathGlow
                >
                  <OrbitIcon glowColor="rgba(236, 72, 153, 0.3)" size={36}>
                    <Zap className="w-4 h-4 text-pink-400" />
                  </OrbitIcon>
                  <OrbitIcon glowColor="rgba(6, 182, 212, 0.3)" size={36}>
                    <Shield className="w-4 h-4 text-cyan-400" />
                  </OrbitIcon>
                  <OrbitIcon glowColor="rgba(99, 102, 241, 0.3)" size={36}>
                    <Globe className="w-4 h-4 text-indigo-400" />
                  </OrbitIcon>
                </OrbitingCircles>
              </div>
            </div>

            {/* Showcase itself */}
            <div className="relative z-10">
              <ProductShowcase />
            </div>
          </div>
        </ScrollReveal>

        {/* Stats with electric glow */}
        <ScrollReveal direction="up" delay={100}>
          <div className="relative">
            {/* Ambient glow behind stats */}
            <div className="absolute inset-0 -inset-x-8 bg-gradient-to-r from-transparent via-indigo-500/[0.04] to-transparent rounded-3xl blur-2xl" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto mb-16 relative">
              {STATS.map((stat, i) => (
                <div
                  key={i}
                  className="group relative text-center p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm hover:border-indigo-500/20 transition-all duration-500"
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-indigo-500/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {/* Node dot at top-center */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-indigo-500/40 animate-node-pulse" />
                  <div className="relative">
                    <div className="text-3xl sm:text-4xl font-bold text-white mb-1 font-editorial">
                      {stat.prefix || ''}
                      <AnimatedCounter
                        end={stat.value}
                        suffix={stat.suffix}
                        decimals={stat.decimals || 0}
                        duration={2500}
                      />
                    </div>
                    <div className="text-sm text-white/40">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Trusted by separator */}
        <ScrollReveal direction="up" delay={200}>
          <div className="text-center">
            <p className="text-sm text-white/30 uppercase tracking-widest font-medium mb-6">
              Adopté par des centaines de marques innovantes
            </p>
            <div className="flex items-center justify-center gap-10 flex-wrap opacity-30">
              {['Nike', 'Adidas', 'Zara', 'H&M', 'Uniqlo', 'Gucci'].map((name) => (
                <span key={name} className="text-white/60 text-sm font-semibold tracking-wider uppercase">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Bottom glow separator */}
        <div className="mt-24 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      </div>
    </section>
  );
}
