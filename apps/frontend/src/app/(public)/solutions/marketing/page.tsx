'use client';

import React, { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Megaphone,
  Target,
  TrendingUp,
  Zap,
  ArrowRight,
  Sparkles,
  Eye,
  Share2,
  BarChart,
  Mail,
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

export default function MarketingPage() {
  const [channel, setChannel] = useState<'Email' | 'Social Ads' | 'Display' | 'Print'>('Email');
  const [goal, setGoal] = useState('Conversions');
  const [budget, setBudget] = useState(2500);
  const [persona, setPersona] = useState('Responsable e-commerce');
  const [notes, setNotes] = useState('Mettre en avant la personnalisation en temps réel.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeline, setTimeline] = useState<string[]>([]);
  const [sequenceSteps, setSequenceSteps] = useState([
    {
      subject: 'Annonce lancement collection personnalisable',
      cta: 'Découvrir les modèles',
    },
    {
      subject: 'Rappel A/B (CTA vs visuel)',
      cta: 'Tester son design',
    },
  ]);
  const [sequenceStatus, setSequenceStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [_sequenceError, setSequenceError] = useState<string | null>(null);

  const features = [
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Campagnes Ciblées',
      description: 'Créez des visuels personnalisés pour chaque segment.',
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'Génération AI',
      description: 'Créez des milliers de variantes avec DALL-E 3.',
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'Email Marketing',
      description: 'Templates personnalisables pour vos campagnes.',
    },
    {
      icon: <BarChart className="w-6 h-6" />,
      title: 'A/B Testing',
      description: 'Testez visuels et mesurez performances.',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Analytics',
      description: 'Tracking ROI, CTR, conversions en temps réel.',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Automation',
      description: 'Campagnes automatiques déclenchées par événements.',
    },
  ];

  const channelPresets = useMemo<Record<
    typeof channel,
    { hooks: string[]; cadence: string[]; metrics: { ctr: number; cpa: number } }
  >>(() => ({
    Email: {
      hooks: ['Personnalisation dynamique', 'Compteur temps réel', 'Upsell bundles'],
      cadence: ['J1 teaser', 'J3 lancement', 'J5 preuve sociale', 'J10 relance finale'],
      metrics: { ctr: 6.2, cpa: 18 },
    },
    'Social Ads': {
      hooks: ['UGC vidéo', 'Auto-placements Meta', 'TikTok Spark Ads'],
      cadence: ['always-on awareness', 'retarget 3 touches', 'catalog sales'],
      metrics: { ctr: 3.4, cpa: 22 },
    },
    Display: {
      hooks: ['Bannières dynamiques', 'Contextual ABM', 'Heatmap optimisée'],
      cadence: ['Programmatique', 'PMAX créa', 'RLSA'],
      metrics: { ctr: 1.8, cpa: 28 },
    },
    Print: {
      hooks: ['QR tracking', 'Codes promos uniques', 'Packaging personnalisé'],
      cadence: ['Créa format 30x50', 'Envoi retarget boutiques', 'PLV week-end'],
      metrics: { ctr: 8.6, cpa: 12 },
    },
  }), []);

  const benefits = [
    {
      title: 'CTR',
      description: 'Augmentation',
      stat: '+45%',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'ROI',
      description: 'Retour investissement',
      stat: 'x3.5',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Création',
      description: 'Temps économisé',
      stat: '-80%',
      color: 'from-orange-500 to-red-500',
    },
    {
      title: 'Variantes',
      description: 'Par campagne',
      stat: '1000+',
      color: 'from-green-500 to-teal-500',
    },
  ];

  const useCases = [
    { title: 'Email Campaigns', icon: '📧', description: 'Newsletters personnalisées' },
    { title: 'Social Ads', icon: '📱', description: 'Facebook, Instagram, TikTok' },
    { title: 'Display Ads', icon: '🖼️', description: 'Bannières web dynamiques' },
    { title: 'Print Materials', icon: '📄', description: 'Flyers, catalogues, affiches' },
  ];

  const planPreview = useMemo(() => {
    const preset = channelPresets[channel];
    return [
      `🎯 Objectif : ${goal} (${persona})`,
      `💰 Budget : ${budget.toLocaleString('fr-FR')} €`,
      `📡 Canal : ${channel}`,
      `⚡ Hooks : ${preset.hooks.join(', ')}`,
      `🗓️ Cadence : ${preset.cadence.join(' → ')}`,
      `📝 Notes : ${notes || '—'}`,
    ];
  }, [budget, channel, goal, notes, persona, channelPresets]);

  const projectedResults = useMemo(() => {
    const preset = channelPresets[channel];
    const impressions = Math.round((budget / preset.metrics.cpa) * 1200);
    const clicks = Math.round((impressions * preset.metrics.ctr) / 100);
    const leads = Math.round(clicks * 0.38);
    const revenue = Math.round(leads * 89);
    return { impressions, clicks, leads, revenue, ctr: preset.metrics.ctr, cpa: preset.metrics.cpa };
  }, [budget, channel, channelPresets]);

  const handleGeneratePlan = () => {
    setIsGenerating(true);
    setCopied(false);
    setTimeout(() => {
      setTimeline((_prev) => [
        {
          Email: 'Email #1 - teaser + dynamique stock',
          'Social Ads': 'Meta Advantage+ + CAPI v2',
          Display: 'PMAX + DV360',
          Print: 'PLV retail + flyers Q4',
        }[channel] || 'Activation cross-canal',
        `Simulation mise à jour (${new Date().toLocaleTimeString('fr-FR')})`,
        `Budget optimisé : ${budget.toLocaleString('fr-FR')} €`,
      ]);
      setIsGenerating(false);
    }, 900);
  };

  const handleCopyPlan = async () => {
    try {
      await navigator.clipboard.writeText(planPreview.join('\n'));
      setCopied(true);
    } catch (error) {
      logger.error('Copy plan failed', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const _updateSequenceStep = (index: number, key: 'subject' | 'cta', value: string) => {
    setSequenceSteps((prev) => prev.map((step, i) => (i === index ? { ...step, [key]: value } : step)));
  };

  const _addSequenceStep = () => {
    setSequenceSteps((prev) => [
      ...prev,
      { subject: `Relance ${prev.length + 1}`, cta: 'Planifier un call' },
    ]);
  };

  const _handleSendSequence = async () => {
    setSequenceStatus('sending');
    setSequenceError(null);
    try {
      await api.post('/api/v1/emails/send-welcome', {
        email: 'marketing@demo.com',
        brandName: persona,
        subject: `Séquence ${channel} (${goal})`,
        customMessage: sequenceSteps.map((step, i) => `${i + 1}. ${step.subject} → ${step.cta}`).join('\n'),
      });
      setSequenceStatus('sent');
      setTimeout(() => setSequenceStatus('idle'), 4000);
    } catch (error: any) {
      logger.error('Send sequence failed', {
        error,
        channel,
        goal,
        stepsCount: sequenceSteps.length,
        message: error.message || 'Unknown error',
      });
      setSequenceError("Impossible d'envoyer la séquence (sandbox).");
      setSequenceStatus('error');
    }
  };

  const scrollToInteractive = () => {
    const anchor = document.getElementById('marketing-orchestrator');
    anchor?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <ErrorBoundary level="page" componentName="MarketingPage">
    <>
      <PageHero
        title="Marketing"
        description="Créez des campagnes marketing ultra-personnalisées. Génération AI, A/B testing, analytics - tout pour maximiser votre ROI marketing."
        badge="Marketing Automation"
        gradient="from-rose-600 via-pink-600 to-purple-600"
        cta={{
          label: 'Voir l\'orchestrateur',
          href: '#marketing-orchestrator'
        }}
      />

    <div className="min-h-screen dark-section relative noise-overlay">
      <div className="absolute inset-0 gradient-mesh-purple" />

      <section
        id="marketing-orchestrator"
        className="dark-section relative noise-overlay py-20 px-4"
      >
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 z-10">
          <ScrollReveal animation="fade-up">
            <AnimatedBorder hoverOnly speed="slow">
              <Card className="p-8 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] shadow-2xl shadow-purple-500/10">
                <h2 className="text-2xl font-display font-bold text-white mb-2">Orchestrateur Temps Réel</h2>
                <p className="text-slate-400 mb-6">
              Configurez objectifs, budget et persona pour générer automatiquement un plan exploitable.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Canal principal</label>
                <select
                  value={channel}
                  onChange={(event) => setChannel(event.target.value as typeof channel)}
                  className="w-full bg-dark-card/60 border border-white/[0.04] rounded-lg px-3 py-2 text-white"
                >
                  <option>Email</option>
                  <option>Social Ads</option>
                  <option>Display</option>
                  <option>Print</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Objectif</label>
                  <Input value={goal} onChange={(event) => setGoal(event.target.value)} />
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Persona</label>
                  <Input value={persona} onChange={(event) => setPersona(event.target.value)} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>Budget mensuel</span>
                  <span>{budget.toLocaleString('fr-FR')} €</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={20000}
                  step={250}
                  value={budget}
                  onChange={(event) => setBudget(Number(event.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Notes stratégiques</label>
                <Textarea
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Lancement collection, focus mobile, CTA test..."
                />
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleGeneratePlan}
                  disabled={isGenerating}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25"
                >
                  {isGenerating ? 'Simulation...' : 'Générer le plan'}
                </Button>
                <Button variant="outline" onClick={handleCopyPlan} className="flex-1 border-white/[0.04] text-white hover:bg-white/10">
                  {copied ? 'Copié ✅' : 'Copier le brief'}
                </Button>
              </div>
            </Card>
          </AnimatedBorder>
          </ScrollReveal>
          <div className="space-y-6">
            <ScrollReveal animation="fade-up" delay={100}>
              <AnimatedBorder hoverOnly speed="slow">
                <Card className="p-6 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-400">Plan généré</p>
                  <h3 className="text-lg font-semibold text-white">Brief multi-canal</h3>
                </div>
                  <div className="text-xs px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    {channel}
                  </div>
                </div>
                <ul className="space-y-3">
                  {planPreview.map((line) => (
                    <li
                      key={line}
                      className="text-sm text-slate-200 border border-white/[0.04] rounded-lg px-3 py-2 bg-dark-card/40"
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </Card>
            </AnimatedBorder>
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={200}>
              <AnimatedBorder hoverOnly speed="slow">
                <Card className="p-6 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04]">
              <h3 className="text-white font-semibold mb-4">Timeline</h3>
                  {timeline.length === 0 ? (
                    <p className="text-sm text-slate-400">Cliquez sur "Générer le plan" pour construire la timeline.</p>
                  ) : (
                    <ul className="space-y-3">
                      {timeline.map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-200 flex items-center justify-center font-semibold">
                            {index + 1}
                          </div>
                          <p className="text-slate-200 text-sm">{item}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </AnimatedBorder>
            </ScrollReveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'CTR projeté', value: `${projectedResults.ctr}%` },
                { label: 'CPA estimé', value: `${projectedResults.cpa} €` },
                { label: 'Leads', value: projectedResults.leads },
                { label: 'CA potentiel', value: `${projectedResults.revenue.toLocaleString('fr-FR')} €` },
              ].map((stat, i) => (
                <ScrollReveal key={i} animation="fade-up" delay={i * 50}>
                  <AnimatedBorder hoverOnly speed="slow">
                    <Card className="p-4 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04]">
                      <p className="text-xs text-slate-400">{stat.label}</p>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </Card>
                  </AnimatedBorder>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="glow-separator" />

      <section className="dark-section relative noise-overlay py-20 px-4">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Fonctionnalités Marketing</h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <ScrollReveal key={i} animation="fade-up" delay={i * 100}>
                <AnimatedBorder hoverOnly speed="slow">
                  <Card className="p-6 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04]">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white/70 mb-4" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(236,72,153,0.1))' }}>
                      {f.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                    <p className="text-slate-400">{f.description}</p>
                  </Card>
                </AnimatedBorder>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="glow-separator" />

      <section className="dark-section relative noise-overlay py-20 px-4">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Résultats</h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((b, i) => (
              <ScrollReveal key={i} animation="fade-up" delay={i * 100}>
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${b.color} rounded-full mb-4`}>
                    <span className="text-3xl font-bold text-white">{b.stat}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{b.title}</h3>
                  <p className="text-slate-400">{b.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="glow-separator" />

      <section className="dark-section relative noise-overlay py-20 px-4">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Cas d'Usage</h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((u, i) => (
              <ScrollReveal key={i} animation="fade-up" delay={i * 100}>
                <AnimatedBorder hoverOnly speed="slow">
                  <Card className="p-6 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] text-center">
                    <div className="text-6xl mb-4">{u.icon}</div>
                    <h3 className="text-lg font-bold text-white mb-2">{u.title}</h3>
                    <p className="text-sm text-slate-400">{u.description}</p>
                  </Card>
                </AnimatedBorder>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="glow-separator" />

      <CTASectionNew />
    </div>
    </>
    </ErrorBoundary>
  );
}
