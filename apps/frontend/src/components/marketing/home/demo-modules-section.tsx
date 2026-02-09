'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Camera, Box, Sparkles, BarChart3, Wand2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';

const demoModules = [
  {
    id: 'virtual-try-on',
    title: 'Virtual Try-On',
    description: 'Essayage virtuel en temps reel avec MediaPipe Face Mesh et AR pour mobile et web',
    icon: Camera,
    href: '/demo/virtual-try-on',
    gradient: 'from-cyan-500 to-blue-500',
    badge: 'AR + MediaPipe',
    features: ['Tracking facial temps reel', 'AR WebXR', 'Export USDZ/GLB', 'Mobile & Desktop'],
  },
  {
    id: '3d-configurator',
    title: '3D Configurator',
    description: 'Configurateur 3D photorealiste avec materiaux PBR, eclairage avance et rendu haute qualite',
    icon: Box,
    href: '/demo/3d-configurator',
    gradient: 'from-purple-500 to-pink-500',
    badge: 'Three.js + WebGL',
    features: ['Rendu PBR', 'Materiaux personnalisables', 'Export haute qualite', 'Performance optimisee'],
  },
  {
    id: 'ai-agents',
    title: 'AI Agents',
    description: 'Agents IA intelligents (Luna, Aria, Nova) pour BI, personnalisation et support automatique',
    icon: Sparkles,
    href: '/demo/ai-agents',
    gradient: 'from-pink-500 to-rose-500',
    badge: 'GPT-4 + Claude',
    features: ['Luna (B2B BI)', 'Aria (B2C Creatif)', 'Nova (Support)', 'RAG + Memory'],
  },
  {
    id: 'smart-analytics',
    title: 'Smart Analytics',
    description: 'Analytics avances avec predictions, funnels, cohortes et recommandations IA',
    icon: BarChart3,
    href: '/demo/analytics',
    gradient: 'from-emerald-500 to-teal-500',
    badge: 'BI + ML',
    features: ['Funnels & Cohortes', 'Predictions IA', 'Anomalies detectees', 'Recommandations'],
  },
  {
    id: 'ar-experience',
    title: 'AR Experience',
    description: 'Experiences AR immersives avec WebXR, tracking main/corps et integration e-commerce',
    icon: Wand2,
    href: '/demo/ar-experience',
    gradient: 'from-amber-500 to-orange-500',
    badge: 'WebXR',
    features: ['Hand Tracking', 'Pose Detection', 'WebXR natif', 'Integration Shopify'],
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
            <p className="text-base sm:text-lg text-slate-400 leading-relaxed px-2">
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
                <div className="group relative bg-dark-card/60 backdrop-blur-sm rounded-2xl border border-white/[0.04] hover:border-white/[0.08] p-5 sm:p-7 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
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
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-3 sm:mb-4">{mod.description}</p>

                    {/* Features */}
                    <ul className="space-y-1.5 sm:space-y-2 mb-5 sm:mb-6 flex-1">
                      {mod.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500">
                          <span className="w-1 h-1 rounded-full bg-purple-500 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Link href={mod.href}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.04] hover:border-white/[0.15] font-medium text-xs sm:text-sm"
                      >
                        Tester la demo
                        <ArrowRight className="w-3 h-3 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* CTA */}
        <ScrollReveal animation="zoom-in" delay={200}>
          <div className="text-center">
            <Link href="/demo">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-bold shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Voir toutes les demos
                <ArrowRight className="ml-2 w-4 sm:w-5 h-4 sm:h-5" />
              </Button>
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
