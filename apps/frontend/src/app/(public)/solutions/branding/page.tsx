'use client';

import React, { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Palette,
  Type,
  Layout,
  Layers,
  Download,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Eye,
  Share2,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { PageHero, SectionHeader } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';
import { AnimatedBorder } from '@/components/ui/animated-border';

const initialPalette = [
  { name: 'Primaire', hex: '#4C52FF' },
  { name: 'Secondaire', hex: '#8F65FF' },
  { name: 'Accent', hex: '#FF8FE3' },
];

const fontPairs = [
  { title: 'Neue Haas Grotesk + GT America', tags: 'Sans / Corporate' },
  { title: 'Söhne + Faible', tags: 'Modern / Premium' },
  { title: 'Clash Grotesk + Lora', tags: 'Editorial / Tech' },
];

type BrandScope = 'D2C' | 'B2B SaaS' | 'Retail' | 'Luxe';

export default function BrandingPage() {
  const [scope, setScope] = useState<BrandScope>('D2C');
  const [values, setValues] = useState('Bold, Responsable, Premium');
  const [keywords, setKeywords] = useState('custom fashion, 3D, durable');
  const [primaryColor, setPrimaryColor] = useState('#4C52FF');
  const [palette, setPalette] = useState(initialPalette);
  const [logoName, setLogoName] = useState('Luneo');
  const [tagline, setTagline] = useState('Design your reality');
  const [isGenerating, setIsGenerating] = useState(false);
  const [kitStatus, setKitStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [kitError, setKitError] = useState<string | null>(null);
  const [guidelines, setGuidelines] = useState<string[]>([
    'Logo principal : monogramme + logotype',
    'Zone de protection : 2x hauteur du N',
    'Usage couleurs : primaire sur fond sombre, inverse sur fond clair',
  ]);

  const emotionalTone = useMemo(() => {
    const mapping: Record<BrandScope, string> = {
      D2C: 'expressive, centrée communauté, conversion mobile',
      'B2B SaaS': 'rassurante, technologique, focus KPI business',
      Retail: 'immersive en point de vente, signalétique forte',
      Luxe: 'minimalisme, photographies éditoriales, matériaux nobles',
    };
    return mapping[scope];
  }, [scope]);

  const handleGenerateKit = () => {
    setIsGenerating(true);
    // Demo simulation - replace with real API in production
    setTimeout(() => {
      setPalette((prev) =>
        prev.map((color, index) =>
          index === 0 ? { ...color, hex: primaryColor.toUpperCase() } : color,
        ),
      );
      setGuidelines([
        `Tone of voice : ${values}`,
        `Palette inspirée de ${primaryColor.toUpperCase()} (scope ${scope})`,
        `Visual keywords : ${keywords}`,
        `Tagline : ${tagline}`,
      ]);
      setIsGenerating(false);
    }, 800);
  };

  const handleSaveKit = async () => {
    setKitStatus('saving');
    setKitError(null);
    try {
      await api.post('/api/v1/emails/send-welcome', {
        email: 'brand@luneo.app',
        brandName: logoName,
        subject: `Brand kit ${scope}`,
        customMessage: JSON.stringify({ palette, values, keywords, tagline }),
      });
      setKitStatus('saved');
      // Demo simulation - replace with real API in production
      setTimeout(() => setKitStatus('idle'), 1000);
    } catch (error) {
      logger.error('Save brand kit failed', {
        error,
        kitName: logoName || 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      setKitStatus('error');
      setKitError('Sauvegarde impossible (environnement demo).');
    }
  };

  const scrollToDesigner = () => {
    const anchor = document.getElementById('brand-kit-designer');
    anchor?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const features = [
    {
      icon: <Palette className="w-6 h-6" />,
      title: 'Brand Kit Complet',
      description: 'Logo, couleurs, typographies, guidelines en un seul endroit.',
    },
    {
      icon: <Type className="w-6 h-6" />,
      title: 'Variantes Logo',
      description: 'Générez automatiquement toutes les déclinaisons nécessaires.',
    },
    {
      icon: <Layout className="w-6 h-6" />,
      title: 'Templates Cohérents',
      description: 'Cartes de visite, flyers, posts sociaux avec votre identité.',
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: 'Palette Couleurs',
      description: 'Génération automatique de palettes harmonieuses avec codes HEX/RGB.',
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Brand Guidelines',
      description: 'Documentation automatique de votre charte graphique.',
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: 'Export Multi-Format',
      description: 'PNG, SVG, PDF, AI - tous formats professionnels.',
    },
  ];

  const benefits = [
    {
      title: 'Rapidité',
      description: 'Brand kit en minutes',
      stat: '< 10m',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Économie',
      description: 'vs Agence branding',
      stat: '-90%',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Cohérence',
      description: 'Identité unifiée',
      stat: '100%',
      color: 'from-orange-500 to-red-500',
    },
    {
      title: 'Formats',
      description: 'Exports disponibles',
      stat: '10+',
      color: 'from-green-500 to-teal-500',
    },
  ];

  const useCases = [
    {
      title: 'Startup',
      description: 'Créez votre identité de marque rapidement',
      icon: '🚀',
    },
    {
      title: 'PME',
      description: 'Standardisez votre communication',
      icon: '🏢',
    },
    {
      title: 'E-commerce',
      description: 'Cohérence sur tous canaux de vente',
      icon: '🛍️',
    },
    {
      title: 'Agences',
      description: 'Créez des brand kits pour vos clients',
      icon: '🎨',
    },
  ];

  const includes = [
    { item: 'Logo principal + variantes', icon: <CheckCircle className="w-5 h-5" /> },
    { item: 'Palette couleurs complète', icon: <CheckCircle className="w-5 h-5" /> },
    { item: 'Typographies & pairings', icon: <CheckCircle className="w-5 h-5" /> },
    { item: 'Templates cartes de visite', icon: <CheckCircle className="w-5 h-5" /> },
    { item: 'Templates réseaux sociaux', icon: <CheckCircle className="w-5 h-5" /> },
    { item: 'Brand guidelines PDF', icon: <CheckCircle className="w-5 h-5" /> },
    { item: 'Export SVG/PNG/PDF', icon: <CheckCircle className="w-5 h-5" /> },
    { item: 'API pour intégration', icon: <CheckCircle className="w-5 h-5" /> },
  ];

  return (
    <ErrorBoundary level="page" componentName="BrandingPage">
    <>
      <PageHero
        title="Branding"
        description="Créez un brand kit professionnel en minutes. Logo, couleurs, typographies, templates - tout pour une identité de marque cohérente sur tous vos supports."
        badge="Brand Identity Suite"
        gradient="from-indigo-600 via-purple-600 to-pink-600"
        cta={{
          label: 'Ouvrir le brand kit',
          href: '#brand-kit-designer'
        }}
      />

    <div className="min-h-screen dark-section relative noise-overlay">
      <div className="absolute inset-0 gradient-mesh-purple" />

      <section
        id="brand-kit-designer"
        className="dark-section relative noise-overlay py-20 px-4"
      >
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 z-10">
          <ScrollReveal animation="fade-up">
            <AnimatedBorder hoverOnly speed="slow">
              <Card className="p-8 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] shadow-2xl shadow-purple-500/10">
                <h2 className="text-2xl font-display font-bold text-white mb-2">Brand Kit Builder</h2>
                <p className="text-slate-400 mb-6">
              Renseignez votre scope, vos valeurs et vos mots-clés. L’IA propose un brand kit complet
              (palette, tagline, guidelines).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Scope</label>
                <select
                  value={scope}
                  onChange={(event) => setScope(event.target.value as BrandScope)}
                  className="w-full bg-dark-card/60 border border-white/[0.04] rounded-lg px-3 py-2 text-white"
                >
                  <option>D2C</option>
                  <option>B2B SaaS</option>
                  <option>Retail</option>
                  <option>Luxe</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Nom marque</label>
                <Input value={logoName} onChange={(event) => setLogoName(event.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Tagline</label>
                <Input value={tagline} onChange={(event) => setTagline(event.target.value)} />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Couleur primaire</label>
                <Input type="color" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm text-gray-300 mb-1 block">Valeurs</label>
              <Input value={values} onChange={(event) => setValues(event.target.value)} />
            </div>
            <div className="mt-4">
              <label className="text-sm text-gray-300 mb-1 block">Mots-clés / inspirations</label>
              <Textarea rows={3} value={keywords} onChange={(event) => setKeywords(event.target.value)} />
            </div>
            <div className="mt-6 flex flex-col md:flex-row gap-3">
                <Button
                  onClick={handleGenerateKit}
                  disabled={isGenerating}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25"
                >
                  {isGenerating ? 'Génération...' : 'Générer le brand kit'}
                </Button>
                <Button
                  onClick={handleSaveKit}
                  variant="outline"
                  disabled={kitStatus === 'saving'}
                  className="flex-1 border-white/[0.04] text-white hover:bg-white/10"
                >
                  {kitStatus === 'saving' ? 'Sauvegarde...' : kitStatus === 'saved' ? 'Sauvegardé ✅' : 'Sauver dans Luneo'}
                </Button>
              </div>
              {kitError && (
                <p className="text-sm text-red-400 mt-3 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
                  {kitError}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-4">
                ⚡️ Export direct vers Figma + générateur de brand book PDF (bientôt).
              </p>
            </Card>
          </AnimatedBorder>
          </ScrollReveal>
          <div className="space-y-6">
            <ScrollReveal animation="fade-up" delay={100}>
              <AnimatedBorder hoverOnly speed="slow">
                <Card className="p-6 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-slate-400">Palette</p>
                      <h3 className="text-lg font-semibold text-white">{logoName}</h3>
                    </div>
                    <div className="text-xs px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
                      {scope}
                    </div>
                  </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {palette.map((color) => (
                  <div
                    key={color.name}
                    className="rounded-xl border border-gray-800 overflow-hidden bg-gray-950/70"
                  >
                    <div className="h-24" style={{ backgroundColor: color.hex }} />
                    <div className="p-3">
                      <p className="text-sm text-gray-400">{color.name}</p>
                      <p className="text-white font-mono">{color.hex}</p>
                    </div>
                  </div>
                ))}
              </div>
                  <div className="mt-6">
                    <p className="text-sm text-slate-400 mb-2">Guidelines auto-générées</p>
                    <ul className="space-y-2">
                      {guidelines.map((guideline) => (
                        <li
                          key={guideline}
                          className="text-sm text-slate-200 border border-white/[0.04] rounded-lg px-3 py-2 bg-dark-card/40"
                        >
                          {guideline}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </AnimatedBorder>
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={200}>
              <AnimatedBorder hoverOnly speed="slow">
                <Card className="p-6 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04]">
                  <h3 className="text-white font-semibold mb-4">Font pairings & assets</h3>
                  <ul className="space-y-3">
                    {fontPairs.map((pair) => (
                      <li
                        key={pair.title}
                        className="flex items-center justify-between text-sm text-slate-200 border border-white/[0.04] rounded-lg px-3 py-2 bg-dark-card/40"
                      >
                        <div>
                          <p>{pair.title}</p>
                          <p className="text-xs uppercase tracking-wide text-slate-400">{pair.tags}</p>
                        </div>
                        <Button size="sm" variant="outline" className="text-xs h-8 border-white/[0.04] text-white hover:bg-white/10">
                          Prévisualiser
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-slate-400 mt-4">
                    Automatisation : export templates socials + cartes de visite en 1 clic (format Figma/Canva).
                  </p>
                </Card>
              </AnimatedBorder>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <div className="glow-separator" />

      {/* Features */}
      <section className="dark-section relative noise-overlay py-20 px-4">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                Tout pour Votre Marque
              </h2>
              <p className="text-xl text-slate-400">Brand kit professionnel clé en main</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <ScrollReveal key={i} animation="fade-up" delay={i * 100}>
                <AnimatedBorder hoverOnly speed="slow">
                  <Card className="p-6 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] hover:border-purple-500/50 transition-all h-full">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white/70 mb-4" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(236,72,153,0.1))' }}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-400">{feature.description}</p>
                  </Card>
                </AnimatedBorder>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="glow-separator" />

      {/* Benefits */}
      <section className="dark-section relative noise-overlay py-20 px-4">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Résultats</h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, i) => (
              <ScrollReveal key={i} animation="fade-up" delay={i * 100}>
                <div className="text-center">
                  <div
                    className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${benefit.color} rounded-full mb-4`}
                  >
                    <span className="text-3xl font-bold text-white">{benefit.stat}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                  <p className="text-slate-400">{benefit.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="glow-separator" />

      {/* Use Cases */}
      <section className="dark-section relative noise-overlay py-20 px-4">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Cas d'Usage</h2>
              <p className="text-xl text-slate-400">Pour tous types d'entreprises</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, i) => (
              <ScrollReveal key={i} animation="fade-up" delay={i * 100}>
                <AnimatedBorder hoverOnly speed="slow">
                  <Card className="p-6 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] hover:border-purple-500/50 transition-all text-center">
                    <div className="text-6xl mb-4">{useCase.icon}</div>
                    <h3 className="text-lg font-bold text-white mb-2">{useCase.title}</h3>
                    <p className="text-sm text-slate-400">{useCase.description}</p>
                  </Card>
                </AnimatedBorder>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="glow-separator" />

      {/* What's Included */}
      <section className="dark-section relative noise-overlay py-20 px-4">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="max-w-4xl mx-auto relative z-10">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Inclus dans Votre Brand Kit</h2>
              <p className="text-xl text-slate-400">Tout ce dont vous avez besoin</p>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={100}>
            <AnimatedBorder hoverOnly speed="slow">
              <Card className="p-8 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {includes.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="text-purple-400">{item.icon}</div>
                      <span className="text-white">{item.item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/pricing">
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25 px-8 h-12">
                      Voir les tarifs
                    </Button>
                  </Link>
                  <Link href="/help/documentation">
                    <Button
                      variant="outline"
                      className="border-white/[0.04] text-white hover:bg-white/10 h-12 px-8"
                    >
                      Documentation
                    </Button>
                  </Link>
                </div>
              </Card>
            </AnimatedBorder>
          </ScrollReveal>
        </div>
      </section>

      <div className="glow-separator" />

      <CTASectionNew />
    </div>
    </>
    </ErrorBoundary>
  );
}
