'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Camera,
  Glasses,
  Watch,
  Gem,
  CheckCircle,
  ArrowRight,
  Download,
  Share2,
  Smartphone,
  Shield,
  Lock,
  ChevronDown,
  Star,
  Quote,
  X,
  Pause,
  Circle,
  Info,
  Settings,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { useSolutionData } from '@/lib/hooks/useSolutionData';
import { FAQStructuredData, ProductStructuredData } from '@/components/seo/StructuredData';
import { PageHero } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';
import { AnimatedBorder } from '@/components/ui/animated-border';
import { useI18n } from '@/i18n/useI18n';
import { useAuth } from '@/hooks/useAuth';
import TryOnDemo from '@/components/solutions/TryOnDemo';

// Types
interface Product {
  id: string;
  name: string;
  image: string;
  category: 'glasses' | 'watch' | 'jewelry' | 'accessory';
  overlayPosition: { x: number; y: number; scale: number };
}

type DemoCategoryId = 'lunettes' | 'boucles' | 'montres';

interface DemoProduct {
  id: string;
  name: string;
  color: string;
  overlayStyle: 'glasses' | 'earrings' | 'watch';
}

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

// Demo products (legacy, for ROI/refs)
const demoProducts: Product[] = [
  { id: '1', name: 'Aviator Classic', image: '/images/products/glasses-1.png', category: 'glasses', overlayPosition: { x: 50, y: 35, scale: 1 } },
  { id: '2', name: 'Wayfarer Sport', image: '/images/products/glasses-2.png', category: 'glasses', overlayPosition: { x: 50, y: 35, scale: 0.95 } },
  { id: '3', name: 'Cat Eye Luxe', image: '/images/products/glasses-3.png', category: 'glasses', overlayPosition: { x: 50, y: 35, scale: 1.05 } },
  { id: '4', name: 'Round Vintage', image: '/images/products/glasses-4.png', category: 'glasses', overlayPosition: { x: 50, y: 35, scale: 0.9 } },
];

// Interactive demo: products by category (placeholder SVGs)
const DEMO_CATEGORIES: { id: DemoCategoryId; label: string; icon: typeof Glasses }[] = [
  { id: 'lunettes', label: 'Lunettes', icon: Glasses },
  { id: 'boucles', label: "Boucles d'oreilles", icon: Gem },
  { id: 'montres', label: 'Montres', icon: Watch },
];

const DEMO_PRODUCTS: Record<DemoCategoryId, DemoProduct[]> = {
  lunettes: [
    { id: 'g1', name: 'Aviator', color: '#d97706', overlayStyle: 'glasses' },
    { id: 'g2', name: 'Wayfarer', color: '#1e293b', overlayStyle: 'glasses' },
    { id: 'g3', name: 'Cat Eye', color: '#be185d', overlayStyle: 'glasses' },
    { id: 'g4', name: 'Round', color: '#0369a1', overlayStyle: 'glasses' },
  ],
  boucles: [
    { id: 'b1', name: 'Stud', color: '#ca8a04', overlayStyle: 'earrings' },
    { id: 'b2', name: 'Creole', color: '#94a3b8', overlayStyle: 'earrings' },
    { id: 'b3', name: 'Pendente', color: '#e11d48', overlayStyle: 'earrings' },
    { id: 'b4', name: 'Drop', color: '#fef3c7', overlayStyle: 'earrings' },
  ],
  montres: [
    { id: 'm1', name: 'Classic', color: '#64748b', overlayStyle: 'watch' },
    { id: 'm2', name: 'Sport', color: '#0f172a', overlayStyle: 'watch' },
    { id: 'm3', name: 'Minimal', color: '#b45309', overlayStyle: 'watch' },
    { id: 'm4', name: 'Chrono', color: '#1e3a8a', overlayStyle: 'watch' },
  ],
};

// Testimonials
const testimonials: Testimonial[] = [
  {
    name: 'Sophie Laurent',
    role: 'Directrice E-commerce',
    company: 'Optic 2000',
    avatar: '/images/testimonials/sophie.jpg',
    content: "Le Virtual Try-On a révolutionné notre expérience client. Les ventes en ligne ont augmenté de 45% et les retours ont chuté de 60%. C'est exactement ce dont nous avions besoin.",
    rating: 5,
    category: 'Lunettes',
    metric: '+45% conversions',
  },
  {
    name: 'Marc Dubois',
    role: 'CEO',
    company: 'Bijoux Paris',
    avatar: '/images/testimonials/marc.jpg',
    content: "L'essayage virtuel de bijoux est bluffant de réalisme. Nos clients adorent voir les bagues et boucles d'oreilles sur eux avant d'acheter. ROI positif en 2 mois.",
    rating: 5,
    category: 'Bijoux',
    metric: '-55% retours',
  },
  {
    name: 'Claire Moreau',
    role: 'Head of Digital',
    company: 'Watches & Co',
    avatar: '/images/testimonials/claire.jpg',
    content: "La technologie de tracking main pour les montres est impressionnante. L'intégration a pris 2 jours et le support technique est excellent.",
    rating: 5,
    category: 'Montres',
    metric: 'x3 engagement',
  },
];

// FAQ items
const faqItems = [
  {
    question: 'Comment fonctionne le tracking facial 468 points ?',
    answer: "Nous utilisons MediaPipe Face Mesh de Google, une solution AI on-device qui détecte 468 points de repère sur le visage en temps réel. Cela permet un ajustement ultra-précis des lunettes, boucles d'oreilles, et accessoires. Le processing se fait localement sur l'appareil de l'utilisateur pour une latence minimale et une confidentialité maximale.",
  },
  {
    question: 'Mes clients doivent-ils installer une application ?',
    answer: "Non ! Tout fonctionne directement dans le navigateur (Chrome, Safari, Edge). Pour l'AR mobile natif, nous exportons automatiquement en USDZ (iOS AR Quick Look) et GLB (Android Scene Viewer) pour une expérience '1-tap' sans installation.",
  },
  {
    question: 'Quelle est la performance sur mobile bas de gamme ?',
    answer: "Nous garantissons 60 FPS même sur mobile entrée de gamme grâce à notre optimisation WebGL avec LODs adaptatifs. Le système ajuste automatiquement la qualité du rendu pour maintenir la fluidité. Compatible iPhone 8+ et Android 2019+.",
  },
  {
    question: 'Les données faciales sont-elles stockées ?',
    answer: "Non, jamais. Tout le traitement se fait localement sur l'appareil de l'utilisateur. Aucune image faciale n'est envoyée à nos serveurs. Nous sommes 100% conformes RGPD et ne collectons aucune donnée biométrique.",
  },
  {
    question: 'Comment obtenir les modèles 3D de mes produits ?',
    answer: "Plusieurs options : 1) Uploadez vos modèles GLB/FBX existants, 2) Utilisez notre service de création 3D à partir de photos (2-3 jours, à partir de 50€/modèle), 3) Exportez depuis notre Configurateur 3D intégré.",
  },
  {
    question: 'Puis-je personnaliser entièrement le branding ?',
    answer: "Oui ! White-label complet sur plan Enterprise : couleurs, logo, domaine personnalisé, et suppression complète du branding Luneo. Vous pouvez même personnaliser les boutons, l'UI, et les messages.",
  },
];

function VirtualTryOnPageContent() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data: solutionData } = useSolutionData('virtual-try-on');

  // Interactive demo state (no camera)
  const [demoCategory, setDemoCategory] = useState<DemoCategoryId>('lunettes');
  const [selectedDemoProduct, setSelectedDemoProduct] = useState<DemoProduct | null>(DEMO_PRODUCTS.lunettes[0]);
  const [showCameraDemo, setShowCameraDemo] = useState(false);

  // ROI Calculator states
  const [monthlyOrders, setMonthlyOrders] = useState(1000);
  const [averageOrderValue, setAverageOrderValue] = useState(150);
  const [currentReturnRate, setCurrentReturnRate] = useState(25);

  // FAQ state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Dynamic testimonials
  const dynamicTestimonials = useMemo(() => {
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

  // ROI calculations — taux bases sur les moyennes du secteur (Shopify, Baymard Institute)
  const roiCalculations = useMemo(() => {
    // AR/Virtual Try-On reduit les retours de ~25% (moyenne secteur: 20-30%)
    const reducedReturnRate = currentReturnRate * 0.75;
    const savedReturns = monthlyOrders * (currentReturnRate / 100 - reducedReturnRate / 100);
    const returnCostSaved = savedReturns * averageOrderValue * 0.15; // Cout retour ~15% du panier
    // AR augmente les conversions de ~12% (moyenne secteur: 8-15%)
    const conversionIncrease = monthlyOrders * 0.12;
    const additionalRevenue = conversionIncrease * averageOrderValue;
    const monthlyBenefit = returnCostSaved + additionalRevenue;
    const annualBenefit = monthlyBenefit * 12;
    const luneoCost = 49 * 12; // Plan Professional
    const roi = ((annualBenefit - luneoCost) / luneoCost) * 100;

    return {
      savedReturns: Math.round(savedReturns),
      returnCostSaved: Math.round(returnCostSaved),
      conversionIncrease: Math.round(conversionIncrease),
      additionalRevenue: Math.round(additionalRevenue),
      monthlyBenefit: Math.round(monthlyBenefit),
      annualBenefit: Math.round(annualBenefit),
      roi: Math.round(roi),
    };
  }, [monthlyOrders, averageOrderValue, currentReturnRate]);

  // Sync selected demo product when category changes
  useEffect(() => {
    const products = DEMO_PRODUCTS[demoCategory];
    setSelectedDemoProduct(products[0] ?? null);
  }, [demoCategory]);

  return (
    <>
      <PageHero
        title="Virtual Try-On"
        description="Permettez à vos clients d'essayer vos produits en temps réel directement depuis leur navigateur. Augmentez vos conversions et réduisez les retours avec notre technologie AR de pointe."
        badge="Solution AR"
        gradient="from-cyan-600 via-blue-600 to-purple-600"
        cta={user ? { label: 'Accéder au Try-On', href: '/dashboard' } : { label: 'Commencer gratuitement', href: '/register?plan=starter' }}
      />

    <div className="min-h-screen dark-section relative noise-overlay">
      <div className="absolute inset-0 gradient-mesh-purple" />
      {/* Demo Section: Interactive (no camera) + optional camera experience */}
      <section id="demo" className="dark-section relative noise-overlay py-20 md:py-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="relative max-w-7xl mx-auto z-10">
          {showCameraDemo ? (
            <ScrollReveal animation="fade-up">
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-white italic">
                    <span className="text-gradient-purple">Expérience en direct</span>
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCameraDemo(false)}
                    className="border-white/[0.04] hover:bg-white/5 text-slate-300"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Retour à la démo
                  </Button>
                </div>
                <TryOnDemo category="all" showControls />
              </div>
            </ScrollReveal>
          ) : (
            <>
              <ScrollReveal animation="fade-up">
                <div className="text-center mb-12">
                  <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-white italic">
                    <span className="text-gradient-purple">Démo interactive</span>
                  </h2>
                  <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                    Choisissez une catégorie et un produit pour simuler l&apos;essayage sur un visage type. Aucune caméra requise.
                  </p>
                </div>
              </ScrollReveal>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                {/* Left: Categories + products */}
                <ScrollReveal animation="fade-up">
                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-2">
                      {DEMO_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setDemoCategory(cat.id)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            demoCategory === cat.id
                              ? 'bg-purple-600 border-purple-500 text-white'
                              : 'border-white/[0.08] bg-dark-card/60 text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          <cat.icon className="w-4 h-4" />
                          {cat.label}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(DEMO_PRODUCTS[demoCategory] ?? []).map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => setSelectedDemoProduct(product)}
                          className={`relative aspect-square rounded-xl border-2 overflow-hidden transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[var(--dark-bg)] ${
                            selectedDemoProduct?.id === product.id
                              ? 'border-purple-500 ring-2 ring-purple-500/30'
                              : 'border-white/[0.06] hover:border-white/20'
                          }`}
                          aria-pressed={selectedDemoProduct?.id === product.id}
                        >
                          <svg className="w-full h-full" viewBox="0 0 100 100" aria-hidden>
                            <rect width="100" height="100" fill={product.color} />
                            <rect x="10" y="10" width="80" height="80" rx="8" fill="rgba(255,255,255,0.1)" />
                          </svg>
                          <span className="absolute bottom-0 left-0 right-0 bg-black/60 py-1 text-xs font-medium text-white text-center truncate px-1">
                            {product.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>

                {/* Right: Simulated try-on view (model face + overlay) */}
                <ScrollReveal animation="fade-up" staggerIndex={1} staggerDelay={80}>
                  <AnimatedBorder hoverOnly speed="slow">
                    <div className="relative aspect-[3/4] max-h-[500px] rounded-2xl overflow-hidden border-2 border-white/[0.04] bg-dark-card/60 backdrop-blur-sm shadow-glow-sm">
                      {/* Stock model face (SVG placeholder) */}
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80">
                        <svg
                          viewBox="0 0 200 260"
                          className="w-full max-w-[280px] h-auto text-slate-600"
                          aria-hidden
                        >
                          <ellipse cx="100" cy="95" rx="70" ry="85" fill="currentColor" className="text-slate-500" />
                          <ellipse cx="75" cy="88" rx="12" ry="14" fill="#334155" />
                          <ellipse cx="125" cy="88" rx="12" ry="14" fill="#334155" />
                          <path d="M 70 115 Q 100 130 130 115" stroke="#475569" strokeWidth="3" fill="none" strokeLinecap="round" />
                          <ellipse cx="100" cy="195" rx="35" ry="50" fill="#475569" opacity="0.5" />
                        </svg>
                      </div>

                      {/* Product overlay (CSS-positioned) */}
                      {selectedDemoProduct && (
                        <>
                          {selectedDemoProduct.overlayStyle === 'glasses' && (
                            <div
                              className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 w-[55%] h-[11%] rounded-full border-4 border-slate-700 bg-slate-600/40 backdrop-blur-sm"
                              style={{ borderColor: selectedDemoProduct.color, boxShadow: `0 0 0 2px ${selectedDemoProduct.color}40` }}
                            />
                          )}
                          {selectedDemoProduct.overlayStyle === 'earrings' && (
                            <>
                              <div
                                className="absolute w-[10%] aspect-square rounded-full border-2 border-slate-600 top-[40%] left-[22%] bg-slate-500/50"
                                style={{ backgroundColor: `${selectedDemoProduct.color}60`, borderColor: selectedDemoProduct.color }}
                              />
                              <div
                                className="absolute w-[10%] aspect-square rounded-full border-2 border-slate-600 top-[40%] right-[22%] bg-slate-500/50"
                                style={{ backgroundColor: `${selectedDemoProduct.color}60`, borderColor: selectedDemoProduct.color }}
                              />
                            </>
                          )}
                          {selectedDemoProduct.overlayStyle === 'watch' && (
                            <div
                              className="absolute left-1/2 bottom-[18%] -translate-x-1/2 w-[32%] h-[14%] rounded-xl border-2 border-slate-600 bg-slate-700/80 backdrop-blur-sm flex items-center justify-center"
                              style={{ borderColor: selectedDemoProduct.color }}
                            >
                              <span className="text-[0.5rem] font-mono text-slate-400">12</span>
                            </div>
                          )}
                        </>
                      )}

                      {selectedDemoProduct && (
                        <div className="absolute top-3 left-3 bg-dark-card/80 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-2">
                          {demoCategory === 'lunettes' && <Glasses className="w-4 h-4 text-slate-300" />}
                          {demoCategory === 'boucles' && <Gem className="w-4 h-4 text-slate-300" />}
                          {demoCategory === 'montres' && <Watch className="w-4 h-4 text-slate-300" />}
                          <span className="text-sm text-white">{selectedDemoProduct.name}</span>
                        </div>
                      )}
                    </div>
                  </AnimatedBorder>
                </ScrollReveal>
              </div>

              {/* Camera CTA */}
              <ScrollReveal animation="fade-up">
                <div className="mt-12 p-6 rounded-2xl border-2 border-purple-500/30 bg-purple-500/5 backdrop-blur-sm">
                  <p className="text-lg font-medium text-white mb-3">
                    Activez votre caméra pour une expérience en direct
                  </p>
                  <p className="text-slate-300 text-sm mb-4">
                    Essayage en temps réel avec détection du visage et des mains (MediaPipe). Aucune donnée stockée, traitement local.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button
                      size="lg"
                      onClick={() => setShowCameraDemo(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Activer la caméra
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Shield className="w-4 h-4 flex-shrink-0" />
                      <span>Aucune donnée stockée • Traitement local</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="dark-section relative noise-overlay py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="relative max-w-7xl mx-auto z-10">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-white italic">
                <span className="text-gradient-purple">Pourquoi Choisir Luneo Virtual Try-On ?</span>
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                Des résultats mesurables qui transforment votre e-commerce
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Augmentez vos Conversions',
                description: 'Les clients qui utilisent le Virtual Try-On convertissent 40% plus souvent.',
                stat: '+40%',
                icon: <CheckCircle className="w-8 h-8" />,
              },
              {
                title: 'Réduisez les Retours',
                description: 'Les clients voient exactement comment le produit leur va. Résultat : 60% de retours en moins.',
                stat: '-60%',
                icon: <CheckCircle className="w-8 h-8" />,
              },
              {
                title: 'Engagement x3',
                description: 'Les utilisateurs passent 3x plus de temps sur votre site.',
                stat: 'x3',
                icon: <CheckCircle className="w-8 h-8" />,
              },
              {
                title: 'ROI en 2 Mois',
                description: 'La plupart de nos clients voient un retour sur investissement positif dès le 2ème mois.',
                stat: '2 mois',
                icon: <CheckCircle className="w-8 h-8" />,
              },
            ].map((benefit, index) => (
              <ScrollReveal key={index} animation="fade-up" staggerIndex={index} staggerDelay={80}>
                <Card className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] p-6 h-full hover:-translate-y-1">
                  <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center mb-4 text-purple-400">
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
                title: 'Tracking Facial 468 Points',
                description: 'MediaPipe Face Mesh pour un suivi ultra-précis en temps réel.',
                icon: <Camera className="w-6 h-6" />,
              },
              {
                title: 'Lunettes 3D Photo-Réalistes',
                description: 'Overlay 3D avec ajustement automatique à la morphologie.',
                icon: <Glasses className="w-6 h-6" />,
              },
              {
                title: 'Montres & Bracelets',
                description: 'Tracking main 21 points pour essayage de montres et bracelets.',
                icon: <Watch className="w-6 h-6" />,
              },
              {
                title: "Boucles d'Oreilles & Bijoux",
                description: 'Placement automatique avec détection précise des oreilles.',
                icon: <Gem className="w-6 h-6" />,
              },
              {
                title: 'AR Mobile Natif',
                description: 'Export USDZ (iOS) et GLB (Android) avec expérience 1-tap.',
                icon: <Smartphone className="w-6 h-6" />,
              },
              {
                title: 'Capture Photo/Vidéo 4K',
                description: "Capture d'écran HD et enregistrement vidéo de l'essayage.",
                icon: <Download className="w-6 h-6" />,
              },
              {
                title: 'Performance 60 FPS',
                description: 'Optimisé GPU avec WebGL 2.0 pour une fluidité garantie.',
                icon: <CheckCircle className="w-6 h-6" />,
              },
              {
                title: 'Partage Social Direct',
                description: 'Export direct Instagram, TikTok, Facebook avec branding personnalisé.',
                icon: <Share2 className="w-6 h-6" />,
              },
            ].map((feature, index) => (
              <ScrollReveal key={index} animation="fade-up" staggerIndex={index} staggerDelay={80}>
                <Card className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] p-6 h-full hover:-translate-y-1">
                  <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center mb-4 text-purple-400">
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
                description: 'Ajoutez notre widget à votre site avec une simple ligne de code. Compatible Shopify, WooCommerce, Magento.',
              },
              {
                step: '2',
                title: 'Uploadez vos Modèles 3D',
                description: 'Importez vos produits 3D (GLB, FBX) ou utilisez notre service de création 3D à partir de photos.',
              },
              {
                step: '3',
                title: 'Vos Clients Essayent en AR',
                description: 'Vos clients peuvent maintenant essayer vos produits en temps réel directement depuis leur navigateur.',
              },
            ].map((step, index) => (
              <ScrollReveal key={index} animation="fade-up" staggerIndex={index} staggerDelay={80}>
                <Card className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] p-8 h-full hover:-translate-y-1">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-6">
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

      {/* ROI Calculator Section */}
      <section className="dark-section relative noise-overlay py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="relative max-w-5xl mx-auto z-10">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-white italic">
                <span className="text-gradient-purple">Calculez Votre Retour sur Investissement</span>
              </h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Estimez les économies et revenus supplémentaires
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" staggerIndex={0} staggerDelay={80}>
            <AnimatedBorder hoverOnly speed="slow">
              <Card className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Settings className="w-5 h-5 text-purple-400" />
                      Vos Métriques Actuelles
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Commandes mensuelles : <span className="font-bold">{monthlyOrders.toLocaleString()}</span>
                      </label>
                      <input
                        type="range"
                        min="100"
                        max="10000"
                        step="100"
                        value={monthlyOrders}
                        onChange={(e) => setMonthlyOrders(Number(e.target.value))}
                        className="w-full h-2 bg-dark-card/40 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>100</span>
                        <span>10,000</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Panier moyen : <span className="font-bold">{averageOrderValue}€</span>
                      </label>
                      <input
                        type="range"
                        min="20"
                        max="500"
                        step="10"
                        value={averageOrderValue}
                        onChange={(e) => setAverageOrderValue(Number(e.target.value))}
                        className="w-full h-2 bg-dark-card/40 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>20€</span>
                        <span>500€</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Taux de retour actuel : <span className="font-bold">{currentReturnRate}%</span>
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="50"
                        step="1"
                        value={currentReturnRate}
                        onChange={(e) => setCurrentReturnRate(Number(e.target.value))}
                        className="w-full h-2 bg-dark-card/40 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>5%</span>
                        <span>50%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-green-400" />
                      Impact Estimé
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-dark-card/40 rounded-xl p-4 border border-white/[0.04]">
                        <p className="text-sm text-slate-300 mb-1">Retours évités/mois</p>
                        <p className="text-2xl font-bold text-green-400">{roiCalculations.savedReturns}</p>
                      </div>
                      <div className="bg-dark-card/40 rounded-xl p-4 border border-white/[0.04]">
                        <p className="text-sm text-slate-300 mb-1">Économie retours/mois</p>
                        <p className="text-2xl font-bold text-green-400">{roiCalculations.returnCostSaved.toLocaleString()}€</p>
                      </div>
                      <div className="bg-dark-card/40 rounded-xl p-4 border border-white/[0.04]">
                        <p className="text-sm text-slate-300 mb-1">Conversions supplémentaires</p>
                        <p className="text-2xl font-bold text-purple-400">+{roiCalculations.conversionIncrease}</p>
                      </div>
                      <div className="bg-dark-card/40 rounded-xl p-4 border border-white/[0.04]">
                        <p className="text-sm text-slate-300 mb-1">Revenu additionnel/mois</p>
                        <p className="text-2xl font-bold text-purple-400">{roiCalculations.additionalRevenue.toLocaleString()}€</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500/10 to-purple-500/10 rounded-xl p-6 border border-green-500/20">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-slate-300 mb-1">Bénéfice annuel estimé</p>
                          <p className="text-3xl font-bold text-white">{roiCalculations.annualBenefit.toLocaleString()}€</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-300 mb-1">ROI annuel</p>
                          <p className="text-3xl font-bold text-green-400">{roiCalculations.roi.toLocaleString()}%</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-4 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Basé sur -60% retours et +40% conversions
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </AnimatedBorder>
          </ScrollReveal>
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
                  <Quote className="w-8 h-8 text-purple-400/50 mb-4" />
                  
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  <p className="text-slate-300 mb-6 leading-relaxed">&quot;{testimonial.content}&quot;</p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{testimonial.name}</p>
                        <p className="text-xs text-slate-500">{testimonial.role}, {testimonial.company}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full">{testimonial.category}</span>
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
              { icon: <Lock className="w-6 h-6" />, title: 'Traitement Local', desc: 'Aucune donnée faciale envoyée aux serveurs' },
              { icon: <Shield className="w-6 h-6" />, title: 'RGPD Compliant', desc: 'Pas de stockage de données biométriques' },
              { icon: <CheckCircle className="w-6 h-6" />, title: 'CDN Européen', desc: 'Hébergement et données en Europe' },
              { icon: <Lock className="w-6 h-6" />, title: 'SOC 2 Type II', desc: 'Audit de sécurité indépendant' },
            ].map((item, i) => (
              <ScrollReveal key={i} animation="fade-up" staggerIndex={i} staggerDelay={80}>
                <Card className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] p-6 text-center h-full hover:-translate-y-1">
                  <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-purple-400">
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
                <Card
                  className={`bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] overflow-hidden transition-colors cursor-pointer hover:-translate-y-1 ${
                    openFaqIndex === index ? 'border-purple-400' : ''
                  }`}
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white pr-8">{item.question}</h3>
                      <ChevronDown
                        className={`w-5 h-5 text-purple-400 transition-transform flex-shrink-0 ${
                          openFaqIndex === index ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                    {openFaqIndex === index && (
                      <p className="text-slate-300 mt-4 leading-relaxed">{item.answer}</p>
                    )}
                  </div>
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

export default function VirtualTryOnPage() {
  return (
    <>
      <FAQStructuredData questions={faqItems} />
      <ProductStructuredData
        name="Virtual Try-On AR"
        description="Essayage virtuel en réalité augmentée avec tracking facial 468 points. Compatible mobile et desktop, export USDZ/GLB pour AR native."
      />
      <ErrorBoundary level="page" componentName="VirtualTryOnPage">
        <VirtualTryOnPageContent />
      </ErrorBoundary>
    </>
  );
}
