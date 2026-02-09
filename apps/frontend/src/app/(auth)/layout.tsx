'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import {
  Shield,
  Globe,
  CheckCircle,
  Star,
  Palette,
  Box,
  Layers,
  Zap,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// DATA
// ---------------------------------------------------------------------------

const FEATURES = [
  { icon: Palette, title: 'Customizer 2D', desc: 'Editeur visuel drag-and-drop' },
  { icon: Box,     title: 'Configurateur 3D', desc: 'Visualisation Three.js temps reel' },
  { icon: Layers,  title: 'Virtual Try-On', desc: 'Essayage AR 468 points' },
  { icon: Zap,     title: 'Integrations', desc: 'Shopify, WooCommerce, API' },
];

const TESTIMONIALS = [
  {
    quote: "Luneo a transforme notre experience client. +45% de conversions en 3 mois.",
    author: 'Sophie Laurent',
    role: 'E-commerce Director',
    company: 'Optic 2000',
    initials: 'SL',
  },
  {
    quote: "L'integration a pris 2 jours. Le ROI a ete positif des le premier mois.",
    author: 'Marc Dubois',
    role: 'CEO',
    company: 'PrintShop Pro',
    initials: 'MD',
  },
  {
    quote: "La meilleure solution de personnalisation que nous avons testee.",
    author: 'Claire Moreau',
    role: 'Head of Digital',
    company: 'Bijoux Paris',
    initials: 'CM',
  },
];

const STATS = [
  { value: '500+', label: 'Marques' },
  { value: '10M+', label: 'Produits' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9/5', label: 'Note' },
];

const BADGES = [
  { icon: Shield, label: 'RGPD' },
  { icon: Globe, label: 'CDN Europe' },
  { icon: CheckCircle, label: 'SOC 2' },
];

// ---------------------------------------------------------------------------
// LAYOUT
// ---------------------------------------------------------------------------

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx((p) => (p + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const t = TESTIMONIALS[testimonialIdx];

  return (
    <div className="min-h-screen flex bg-dark-bg">
      {/* ==================================================================
          LEFT PANEL - Premium dark marketing (hidden on mobile)
          ================================================================== */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative overflow-hidden">
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-dark-bg" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_30%,rgba(168,85,247,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_70%,rgba(236,72,153,0.08),transparent_50%)]" />

        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Animated orbits */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px]">
          <div className="absolute inset-0 rounded-full border border-white/[0.03] animate-spin-slow" />
          <div className="absolute inset-8 rounded-full border border-white/[0.04] animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '30s' }} />
          <div className="absolute inset-16 rounded-full border border-white/[0.02] animate-spin-slow" style={{ animationDuration: '50s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          {/* Logo */}
          <Logo variant="dark" size="default" href="/" />

          {/* Main content */}
          <div className="flex-1 flex flex-col justify-center py-10 max-w-lg">
            <h1 className="font-display text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
              La plateforme de{' '}
              <span className="italic text-gradient-purple">
                personnalisation
              </span>{' '}
              n&deg;1
            </h1>
            <p className="text-base text-slate-500 leading-relaxed mb-10">
              Creez des experiences d&apos;achat uniques avec notre suite d&apos;outils
              de personnalisation, configuration 3D et essayage virtuel.
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3 mb-10">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{f.title}</div>
                      <div className="text-xs text-slate-600">{f.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mb-10">
              {STATS.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-xl font-bold text-white font-display">{s.value}</div>
                  <div className="text-[11px] text-slate-600 uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-5">
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                &laquo; {t.quote} &raquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{t.author}</div>
                  <div className="text-xs text-slate-600">{t.role}, {t.company}</div>
                </div>
              </div>
              {/* Dots */}
              <div className="flex gap-1.5 mt-4">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTestimonialIdx(i)}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === testimonialIdx ? 'w-5 bg-purple-500' : 'w-1.5 bg-white/[0.15]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Security badges */}
          <div className="flex items-center gap-5">
            {BADGES.map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} className="flex items-center gap-1.5 text-slate-600 text-xs">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{b.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==================================================================
          RIGHT PANEL - Auth form (dark card)
          ================================================================== */}
      <div className="flex-1 relative flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <Logo variant="dark" size="small" href="/" />
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center px-5 py-10 lg:py-8">
          <div className="w-full max-w-[420px]">
            {children}
          </div>
        </div>

        {/* Bottom trust line (desktop) */}
        <div className="hidden lg:flex items-center justify-center gap-6 py-4 text-xs text-slate-600">
          <span>Essai gratuit 14 jours</span>
          <span className="w-1 h-1 rounded-full bg-white/[0.1]" />
          <span>Pas de carte bancaire requise</span>
          <span className="w-1 h-1 rounded-full bg-white/[0.1]" />
          <span>Annulation a tout moment</span>
        </div>
      </div>
    </div>
  );
}
