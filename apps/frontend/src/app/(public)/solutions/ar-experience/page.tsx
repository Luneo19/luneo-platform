'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Wand2,
  Hand,
  Smartphone,
  Box,
  Eye,
  Camera,
  CheckCircle,
  ArrowRight,
  Play,
  RotateCcw,
  Maximize2,
  Shield,
  Lock,
  Star,
  Quote,
  BarChart3,
  Zap,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { useSolutionData } from '@/lib/hooks/useSolutionData';
import { FAQStructuredData, ProductStructuredData } from '@/components/seo/StructuredData';
import { PageHero, SectionHeader } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';
import { AnimatedBorder } from '@/components/ui/animated-border';
import { useI18n } from '@/i18n/useI18n';

// Types
interface Testimonial {
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
  category: string;
  metric: string;
}

// Testimonials
const testimonials: Testimonial[] = [
  {
    name: 'Marie Dubois',
    role: 'Directrice Innovation',
    company: 'TechStyle',
    avatar: '/images/testimonials/marie.jpg',
    content: "L'expérience AR immersive a transformé notre façon de présenter les produits. Les clients peuvent maintenant visualiser nos collections dans leur environnement réel. Engagement multiplié par 4.",
    rating: 5,
    category: 'Mode',
    metric: 'x4 engagement',
  },
  {
    name: 'Thomas Martin',
    role: 'CEO',
    company: 'HomeDecor Pro',
    avatar: '/images/testimonials/thomas.jpg',
    content: "Le placement 3D sur surfaces avec WebXR est révolutionnaire. Nos clients voient exactement comment nos meubles s'intègrent dans leur espace. Conversions +65%.",
    rating: 5,
    category: 'Décoration',
    metric: '+65% conversions',
  },
  {
    name: 'Sophie Laurent',
    role: 'Head of E-commerce',
    company: 'Jewelry Luxe',
    avatar: '/images/testimonials/sophie.jpg',
    content: "Le hand tracking pour les bijoux est bluffant. Les clients essaient nos bagues et bracelets en temps réel. Taux de retour divisé par 3.",
    rating: 5,
    category: 'Bijouterie',
    metric: '-67% retours',
  },
];

// FAQ items
const faqItems = [
  {
    question: 'Quelle est la différence entre AR Experience et Virtual Try-On ?',
    answer: "AR Experience est notre solution complète pour les expériences AR immersives avec WebXR, incluant le placement 3D sur surfaces, le hand tracking, et le body tracking. Virtual Try-On se concentre spécifiquement sur l'essayage facial (lunettes, bijoux). AR Experience est idéal pour les meubles, décoration, mode, et objets volumineux.",
  },
  {
    question: 'Quels appareils sont compatibles avec WebXR ?',
    answer: "WebXR fonctionne sur iOS 16+ (Safari avec ARKit), Android 12+ (Chrome avec ARCore), et les navigateurs desktop avec casques VR compatibles. Pour une compatibilité maximale, nous proposons aussi des exports natifs USDZ (iOS) et GLB (Android Scene Viewer).",
  },
  {
    question: 'Comment fonctionne le placement 3D sur surfaces ?',
    answer: "Nous utilisons WebXR Hit Testing pour détecter les surfaces planes dans l'environnement réel. L'utilisateur pointe son appareil vers une surface, et le système place automatiquement le modèle 3D avec un positionnement précis. Le rendu se fait en temps réel avec Three.js.",
  },
  {
    question: 'Le hand tracking fonctionne-t-il sur tous les appareils ?',
    answer: "Le hand tracking utilise MediaPipe Hands (21 points de repère) et fonctionne sur la plupart des appareils modernes. Sur iOS, nous utilisons ARKit Hand Tracking pour une précision optimale. Sur Android, MediaPipe fonctionne directement dans le navigateur.",
  },
  {
    question: 'Puis-je intégrer AR Experience dans mon application mobile native ?',
    answer: "Oui ! Nous fournissons des SDKs React Native et Flutter pour intégrer nos fonctionnalités AR dans vos applications natives. Nous supportons aussi les exports USDZ et GLB pour une intégration native iOS/Android.",
  },
  {
    question: 'Quelles sont les limites de performance ?',
    answer: "Nous garantissons 60 FPS sur appareils récents et 30 FPS minimum sur appareils plus anciens grâce à notre système de LODs adaptatifs. Les modèles 3D sont automatiquement optimisés pour chaque appareil. Compatible iPhone 8+ et Android 2019+.",
  },
];

function ARExperiencePageContent() {
  const { t } = useI18n();
  const { data: solutionData } = useSolutionData('ar-experience');

  // Demo states
  const [selectedFeature, setSelectedFeature] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const arFeatures = [
    {
      id: 'hand-tracking',
      label: 'Hand Tracking',
      description: 'Essayez des bracelets et bagues en temps réel avec le suivi des mains',
      icon: Hand,
      color: 'amber',
    },
    {
      id: 'body-tracking',
      label: 'Body Tracking',
      description: 'Visualisez des vêtements sur votre silhouette grâce à la détection de pose',
      icon: Eye,
      color: 'orange',
    },
    {
      id: 'surface-placement',
      label: 'Placement 3D',
      description: 'Placez des objets 3D sur n\'importe quelle surface avec WebXR',
      icon: Box,
      color: 'yellow',
    },
  ];

  useEffect(() => {
    // Check WebXR support
    if (typeof window !== 'undefined' && 'xr' in navigator) {
      const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
      if (xr) {
        xr.isSessionSupported('immersive-ar').then((supported) => {
          setIsSupported(supported);
        });
      }
    }
  }, []);

  const dynamicTestimonials = React.useMemo(() => {
    if (solutionData?.testimonials?.length) {
      return solutionData.testimonials.map((t) => ({
        name: t.author,
        role: t.role,
        company: t.company,
        avatar: '/images/testimonials/default.jpg',
        content: t.quote,
        rating: 5,
        category: 'Général',
        metric: t.result,
      }));
    }
    return testimonials;
  }, [solutionData]);

  return (
    <>
      <PageHero
        title="AR Experience"
        description="Expériences AR immersives avec WebXR. Hand tracking, body tracking, placement 3D sur surfaces. Transformez votre e-commerce avec la réalité augmentée de pointe."
        badge="Solution AR"
        gradient="from-amber-600 via-orange-600 to-yellow-600"
        cta={{
          label: 'Essayer maintenant',
          href: '#demo'
        }}
      />

      <div className="min-h-screen dark-section relative noise-overlay">
        <div className="absolute inset-0 gradient-mesh-purple" />
        
        {/* Demo Section */}
        <section id="demo" className="dark-section relative noise-overlay py-20 md:py-32 px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0 gradient-mesh-purple" />
          <div className="relative max-w-7xl mx-auto z-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Feature Selector */}
              <ScrollReveal animation="fade-up">
                <div className="space-y-4">
                  {arFeatures.map((f, i) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFeature(i)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        selectedFeature === i
                          ? 'bg-amber-500/10 border-amber-500/50 border-2'
                          : 'bg-dark-card/60 backdrop-blur-sm border-white/[0.04] hover:border-white/[0.08]'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <f.icon className="w-5 h-5 text-amber-400" />
                        <span className="font-bold text-white">{f.label}</span>
                      </div>
                      <p className="text-xs text-slate-400">{f.description}</p>
                    </button>
                  ))}

                  {/* Device info */}
                  <Card className="p-4 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04]">
                    <div className="flex items-center gap-2 mb-2">
                      <Smartphone className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-white">Compatibilité</span>
                    </div>
                    <ul className="text-xs text-slate-400 space-y-1">
                      <li>iOS 16+ (Safari, ARKit)</li>
                      <li>Android 12+ (Chrome, ARCore)</li>
                      <li>Desktop (WebXR avec casque VR)</li>
                    </ul>
                  </Card>
                </div>
              </ScrollReveal>

              {/* AR Preview */}
              <ScrollReveal animation="fade-up" staggerIndex={1} staggerDelay={80}>
                <div className="lg:col-span-2">
                  <AnimatedBorder hoverOnly speed="slow">
                    <Card className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] overflow-hidden">
                      <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                        {/* Simulated AR viewport */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative">
                            {/* Grid overlay simulating AR */}
                            <div className="absolute inset-0 opacity-20">
                              <div
                                className="w-full h-full"
                                style={{
                                  backgroundImage:
                                    'linear-gradient(rgba(251,191,36,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.3) 1px, transparent 1px)',
                                  backgroundSize: '40px 40px',
                                }}
                              />
                            </div>
                            <div className="relative z-10 text-center p-8">
                              <div className="w-32 h-32 mx-auto mb-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 border-dashed flex items-center justify-center">
                                <Wand2 className="w-12 h-12 text-amber-400/60" />
                              </div>
                              <p className="text-slate-300 font-medium mb-1">
                                {arFeatures[selectedFeature].label}
                              </p>
                              <p className="text-xs text-slate-500">
                                {isPlaying
                                  ? 'Simulation AR active - En production, votre caméra serait utilisée'
                                  : 'Cliquez sur Démarrer pour lancer l\'aperçu AR'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Scanning animation when playing */}
                        {isPlaying && (
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />
                            {/* Corner markers */}
                            {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map(
                              (pos) => (
                                <div
                                  key={pos}
                                  className={`absolute ${pos} w-6 h-6 border-amber-400/60 ${
                                    pos.includes('top') ? 'border-t-2' : 'border-b-2'
                                  } ${pos.includes('left') ? 'border-l-2' : 'border-r-2'}`}
                                />
                              ),
                            )}
                          </div>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="p-4 flex items-center justify-between border-t border-white/[0.04]">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setIsPlaying(!isPlaying)}
                            size="sm"
                            className={`${
                              isPlaying
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
                            }`}
                          >
                            {isPlaying ? (
                              <>
                                <RotateCcw className="w-4 h-4 mr-1" />
                                Arrêter
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-1" />
                                Démarrer AR
                              </>
                            )}
                          </Button>
                          <Button size="sm" variant="outline" className="border-white/[0.04]">
                            <Maximize2 className="w-4 h-4 mr-1" />
                            Plein écran
                          </Button>
                        </div>
                        <span className="text-xs text-slate-500">Aperçu démo - Caméra non requise</span>
                      </div>
                    </Card>
                  </AnimatedBorder>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="dark-section relative noise-overlay py-20 px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0 gradient-mesh-purple" />
          <div className="relative max-w-7xl mx-auto z-10">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-white italic">
                  <span className="text-gradient-purple">Pourquoi Choisir AR Experience ?</span>
                </h2>
                <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                  Des résultats mesurables qui transforment votre e-commerce
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  title: 'Engagement x4',
                  description: 'Les utilisateurs passent 4x plus de temps avec vos produits en AR.',
                  stat: 'x4',
                  icon: <Eye className="w-8 h-8" />,
                },
                {
                  title: 'Conversions +65%',
                  description: 'Les clients qui utilisent AR convertissent 65% plus souvent.',
                  stat: '+65%',
                  icon: <CheckCircle className="w-8 h-8" />,
                },
                {
                  title: 'Retours -67%',
                  description: 'Les clients voient exactement le produit dans leur environnement. Résultat : 67% de retours en moins.',
                  stat: '-67%',
                  icon: <CheckCircle className="w-8 h-8" />,
                },
                {
                  title: 'ROI en 1 Mois',
                  description: 'La plupart de nos clients voient un retour sur investissement positif dès le 1er mois.',
                  stat: '1 mois',
                  icon: <BarChart3 className="w-8 h-8" />,
                },
              ].map((benefit, index) => (
                <ScrollReveal key={index} animation="fade-up" staggerIndex={index} staggerDelay={80}>
                  <Card className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] p-6 h-full hover:-translate-y-1">
                    <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center mb-4 text-amber-400">
                      {benefit.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-white">{benefit.title}</h3>
                    <p className="text-slate-300 text-sm mb-4">{benefit.description}</p>
                    <div className="text-3xl font-bold text-gradient-purple">{benefit.stat}</div>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="dark-section relative noise-overlay py-20 px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0 gradient-mesh-purple" />
          <div className="relative max-w-7xl mx-auto z-10">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-white italic">
                  <span className="text-gradient-purple">Fonctionnalités</span>
                </h2>
                <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                  Une technologie de pointe pour une expérience utilisateur exceptionnelle
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'Hand Tracking 21 Points',
                  description: 'MediaPipe Hands pour un suivi ultra-précis des mains en temps réel.',
                  icon: <Hand className="w-6 h-6" />,
                },
                {
                  title: 'Body Tracking & Pose Detection',
                  description: 'Détection de pose complète pour visualisation de vêtements.',
                  icon: <Eye className="w-6 h-6" />,
                },
                {
                  title: 'Placement 3D WebXR',
                  description: 'Hit testing pour placement automatique sur surfaces planes.',
                  icon: <Box className="w-6 h-6" />,
                },
                {
                  title: 'AR Native iOS/Android',
                  description: 'Export USDZ (iOS AR Quick Look) et GLB (Android Scene Viewer).',
                  icon: <Smartphone className="w-6 h-6" />,
                },
                {
                  title: 'Performance 60 FPS',
                  description: 'Optimisé GPU avec WebGL 2.0 et LODs adaptatifs.',
                  icon: <Zap className="w-6 h-6" />,
                },
                {
                  title: 'Multi-Plateforme',
                  description: 'Fonctionne sur iOS, Android, Desktop avec WebXR.',
                  icon: <Globe className="w-6 h-6" />,
                },
                {
                  title: 'SDK React Native & Flutter',
                  description: 'Intégration native dans vos applications mobiles.',
                  icon: <CheckCircle className="w-6 h-6" />,
                },
                {
                  title: 'Capture & Partage',
                  description: 'Screenshot HD et partage social direct.',
                  icon: <Camera className="w-6 h-6" />,
                },
              ].map((feature, index) => (
                <ScrollReveal key={index} animation="fade-up" staggerIndex={index} staggerDelay={80}>
                  <Card className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] p-6 h-full hover:-translate-y-1">
                    <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center mb-4 text-amber-400">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                    <p className="text-slate-300 text-sm">{feature.description}</p>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="dark-section relative noise-overlay py-20 px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0 gradient-mesh-purple" />
          <div className="relative max-w-7xl mx-auto z-10">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-white italic">
                  <span className="text-gradient-purple">Comment Ça Fonctionne ?</span>
                </h2>
                <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                  Une intégration simple en 3 étapes
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: '1',
                  title: 'Intégration en 5 Minutes',
                  description: 'Ajoutez notre widget AR à votre site avec une simple ligne de code. Compatible Shopify, WooCommerce, Magento.',
                },
                {
                  step: '2',
                  title: 'Uploadez vos Modèles 3D',
                  description: 'Importez vos produits 3D (GLB, FBX) ou utilisez notre service de création 3D à partir de photos.',
                },
                {
                  step: '3',
                  title: 'Vos Clients Expérimentent en AR',
                  description: 'Vos clients peuvent maintenant visualiser vos produits dans leur environnement réel avec WebXR.',
                },
              ].map((step, index) => (
                <ScrollReveal key={index} animation="fade-up" staggerIndex={index} staggerDelay={80}>
                  <Card className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] p-8 h-full hover:-translate-y-1">
                    <div className="w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-6">
                      {step.step}
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-white">{step.title}</h3>
                    <p className="text-slate-300 leading-relaxed">{step.description}</p>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="dark-section relative noise-overlay py-20 px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0 gradient-mesh-purple" />
          <div className="relative max-w-7xl mx-auto z-10">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-white italic">
                  <span className="text-gradient-purple">Ce Que Disent Nos Clients</span>
                </h2>
                <p className="text-xl text-slate-300">
                  Retours d&apos;expérience de leaders de l&apos;e-commerce
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {dynamicTestimonials.map((testimonial, index) => (
                <ScrollReveal key={index} animation="fade-up" staggerIndex={index} staggerDelay={80}>
                  <Card className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] p-6 h-full hover:-translate-y-1">
                    <Quote className="w-8 h-8 text-amber-400/50 mb-4" />
                    
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>

                    <p className="text-slate-300 mb-6 leading-relaxed">&quot;{testimonial.content}&quot;</p>

                    <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                          {testimonial.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{testimonial.name}</p>
                          <p className="text-xs text-slate-500">{testimonial.role}, {testimonial.company}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full">{testimonial.category}</span>
                        <p className="text-sm font-bold text-green-400 mt-1">{testimonial.metric}</p>
                      </div>
                    </div>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="dark-section relative noise-overlay py-20 px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0 gradient-mesh-purple" />
          <div className="relative max-w-7xl mx-auto z-10">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-white italic">
                  <span className="text-gradient-purple">Sécurité & Conformité</span>
                </h2>
                <p className="text-xl text-slate-300">
                  Protection des données et respect de la vie privée
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: <Lock className="w-6 h-6" />, title: 'Traitement Local', desc: 'Aucune donnée biométrique envoyée aux serveurs' },
                { icon: <Shield className="w-6 h-6" />, title: 'RGPD Compliant', desc: 'Pas de stockage de données personnelles' },
                { icon: <CheckCircle className="w-6 h-6" />, title: 'CDN Européen', desc: 'Hébergement et données en Europe' },
                { icon: <Lock className="w-6 h-6" />, title: 'SOC 2 Type II', desc: 'Audit de sécurité indépendant' },
              ].map((item, i) => (
                <ScrollReveal key={i} animation="fade-up" staggerIndex={i} staggerDelay={80}>
                  <Card className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] p-6 text-center h-full hover:-translate-y-1">
                    <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-amber-400">
                      {item.icon}
                    </div>
                    <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-300">{item.desc}</p>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="dark-section relative noise-overlay py-20 px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0 gradient-mesh-purple" />
          <div className="relative max-w-4xl mx-auto z-10">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-white italic">
                  <span className="text-gradient-purple">Questions Fréquentes</span>
                </h2>
              </div>
            </ScrollReveal>

            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <ScrollReveal key={index} animation="fade-up" staggerIndex={index} staggerDelay={80}>
                  <Card className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] p-6">
                    <h3 className="text-lg font-semibold text-white mb-2">{item.question}</h3>
                    <p className="text-slate-300 leading-relaxed">{item.answer}</p>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <CTASectionNew />
      </div>
    </>
  );
}

export default function ARExperiencePage() {
  return (
    <>
      <FAQStructuredData questions={faqItems} />
      <ProductStructuredData
        name="AR Experience"
        description="Expériences AR immersives avec WebXR. Hand tracking, body tracking, placement 3D sur surfaces. Compatible iOS, Android, Desktop."
      />
      <ErrorBoundary level="page" componentName="ARExperiencePage">
        <ARExperiencePageContent />
      </ErrorBoundary>
    </>
  );
}
