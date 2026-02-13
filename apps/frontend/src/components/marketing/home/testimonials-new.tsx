'use client';

import { Star } from 'lucide-react';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';
import { AnimatedBorder } from '@/components/ui/animated-border';
import { TiltCard } from '@/components/ui/tilt-card';

// NOTE: Example testimonials for launch. Replace with real customer testimonials
// when available via CMS or testimonial collection tool (e.g., Trustpilot API)
const testimonials = [
  {
    quote: "Luneo a transforme notre experience client. +45% de conversions en 3 mois grace a la personnalisation en temps reel.",
    author: 'Sophie Laurent',
    role: 'E-commerce Director',
    company: 'Optic 2000',
    initials: 'SL',
    featured: false,
  },
  {
    quote: "Le meilleur investissement pour notre startup. Le configurateur 3D et le try-on AR ont revolutionne notre facon de vendre en ligne.",
    author: 'Marc Dubois',
    role: 'CEO',
    company: 'PrintShop Pro',
    initials: 'MD',
    featured: true,
  },
  {
    quote: "Integration en 2 jours, ROI positif des le premier mois. Le support est exceptionnel et les fonctionnalites sont impressionnantes.",
    author: 'Claire Moreau',
    role: 'Head of Digital',
    company: 'Bijoux Paris',
    initials: 'CM',
    featured: false,
  },
];

export function TestimonialsNew() {
  return (
    <section id="testimonials" className="dark-section relative py-20 sm:py-24 md:py-32 noise-overlay">
      <div className="absolute inset-0 gradient-mesh-purple opacity-50" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal animation="fade-up">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] sm:text-xs font-semibold rounded-full mb-4 sm:mb-5 uppercase tracking-wider">
              Temoignages
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-5">
              <span className="text-white">Apprecie par des </span>
              <span className="italic text-gradient-purple">milliers de marques</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-300 px-2">
              Decouvrez ce que nos clients ont a dire sur leur experience avec Luneo.
            </p>
          </div>
        </ScrollReveal>

        {/* Rating bar */}
        <ScrollReveal animation="fade-up" delay={100}>
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 mb-10 sm:mb-12">
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 sm:w-5 h-4 sm:h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-white font-bold text-base sm:text-lg">Excellent</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-white/10" />
            <span className="text-slate-300 text-xs sm:text-sm">Avis clients</span>
          </div>
        </ScrollReveal>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {testimonials.map((t, index) => (
            <ScrollReveal
              key={t.author}
              animation="fade-up"
              staggerIndex={index}
              staggerDelay={120}
              delay={150}
            >
              <TiltCard
                maxTilt={5}
                hoverScale={1.01}
                glowColor="rgba(168, 85, 247, 0.06)"
                className="h-full rounded-2xl"
              >
              <AnimatedBorder
                hoverOnly={!t.featured}
                active={t.featured}
                speed={t.featured ? 'normal' : 'slow'}
                className="h-full"
              >
                <div
                  className={`relative p-5 sm:p-7 rounded-2xl transition-all duration-300 h-full ${
                    t.featured
                      ? 'bg-gradient-to-br from-purple-600/10 to-pink-600/10'
                      : ''
                  }`}
                >
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-3 sm:mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 sm:w-4 h-3.5 sm:h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-slate-300 mb-5 sm:mb-6 leading-relaxed text-xs sm:text-sm">
                    &laquo; {t.quote} &raquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className={`w-9 sm:w-10 h-9 sm:h-10 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold text-white ${
                      t.featured
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                        : 'bg-gradient-to-br from-slate-700 to-slate-600'
                    }`}>
                      {t.initials}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-white">{t.author}</div>
                      <div className="text-[10px] sm:text-xs text-slate-300">{t.role}, {t.company}</div>
                    </div>
                  </div>
                </div>
              </AnimatedBorder>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>

        {/* Glowing separator */}
        <div className="mt-16 sm:mt-24 glow-separator" />
      </div>
    </section>
  );
}
