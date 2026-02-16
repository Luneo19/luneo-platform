'use client';

import { Palette, Box, Glasses, Sparkles, BarChart3, Puzzle, Zap, Shield, Globe } from 'lucide-react';
import {
  ScrollReveal,
  TiltCard,
  GradientText,
  PremiumSectionHeader,
  GlowOrb,
  OrbitingCircles,
  OrbitIcon,
} from '@/components/ui/premium';

const FEATURES = [
  {
    label: 'Design Studio',
    title: 'Editeur 2D puissant et intuitif',
    description:
      'Creez des designs professionnels avec notre editeur visuel drag-and-drop. Outils avances, calques, effets et export haute resolution.',
    icon: Palette,
    gradient: 'from-indigo-500 to-violet-500',
    iconBg: 'rgba(99,102,241,0.12)',
  },
  {
    label: 'Configurateur 3D',
    title: 'Visualisation interactive en temps reel',
    description:
      'Offrez a vos clients une experience 3D immersive avec rotation, zoom et personnalisation en direct sur vos produits.',
    icon: Box,
    gradient: 'from-violet-500 to-purple-500',
    iconBg: 'rgba(124,58,237,0.12)',
  },
  {
    label: 'Virtual Try-On',
    title: 'Essayage augmente avec camera',
    description:
      'Technologie AR avancee avec 468 points de suivi facial. Vos clients essaient les produits en direct depuis leur appareil.',
    icon: Glasses,
    gradient: 'from-purple-500 to-pink-500',
    iconBg: 'rgba(168,85,247,0.12)',
  },
  {
    label: 'IA Generative',
    title: 'Intelligence artificielle creative',
    description:
      "Generez des designs uniques, des variantes et des suggestions automatiques grace a notre moteur d'IA integre.",
    icon: Sparkles,
    gradient: 'from-cyan-500 to-indigo-500',
    iconBg: 'rgba(6,182,212,0.12)',
  },
  {
    label: 'Analytics',
    title: 'Insights de performance avances',
    description:
      'Suivez les conversions, le comportement utilisateur et le ROI de vos produits personnalises en temps reel.',
    icon: BarChart3,
    gradient: 'from-emerald-500 to-teal-500',
    iconBg: 'rgba(16,185,129,0.12)',
  },
  {
    label: 'Integrations',
    title: 'Connectez vos outils favoris',
    description:
      'Shopify, WooCommerce, Stripe, Printful, Zapier et 100+ integrations pour automatiser votre workflow.',
    icon: Puzzle,
    gradient: 'from-indigo-500 to-cyan-500',
    iconBg: 'rgba(99,102,241,0.12)',
  },
];

export function FeaturesSectionNew() {
  return (
    <section id="features" className="relative py-24 sm:py-32 bg-dark-bg overflow-hidden">
      {/* Background orbs */}
      <GlowOrb
        className="-top-40 -right-40"
        color="rgba(124,58,237,0.08)"
        size="600px"
        blur={100}
      />
      <GlowOrb
        className="-bottom-40 -left-40"
        color="rgba(99,102,241,0.06)"
        size="500px"
        blur={100}
      />

      {/* Decorative orbiting background (desktop only) */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/3 opacity-20 pointer-events-none hidden xl:block">
        <OrbitingCircles
          radius={200}
          duration={40}
          pathColor="rgba(99, 102, 241, 0.15)"
          showPath={true}
          pathGlow
        >
          <OrbitIcon glowColor="rgba(99, 102, 241, 0.2)" size={32}>
            <Zap className="w-4 h-4 text-indigo-400" />
          </OrbitIcon>
          <OrbitIcon glowColor="rgba(139, 92, 246, 0.2)" size={32}>
            <Shield className="w-4 h-4 text-violet-400" />
          </OrbitIcon>
          <OrbitIcon glowColor="rgba(6, 182, 212, 0.2)" size={32}>
            <Globe className="w-4 h-4 text-cyan-400" />
          </OrbitIcon>
        </OrbitingCircles>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal direction="up">
          <PremiumSectionHeader
            badge="Fonctionnalites"
            title={
              <>
                Tout pour creer des{' '}
                <GradientText variant="violet" className="font-editorial italic">
                  produits exceptionnels
                </GradientText>
              </>
            }
            subtitle="6 modules puissants couvrant l'integralite du cycle de personnalisation produit."
            className="mb-16 sm:mb-20"
          />
        </ScrollReveal>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <ScrollReveal
                key={feature.label}
                direction="up"
                delay={index * 80}
              >
                <TiltCard
                  tiltStrength={5}
                  glareColor={`rgba(99,102,241,0.08)`}
                  className="h-full"
                >
                  <div className="group relative p-6 sm:p-8 h-full">
                    {/* Hover gradient background */}
                    <div
                      className={`absolute inset-0 rounded-[inherit] bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`}
                    />

                    <div className="relative z-10">
                      {/* Label */}
                      <span
                        className={`inline-block text-[10px] font-bold uppercase tracking-[0.15em] bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent mb-4`}
                      >
                        {feature.label}
                      </span>

                      {/* Icon with electric glow ring */}
                      <div className="relative w-12 h-12 mb-5">
                        {/* Glow ring */}
                        <div
                          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{
                            background: feature.iconBg,
                            boxShadow: `0 0 20px ${feature.iconBg}, 0 0 40px ${feature.iconBg}`,
                          }}
                        />
                        <div
                          className="relative w-12 h-12 rounded-xl flex items-center justify-center border border-white/[0.06] group-hover:border-white/[0.12] transition-colors duration-500"
                          style={{ background: feature.iconBg }}
                        >
                          <Icon className="w-5 h-5 text-white/80 group-hover:text-white transition-colors duration-300" />
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-white mb-3">
                        {feature.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-white/50 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </TiltCard>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Bottom glow separator */}
        <div className="mt-24 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
      </div>
    </section>
  );
}
