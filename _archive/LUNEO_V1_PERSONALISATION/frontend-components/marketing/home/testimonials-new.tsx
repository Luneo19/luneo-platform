'use client';

import { Star, Quote } from 'lucide-react';
import {
  ScrollReveal,
  TiltCard,
  GradientText,
  PremiumSectionHeader,
  GlowOrb,
} from '@/components/ui/premium';

const testimonials = [
  {
    quote: "Luneo a transforme notre experience client. +45% de conversions en 3 mois grace a la personnalisation en temps reel.",
    author: 'Sophie Laurent',
    role: 'E-commerce Director',
    company: 'Optic 2000',
    initials: 'SL',
    featured: false,
    gradient: 'from-indigo-500 to-violet-500',
  },
  {
    quote: "Le meilleur investissement pour notre startup. Le configurateur 3D et le try-on AR ont revolutionne notre facon de vendre en ligne.",
    author: 'Marc Dubois',
    role: 'CEO',
    company: 'PrintShop Pro',
    initials: 'MD',
    featured: true,
    gradient: 'from-violet-500 to-pink-500',
  },
  {
    quote: "Integration en 2 jours, ROI positif des le premier mois. Le support est exceptionnel et les fonctionnalites sont impressionnantes.",
    author: 'Claire Moreau',
    role: 'Head of Digital',
    company: 'Bijoux Paris',
    initials: 'CM',
    featured: false,
    gradient: 'from-cyan-500 to-indigo-500',
  },
];

export function TestimonialsNew() {
  return (
    <section id="testimonials" className="relative py-24 sm:py-32 bg-dark-bg overflow-hidden">
      {/* Background orbs */}
      <GlowOrb
        className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        color="rgba(124,58,237,0.05)"
        size="800px"
        blur={150}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal direction="up">
          <PremiumSectionHeader
            badge="Temoignages"
            title={
              <>
                Apprecie par des{' '}
                <GradientText variant="rose" className="font-editorial italic">
                  milliers de marques
                </GradientText>
              </>
            }
            subtitle="Decouvrez ce que nos clients ont a dire sur leur experience avec Luneo."
            className="mb-16 sm:mb-20"
          />
        </ScrollReveal>

        {/* Rating bar */}
        <ScrollReveal direction="up" delay={80}>
          <div className="flex flex-wrap justify-center items-center gap-6 mb-12">
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-white font-bold text-lg">Excellent</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-white/10" />
            <span className="text-white/40 text-sm">Note moyenne 4.9/5</span>
          </div>
        </ScrollReveal>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {testimonials.map((t, index) => (
            <ScrollReveal
              key={t.author}
              direction="up"
              delay={index * 100}
            >
              <TiltCard
                tiltStrength={4}
                glareColor="rgba(99,102,241,0.06)"
                className="h-full"
              >
                <div
                  className={`group relative p-6 sm:p-8 h-full ${
                    t.featured ? 'ring-1 ring-indigo-500/20' : ''
                  }`}
                >
                  {/* Featured badge */}
                  {t.featured && (
                    <div className="absolute -top-px left-1/2 -translate-x-1/2">
                      <div className="px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-b-lg">
                        Favori
                      </div>
                    </div>
                  )}

                  {/* Hover gradient */}
                  <div
                    className={`absolute inset-0 rounded-[inherit] bg-gradient-to-br ${t.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`}
                  />

                  <div className="relative z-10">
                    {/* Quote icon */}
                    <Quote className={`w-8 h-8 mb-4 bg-gradient-to-br ${t.gradient} bg-clip-text text-transparent opacity-30`} />

                    {/* Stars */}
                    <div className="flex gap-0.5 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>

                    {/* Quote */}
                    <p className="text-white/70 mb-6 leading-relaxed text-sm">
                      &laquo; {t.quote} &raquo;
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-3 pt-4 border-t border-white/[0.05]">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br ${t.gradient}`}
                      >
                        {t.initials}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{t.author}</div>
                        <div className="text-xs text-white/40">{t.role}, {t.company}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>

        {/* Bottom glow separator */}
        <div className="mt-24 h-px bg-gradient-to-r from-transparent via-pink-500/20 to-transparent" />
      </div>
    </section>
  );
}
