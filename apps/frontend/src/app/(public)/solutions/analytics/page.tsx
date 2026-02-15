'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  ArrowRight,
  Zap,
  Brain,
  AlertTriangle,
  Database,
  Clock,
  Shield,
  Globe,
  Lock,
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

// Illustrative metrics for the marketing page (example data to showcase capabilities)
const mockMetrics = [
  { label: 'Visiteurs uniques', value: '24,891', change: '+12.5%', up: true, icon: Users },
  { label: 'Taux de conversion', value: '3.8%', change: '+0.6%', up: true, icon: Target },
  { label: 'Revenu mensuel', value: '€48,230', change: '+18.2%', up: true, icon: TrendingUp },
  { label: 'Panier moyen', value: '€67.40', change: '-2.1%', up: false, icon: PieChart },
];

const mockFunnel = [
  { step: 'Visite page produit', count: 12450, pct: 100 },
  { step: 'Ajout au panier', count: 4890, pct: 39.3 },
  { step: 'Début checkout', count: 2134, pct: 17.1 },
  { step: 'Paiement complété', count: 1247, pct: 10.0 },
];

// Testimonials
const testimonials: Testimonial[] = [
  {
    name: 'Alexandre Moreau',
    role: 'Head of Growth',
    company: 'EcomTech',
    avatar: '/images/testimonials/alexandre.jpg',
    content: "Les analytics IA avec prédictions nous permettent d'anticiper les tendances et d'optimiser nos campagnes en temps réel. ROI marketing multiplié par 2.5.",
    rating: 5,
    category: 'E-commerce',
    metric: 'x2.5 ROI',
  },
  {
    name: 'Julie Bernard',
    role: 'CMO',
    company: 'Fashion Forward',
    avatar: '/images/testimonials/julie.jpg',
    content: "Les funnels avancés nous ont permis d'identifier les points de friction dans notre parcours client. Conversions +35% en 2 mois.",
    rating: 5,
    category: 'Mode',
    metric: '+35% conversions',
  },
  {
    name: 'Marc Dubois',
    role: 'CEO',
    company: 'TechStart',
    avatar: '/images/testimonials/marc.jpg',
    content: "La détection d'anomalies automatique nous alerte dès qu'une métrique dévie. Nous avons évité plusieurs problèmes critiques grâce à ça.",
    rating: 5,
    category: 'SaaS',
    metric: '-80% incidents',
  },
];

// FAQ items
const faqItems = [
  {
    question: 'Quelle est la différence entre Analytics et Analytics Avancées ?',
    answer: "Analytics fournit les métriques de base : visiteurs, conversions, revenus, etc. Analytics Avancées ajoute les funnels personnalisés, les cohortes, les prédictions IA, la détection d'anomalies, et les corrélations avancées. Parfait pour les équipes qui veulent aller plus loin dans l'analyse.",
  },
  {
    question: 'Comment fonctionnent les prédictions IA ?',
    answer: "Nous utilisons des modèles de machine learning entraînés sur vos données historiques pour prédire les tendances futures (revenus, conversions, rétention). Les prédictions sont mises à jour quotidiennement et incluent des intervalles de confiance pour évaluer la fiabilité.",
  },
  {
    question: 'Puis-je créer des funnels personnalisés ?',
    answer: "Oui ! Vous pouvez créer des funnels avec vos propres étapes personnalisées. Par exemple : 'Visite produit' → 'Ajout panier' → 'Début checkout' → 'Paiement'. Les funnels sont visualisés avec des taux de conversion entre chaque étape.",
  },
  {
    question: 'Les données sont-elles stockées en Europe ?',
    answer: "Oui, toutes les données analytics sont hébergées sur nos serveurs européens (RGPD compliant). Nous ne partageons jamais vos données avec des tiers et respectons strictement la confidentialité.",
  },
  {
    question: 'Quelle est la latence des données en temps réel ?',
    answer: "Les données temps réel sont mises à jour toutes les 30 secondes. Pour les rapports historiques, les données sont agrégées et disponibles instantanément grâce à notre système de cache optimisé.",
  },
  {
    question: 'Puis-je exporter mes données ?',
    answer: "Oui, vous pouvez exporter vos analytics en CSV, Excel, ou PDF. Les exports incluent toutes les métriques, funnels, cohortes, et prédictions. Parfait pour vos rapports internes ou présentations.",
  },
];

function AnalyticsPageContent() {
  const { t } = useI18n();
  const { data: solutionData } = useSolutionData('analytics');

  const [activeTab, setActiveTab] = useState<'overview' | 'funnel' | 'predictions'>('overview');

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

  return (
    <>
      <PageHero
        title="Analytics"
        description="Analytics avancés avec prédictions IA, funnels personnalisés, cohortes, et détection d'anomalies. Prenez des décisions data-driven pour maximiser votre croissance."
        badge="Analytics IA"
        gradient="from-emerald-600 via-teal-600 to-cyan-600"
        cta={{
          label: 'Voir la démo',
          href: '#demo'
        }}
      />

      <div className="min-h-screen dark-section relative noise-overlay">
        <div className="absolute inset-0 gradient-mesh-purple" />
        
        {/* Demo Section */}
        <section id="demo" className="dark-section relative noise-overlay py-20 md:py-32 px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0 gradient-mesh-purple" />
          <div className="relative max-w-7xl mx-auto z-10">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-white italic">
                  <span className="text-gradient-purple">Dashboard Analytics en Action</span>
                </h2>
                <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                  Visualisez vos métriques clés et identifiez les opportunités d'optimisation
                </p>
              </div>
            </ScrollReveal>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 justify-center">
              {(['overview', 'funnel', 'predictions'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-emerald-600 text-white'
                      : 'bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] text-slate-400 hover:bg-dark-card/80 hover:text-white'
                  }`}
                >
                  {tab === 'overview' ? 'Vue globale' : tab === 'funnel' ? 'Funnel' : 'Prédictions IA'}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <ScrollReveal animation="fade-up">
                <AnimatedBorder hoverOnly speed="slow">
                  <Card className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                      {mockMetrics.map((m) => (
                        <div key={m.label} className="p-5 bg-dark-card/40 rounded-xl border border-white/[0.04]">
                          <div className="flex items-center justify-between mb-3">
                            <m.icon className="w-5 h-5 text-emerald-400" />
                            <span
                              className={`text-xs font-medium flex items-center gap-0.5 ${
                                m.up ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {m.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {m.change}
                            </span>
                          </div>
                          <p className="text-2xl font-bold text-white">{m.value}</p>
                          <p className="text-xs text-slate-400 mt-1">{m.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Mock chart placeholder */}
                    <div className="p-6 bg-dark-card/40 rounded-xl border border-white/[0.04]">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-400" />
                        Tendance des revenus (30 jours)
                      </h3>
                      <div className="h-48 flex items-end gap-1">
                        {Array.from({ length: 30 }, (_, i) => {
                          const h = 20 + Math.sin(i * 0.4) * 15 + Math.random() * 30;
                          return (
                            <div
                              key={i}
                              className="flex-1 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                              style={{ height: `${h}%` }}
                              title={`Jour ${i + 1}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                </AnimatedBorder>
              </ScrollReveal>
            )}

            {/* Funnel Tab */}
            {activeTab === 'funnel' && (
              <ScrollReveal animation="fade-up">
                <AnimatedBorder hoverOnly speed="slow">
                  <Card className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] p-8">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <Target className="w-5 h-5 text-emerald-400" />
                      Funnel de conversion
                    </h3>
                    <div className="space-y-4">
                      {mockFunnel.map((step, i) => (
                        <div key={step.step}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-slate-300">{step.step}</span>
                            <span className="text-sm text-slate-400">
                              {step.count.toLocaleString()} ({step.pct}%)
                            </span>
                          </div>
                          <div className="w-full h-8 bg-dark-card/40 rounded-lg overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-lg transition-all duration-700 flex items-center justify-end pr-2"
                              style={{ width: `${step.pct}%` }}
                            >
                              {step.pct > 15 && (
                                <span className="text-xs text-white font-medium">{step.pct}%</span>
                              )}
                            </div>
                          </div>
                          {i < mockFunnel.length - 1 && (
                            <p className="text-xs text-slate-500 mt-1 ml-4">
                              Taux de passage : {((mockFunnel[i + 1].count / step.count) * 100).toFixed(1)}%
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                </AnimatedBorder>
              </ScrollReveal>
            )}

            {/* Predictions Tab */}
            {activeTab === 'predictions' && (
              <ScrollReveal animation="fade-up">
                <AnimatedBorder hoverOnly speed="slow">
                  <Card className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] p-8">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-emerald-400" />
                      Prédictions IA - Revenus (30 prochains jours)
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-300">Revenu prédit</span>
                          <span className="text-lg font-bold text-emerald-400">€52,340</span>
                        </div>
                        <p className="text-xs text-slate-400">Intervalle de confiance : €48,200 - €56,480 (95%)</p>
                      </div>
                      <div className="p-4 bg-dark-card/40 rounded-lg border border-white/[0.04]">
                        <p className="text-sm text-slate-300 mb-2">Tendance</p>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm text-white">+8.5% par rapport à la période précédente</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </AnimatedBorder>
              </ScrollReveal>
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
                  <span className="text-gradient-purple">Pourquoi Choisir Analytics Luneo ?</span>
                </h2>
                <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                  Des insights actionnables pour maximiser votre croissance
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  title: 'Prédictions IA',
                  description: 'Anticipez les tendances avec des modèles ML entraînés sur vos données.',
                  stat: '95%',
                  icon: <Brain className="w-8 h-8" />,
                },
                {
                  title: 'Temps Réel',
                  description: 'Données mises à jour toutes les 30 secondes pour une réactivité maximale.',
                  stat: '30s',
                  icon: <Clock className="w-8 h-8" />,
                },
                {
                  title: 'Détection Anomalies',
                  description: 'Alertes automatiques quand une métrique dévie de la normale.',
                  stat: 'Auto',
                  icon: <AlertTriangle className="w-8 h-8" />,
                },
                {
                  title: 'ROI Marketing x2.5',
                  description: 'Optimisez vos campagnes avec des insights data-driven.',
                  stat: 'x2.5',
                  icon: <TrendingUp className="w-8 h-8" />,
                },
              ].map((benefit, index) => (
                <ScrollReveal key={index} animation="fade-up" staggerIndex={index} staggerDelay={80}>
                  <Card className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] p-6 h-full hover:-translate-y-1">
                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center mb-4 text-emerald-400">
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
                  Une suite complète d'outils analytics pour votre croissance
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'Funnels Personnalisés',
                  description: 'Créez des funnels avec vos propres étapes et visualisez les taux de conversion.',
                  icon: <Target className="w-6 h-6" />,
                },
                {
                  title: 'Cohortes & Rétention',
                  description: 'Analysez la rétention par cohorte et identifiez les points d\'amélioration.',
                  icon: <Users className="w-6 h-6" />,
                },
                {
                  title: 'Prédictions IA',
                  description: 'Modèles ML pour prédire revenus, conversions, et rétention.',
                  icon: <Brain className="w-6 h-6" />,
                },
                {
                  title: 'Détection Anomalies',
                  description: 'Alertes automatiques quand une métrique dévie significativement.',
                  icon: <AlertTriangle className="w-6 h-6" />,
                },
                {
                  title: 'Corrélations Avancées',
                  description: 'Découvrez les relations cachées entre vos métriques.',
                  icon: <PieChart className="w-6 h-6" />,
                },
                {
                  title: 'Export Multi-Format',
                  description: 'Exportez vos données en CSV, Excel, ou PDF pour vos rapports.',
                  icon: <Database className="w-6 h-6" />,
                },
                {
                  title: 'Temps Réel',
                  description: 'Données mises à jour toutes les 30 secondes pour une réactivité maximale.',
                  icon: <Activity className="w-6 h-6" />,
                },
                {
                  title: 'API Complète',
                  description: 'Intégrez vos analytics dans vos propres outils avec notre API REST.',
                  icon: <Zap className="w-6 h-6" />,
                },
              ].map((feature, index) => (
                <ScrollReveal key={index} animation="fade-up" staggerIndex={index} staggerDelay={80}>
                  <Card className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] p-6 h-full hover:-translate-y-1">
                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center mb-4 text-emerald-400">
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
                  title: 'Intégration Automatique',
                  description: 'Connectez votre site ou application. Nos scripts collectent automatiquement les événements (vues, clics, conversions).',
                },
                {
                  step: '2',
                  title: 'Configuration Personnalisée',
                  description: 'Créez vos funnels, définissez vos métriques clés, et configurez vos alertes. Tout en quelques clics.',
                },
                {
                  step: '3',
                  title: 'Analysez & Optimisez',
                  description: 'Visualisez vos données en temps réel, utilisez les prédictions IA, et optimisez vos campagnes basées sur les insights.',
                },
              ].map((step, index) => (
                <ScrollReveal key={index} animation="fade-up" staggerIndex={index} staggerDelay={80}>
                  <Card className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] p-8 h-full hover:-translate-y-1">
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-6">
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
                  Retours d&apos;expérience de leaders du e-commerce
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {dynamicTestimonials.map((testimonial, index) => (
                <ScrollReveal key={index} animation="fade-up" staggerIndex={index} staggerDelay={80}>
                  <Card className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] p-6 h-full hover:-translate-y-1">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <span key={i} className="text-yellow-400">★</span>
                      ))}
                    </div>

                    <p className="text-slate-300 mb-6 leading-relaxed">&quot;{testimonial.content}&quot;</p>

                    <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                          {testimonial.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{testimonial.name}</p>
                          <p className="text-xs text-slate-500">{testimonial.role}, {testimonial.company}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">{testimonial.category}</span>
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
                { icon: <Shield className="w-6 h-6" />, title: 'RGPD Compliant', desc: 'Hébergement et données en Europe' },
                { icon: <Lock className="w-6 h-6" />, title: 'Chiffrement End-to-End', desc: 'Toutes les données sont chiffrées' },
                { icon: <Globe className="w-6 h-6" />, title: 'CDN Européen', desc: 'Serveurs en Europe pour latence minimale' },
                { icon: <CheckCircle className="w-6 h-6" />, title: 'SOC 2 Type II', desc: 'Audit de sécurité indépendant' },
              ].map((item, i) => (
                <ScrollReveal key={i} animation="fade-up" staggerIndex={i} staggerDelay={80}>
                  <Card className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] p-6 text-center h-full hover:-translate-y-1">
                    <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-emerald-400">
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

export default function AnalyticsPage() {
  return (
    <>
      <FAQStructuredData questions={faqItems} />
      <ProductStructuredData
        name="Analytics Luneo"
        description="Analytics avancés avec prédictions IA, funnels personnalisés, cohortes, et détection d'anomalies. Prenez des décisions data-driven."
      />
      <ErrorBoundary level="page" componentName="AnalyticsPage">
        <AnalyticsPageContent />
      </ErrorBoundary>
    </>
  );
}
