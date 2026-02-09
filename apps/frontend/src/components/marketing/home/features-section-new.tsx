'use client';

import { Palette, Box, Glasses, Sparkles, BarChart3, Puzzle } from 'lucide-react';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';
import { AnimatedBorder } from '@/components/ui/animated-border';

const FEATURES = [
  {
    label: 'Design Studio',
    title: 'Editeur 2D puissant et intuitif',
    description: 'Creez des designs professionnels avec notre editeur visuel drag-and-drop. Outils avances, calques, effets et export haute resolution.',
    icon: Palette,
    gradient: 'from-purple-500 to-fuchsia-500',
  },
  {
    label: 'Configurateur 3D',
    title: 'Visualisation interactive en temps reel',
    description: 'Offrez a vos clients une experience 3D immersive avec rotation, zoom et personnalisation en direct sur vos produits.',
    icon: Box,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    label: 'Virtual Try-On',
    title: 'Essayage augmente avec camera',
    description: "Technologie AR avancee avec 468 points de suivi facial. Vos clients essaient les produits en direct depuis leur appareil.",
    icon: Glasses,
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    label: 'AI Generation',
    title: 'Intelligence artificielle creative',
    description: "Generez des designs uniques, des variantes et des suggestions automatiques grace a notre moteur d'IA integre.",
    icon: Sparkles,
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    label: 'Analytics',
    title: 'Insights de performance avances',
    description: 'Suivez les conversions, le comportement utilisateur et le ROI de vos produits personnalises en temps reel.',
    icon: BarChart3,
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    label: 'Integrations',
    title: 'Connectez vos outils favoris',
    description: "Shopify, WooCommerce, Stripe, Printful, Zapier et 100+ integrations pour automatiser votre workflow.",
    icon: Puzzle,
    gradient: 'from-violet-500 to-purple-500',
  },
];

export function FeaturesSectionNew() {
  return (
    <section id="features" className="dark-section relative py-20 sm:py-24 md:py-32 noise-overlay">
      <div className="absolute inset-0 gradient-mesh-purple" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal animation="fade-up">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] sm:text-xs font-semibold rounded-full mb-4 sm:mb-5 uppercase tracking-wider">
              Fonctionnalites
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-5">
              <span className="text-white">Tout pour creer des </span>
              <span className="italic text-gradient-purple">produits exceptionnels</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-400 leading-relaxed px-2">
              6 modules puissants qui couvrent l&apos;integralite du cycle de vie de vos produits personnalises.
            </p>
          </div>
        </ScrollReveal>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <ScrollReveal
                key={feature.label}
                animation="fade-up"
                staggerIndex={index}
                staggerDelay={80}
                delay={100}
              >
                <AnimatedBorder hoverOnly speed="slow" className="h-full">
                  <div className="group relative backdrop-blur-sm p-5 sm:p-7 rounded-2xl transition-all duration-300 hover:-translate-y-1 h-full">
                    {/* Hover glow */}
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />

                    <div className="relative z-10">
                      {/* Label */}
                      <span className={`inline-block text-[10px] font-bold uppercase tracking-[0.15em] bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent mb-3 sm:mb-4`}>
                        {feature.label}
                      </span>

                      {/* Icon */}
                      <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl flex items-center justify-center mb-4 sm:mb-5" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(236,72,153,0.1))' }}>
                        <Icon className="w-4 sm:w-5 h-4 sm:h-5 text-white/70" />
                      </div>

                      {/* Title */}
                      <h3 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3">{feature.title}</h3>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </AnimatedBorder>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Glowing separator */}
        <div className="mt-16 sm:mt-24 glow-separator" />
      </div>
    </section>
  );
}
