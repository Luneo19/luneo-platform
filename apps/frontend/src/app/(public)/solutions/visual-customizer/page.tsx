'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Layers,
  Type,
  Image as ImageIcon,
  Shapes,
  Download,
  Save,
  Eye,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Palette,
  Zap,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { logger } from '@/lib/logger';
import { PageHero, SectionHeader } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';

// Dynamic import du customizer (lourd)
const DemoCustomizer = dynamic(
  () => import('@/components/Customizer/ProductCustomizer').then((mod) => ({ default: mod.ProductCustomizer })),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-96 bg-gray-900/50 rounded-lg"><div className="text-gray-400">Chargement de l'éditeur...</div></div> }
);

export default function VisualCustomizerPage() {
  const [showDemo, setShowDemo] = useState(false);
  const [designName, setDesignName] = useState('');
  const [designNotes, setDesignNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const scrollToDemo = () => {
    const anchor = document.getElementById('visual-editor-demo');
    anchor?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setShowDemo(true);
  };

  const handleSaveDesign = async () => {
    if (!designName.trim()) {
      setSaveStatus('error');
      return;
    }
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const response = await fetch('/api/emails/send-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'design@luneo.app',
          brandName: designName,
          subject: `Design sauvegardé: ${designName}`,
          customMessage: `Notes: ${designNotes || 'Aucune note'}`,
        }),
      });
      if (!response.ok) throw new Error('Save failed');
      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
        setDesignName('');
        setDesignNotes('');
      }, 3000);
    } catch (error) {
      logger.error('Save design failed', {
        error,
        designName,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const features = [
    {
      icon: <Type className="w-6 h-6" />,
      title: 'Texte Avancé',
      description: 'Polices custom, effets, courbes, ombres, dégradés. 100+ polices Google Fonts intégrées.',
    },
    {
      icon: <ImageIcon className="w-6 h-6" />,
      title: 'Gestion Images',
      description: 'Upload, crop, resize, filters, ajustements couleur. Support PNG, JPG, SVG, WebP.',
    },
    {
      icon: <Shapes className="w-6 h-6" />,
      title: 'Formes & Vecteurs',
      description: 'Rectangles, cercles, polygones, lignes, courbes de Bézier. Path editing complet.',
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: 'Gestion Layers',
      description: 'Système de layers professionnel avec lock, hide, group, blend modes, opacité.',
    },
    {
      icon: <Palette className="w-6 h-6" />,
      title: 'Couleurs & Dégradés',
      description: 'Palette personnalisée, color picker, dégradés linéaires/radiaux, transparence.',
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: 'Export Print-Ready',
      description: 'PNG/PDF haute résolution 300 DPI, formats CMYK/RGB, bleed, crop marks.',
    },
  ];

  const benefits = [
    {
      title: 'Rapidité',
      stat: '10x',
      description: 'Plus rapide que Photoshop',
      color: 'from-orange-500 to-red-500',
    },
    {
      title: 'Qualité',
      stat: '300 DPI',
      description: 'Export print-ready',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Temps',
      stat: '-80%',
      description: 'Temps de création',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Formats',
      stat: '10+',
      description: 'Formats export',
      color: 'from-green-500 to-teal-500',
    },
  ];

  const useCases = [
    {
      title: 'T-shirts',
      icon: '👕',
      description: 'Personnalisation vêtements',
      examples: 'Texte, logos, images, motifs',
    },
    {
      title: 'Packaging',
      icon: '📦',
      description: 'Design emballages',
      examples: 'Étiquettes, boîtes, sachets',
    },
    {
      title: 'Affiches',
      icon: '🖼️',
      description: 'Création affiches',
      examples: 'Événements, promotions, PLV',
    },
    {
      title: 'Merchandising',
      icon: '🎁',
      description: 'Goodies personnalisés',
      examples: 'Mugs, sacs, casquettes',
    },
  ];

  return (
    <ErrorBoundary level="page" componentName="VisualCustomizerPage">
    <>
      <PageHero
        title="Visual Customizer"
        description="Éditeur canvas professionnel basé sur Konva.js. Texte, formes, images, layers - tout pour créer des designs print-ready en quelques clics."
        badge="Visual Editor 2D"
        gradient="from-orange-600 via-red-600 to-pink-600"
        cta={{
          label: 'Ouvrir l\'éditeur',
          href: '#visual-editor-demo'
        }}
      />

    <div className="min-h-screen bg-white text-gray-900">

      {/* Interactive Demo Section */}
      <section
        id="visual-editor-demo"
        className="py-20 px-4 bg-gray-50 border-y border-orange-200 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-30 blur-3xl bg-gradient-to-r from-orange-900/40 via-red-900/20 to-transparent" />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Éditeur Interactif</h2>
            <p className="text-xl text-gray-400">Créez votre design en temps réel</p>
          </div>

          {showDemo ? (
            <Card className="p-8 bg-gray-900/80 border-orange-500/30 shadow-2xl shadow-orange-900/20">
              <DemoCustomizer
                productId="demo-visual"
                productImage="/api/placeholder/800/600"
                productName="Design Demo"
                width={800}
                height={600}
                mode="demo"
                onSave={(data) => logger.info('Design saved from demo', { hasData: !!data })}
                onClose={() => setShowDemo(false)}
              />
            </Card>
          ) : (
            <Card className="p-12 bg-gray-900/80 border-orange-500/30 text-center">
              <Layers className="w-16 h-16 text-orange-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Prêt à créer ?</h3>
              <p className="text-gray-400 mb-6">Cliquez sur "Ouvrir l'éditeur" pour commencer</p>
              <Button
                onClick={() => setShowDemo(true)}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              >
                <Eye className="w-5 h-5 mr-2" />
                Lancer l'éditeur
              </Button>
            </Card>
          )}

          {/* Save Design Form */}
          {showDemo && (
            <Card className="mt-8 p-8 bg-gray-900/80 border-orange-500/30">
              <h3 className="text-xl font-bold text-white mb-4">Sauvegarder le design</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Nom du design</label>
                  <Input
                    value={designName}
                    onChange={(e) => setDesignName(e.target.value)}
                    placeholder="Mon design personnalisé"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Notes (optionnel)</label>
                  <Textarea
                    value={designNotes}
                    onChange={(e) => setDesignNotes(e.target.value)}
                    rows={3}
                    placeholder="Notes sur ce design..."
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <Button
                  onClick={handleSaveDesign}
                  disabled={isSaving || !designName.trim()}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                >
                  {isSaving ? (
                    <>
                      <Zap className="w-5 h-5 mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>
                {saveStatus === 'success' && (
                  <div className="text-green-400 text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Design sauvegardé avec succès !
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="text-red-400 text-sm">
                    Erreur lors de la sauvegarde. Vérifiez le nom du design.
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Fonctionnalités Complètes</h2>
            <p className="text-xl text-gray-400">Tout ce dont vous avez besoin pour créer</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <Card key={i} className="p-6 bg-gray-800/50 border-gray-700">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, i) => (
              <div key={i} className="text-center">
                <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${benefit.color} rounded-full mb-4`}>
                  <span className="text-3xl font-bold text-white">{benefit.stat}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                <p className="text-gray-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Cas d'Usage</h2>
            <p className="text-xl text-gray-400">Pour tous types de produits personnalisables</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, i) => (
              <Card key={i} className="p-6 bg-gray-800/50 border-gray-700 text-center">
                <div className="text-6xl mb-4">{useCase.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{useCase.title}</h3>
                <p className="text-sm text-gray-400 mb-2">{useCase.description}</p>
                <p className="text-xs text-orange-400">{useCase.examples}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <CTASectionNew />
    </div>
    </>
    </ErrorBoundary>
  );
}
