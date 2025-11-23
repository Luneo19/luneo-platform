'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
import { logger } from '@/lib/logger';

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
      const response = await fetch('/api/emails/send-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'marketing@demo.com',
          brandName: persona,
          subject: `Séquence ${channel} (${goal})`,
          customMessage: sequenceSteps.map((step, i) => `${i + 1}. ${step.subject} → ${step.cta}`).join('\n'),
        }),
      });
      if (!response.ok) {
        throw new Error('send failed');
      }
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
    <div className="min-h-screen bg-gray-900">
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-rose-900 to-pink-900 py-20 px-4">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black,transparent)]" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-full mb-6">
              <Megaphone className="w-4 h-4 text-rose-400" />
              <span className="text-rose-300 text-sm font-medium">Marketing Automation</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
              Marketing
              <br />
              <span className="bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
                Campagnes Performantes
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Créez des campagnes marketing ultra-personnalisées. Génération AI, A/B testing,
              analytics - tout pour maximiser votre ROI marketing.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={scrollToInteractive}
                className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white px-8 h-12 text-lg"
              >
                <Eye className="w-5 h-5 mr-2" />
                Voir l'orchestrateur
              </Button>
              <Link href="/register">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 h-12 px-8 text-lg">
                  Commencer
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section
        id="marketing-orchestrator"
        className="py-20 px-4 bg-gray-950 border-y border-rose-900/30 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-30 blur-3xl bg-gradient-to-r from-rose-900/40 via-purple-900/20 to-transparent" />
        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-8 bg-gray-900/80 border-rose-500/30 shadow-2xl shadow-rose-900/20">
            <h2 className="text-2xl font-bold text-white mb-2">Orchestrateur Temps Réel</h2>
            <p className="text-gray-400 mb-6">
              Configurez objectifs, budget et persona pour générer automatiquement un plan exploitable.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Canal principal</label>
                <select
                  value={channel}
                  onChange={(event) => setChannel(event.target.value as typeof channel)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
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
                className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
              >
                {isGenerating ? 'Simulation...' : 'Générer le plan'}
              </Button>
              <Button variant="outline" onClick={handleCopyPlan} className="flex-1 border-rose-400 text-white">
                {copied ? 'Copié ✅' : 'Copier le brief'}
              </Button>
            </div>
          </Card>
          <div className="space-y-6">
            <Card className="p-6 bg-gray-900/90 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-400">Plan généré</p>
                  <h3 className="text-lg font-semibold text-white">Brief multi-canal</h3>
                </div>
                <div className="text-xs px-3 py-1 rounded-full bg-rose-500/10 text-rose-200 border border-rose-500/20">
                  {channel}
                </div>
              </div>
              <ul className="space-y-3">
                {planPreview.map((line) => (
                  <li
                    key={line}
                    className="text-sm text-gray-200 border border-gray-800 rounded-lg px-3 py-2 bg-black/30"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-6 bg-gray-900/70 border border-white/5">
              <h3 className="text-white font-semibold mb-4">Timeline</h3>
              {timeline.length === 0 ? (
                <p className="text-sm text-gray-500">Cliquez sur "Générer le plan" pour construire la timeline.</p>
              ) : (
                <ul className="space-y-3">
                  {timeline.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-200 flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <p className="text-gray-200 text-sm">{item}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-gray-900/80 border border-rose-500/20">
                <p className="text-xs text-gray-400">CTR projeté</p>
                <p className="text-2xl font-bold text-white">{projectedResults.ctr}%</p>
              </Card>
              <Card className="p-4 bg-gray-900/80 border border-rose-500/20">
                <p className="text-xs text-gray-400">CPA estimé</p>
                <p className="text-2xl font-bold text-white">{projectedResults.cpa} €</p>
              </Card>
              <Card className="p-4 bg-gray-900/80 border border-rose-500/20">
                <p className="text-xs text-gray-400">Leads</p>
                <p className="text-2xl font-bold text-white">{projectedResults.leads}</p>
              </Card>
              <Card className="p-4 bg-gray-900/80 border border-rose-500/20">
                <p className="text-xs text-gray-400">CA potentiel</p>
                <p className="text-2xl font-bold text-white">
                  {projectedResults.revenue.toLocaleString('fr-FR')} €
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Fonctionnalités Marketing</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <Card key={i} className="p-6 bg-gray-800/50 border-gray-700">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg flex items-center justify-center text-white mb-4">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400">{f.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((b, i) => (
              <div key={i} className="text-center">
                <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${b.color} rounded-full mb-4`}>
                  <span className="text-3xl font-bold text-white">{b.stat}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{b.title}</h3>
                <p className="text-gray-400">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Cas d'Usage</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((u, i) => (
              <Card key={i} className="p-6 bg-gray-800/50 border-gray-700 text-center">
                <div className="text-6xl mb-4">{u.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{u.title}</h3>
                <p className="text-sm text-gray-400">{u.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-br from-rose-900 to-pink-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Boostez votre marketing</h2>
          <p className="text-xl text-gray-200 mb-8">ROI x3.5 en moyenne</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button className="bg-white text-rose-900 hover:bg-gray-100 px-8 h-12 text-lg font-semibold">
                <Sparkles className="w-5 h-5 mr-2" />
                Commencer
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 h-12 px-8 text-lg">
                <Share2 className="w-5 h-5 mr-2" />
                Contact
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
