'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Share2,
  Zap,
  ArrowRight,
  Sparkles,
  Eye,
  Calendar,
  TrendingUp,
  Image as ImageIcon,
  Clock,
  Copy,
  CheckCircle2,
  SendHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { logger } from '@/lib/logger';

const defaultCalendar = [
  { id: 1, day: 'Lundi', time: '09:00', platform: 'Instagram', status: 'À préparer', format: 'Story' },
  { id: 2, day: 'Mercredi', time: '12:30', platform: 'TikTok', status: 'En design', format: 'Reel' },
  { id: 3, day: 'Vendredi', time: '18:00', platform: 'LinkedIn', status: 'Prêt', format: 'Post' },
];

export default function SocialMediaPage() {
  const features = [
    {
      icon: <ImageIcon className="w-6 h-6" />,
      title: 'Création Multi-Format',
      description: 'Stories, posts, reels - formats adaptés à chaque réseau.',
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Planning Automatique',
      description: 'Programmez vos publications à l\'avance.',
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'IA Génération',
      description: 'Créez des visuels uniques avec DALL-E 3.',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Analytics Social',
      description: 'Suivez engagement, reach, conversions.',
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: 'Multi-Comptes',
      description: 'Gérez tous vos profils depuis un tableau de bord.',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Hashtags IA',
      description: 'Suggestions automatiques de hashtags pertinents.',
    },
  ];

  const platforms = [
    { name: 'Instagram', icon: '📷', formats: 'Post, Story, Reel' },
    { name: 'Facebook', icon: '👥', formats: 'Post, Story, Cover' },
    { name: 'TikTok', icon: '🎵', formats: 'Video, Thumbnail' },
    { name: 'LinkedIn', icon: '💼', formats: 'Post, Article, Banner' },
    { name: 'Twitter', icon: '🐦', formats: 'Tweet, Header' },
    { name: 'Pinterest', icon: '📌', formats: 'Pin, Board Cover' },
  ];

  const benefits = [
    {
      title: 'Engagement',
      stat: '+60%',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Reach',
      stat: 'x2.5',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Temps',
      stat: '-75%',
      color: 'from-orange-500 to-red-500',
    },
    {
      title: 'Posts/mois',
      stat: '100+',
      color: 'from-green-500 to-teal-500',
    },
  ];

  const [selectedPlatform, setSelectedPlatform] = useState(platforms[0]);
  const [goal, setGoal] = useState('Lancement capsule été');
  const [tone, setTone] = useState('Premium, enthousiaste');
  const [cta, setCta] = useState('Acheter maintenant');
  const [captionDraft, setCaptionDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [approvalStatus, setApprovalStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [calendar, setCalendar] = useState(defaultCalendar);
  const [calendarStatus, setCalendarStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [assetVariants, setAssetVariants] = useState([
    { id: 'story', title: 'Story 9:16', status: 'à générer' },
    { id: 'post', title: 'Post carré', status: 'utiliser preset' },
    { id: 'reel', title: 'Reel 30s', status: 'IA en cours' },
  ]);

  const platformGuidelines = useMemo(() => {
    const mapping: Record<string, { bestHour: string; hook: string; hashtags: string[] }> = {
      Instagram: {
        bestHour: '19h30 (mobile)',
        hook: 'Teasing collection + CTA swipe-up',
        hashtags: ['#luneo', '#modepersonnalisée', '#drop2025'],
      },
      TikTok: {
        bestHour: '21h (scroll late)',
        hook: 'Hook 3s + trend audio',
        hashtags: ['#fyp', '#customfashion', '#3dwear'],
      },
      LinkedIn: {
        bestHour: '08h45 (pro)',
        hook: 'Insight business + CTA étude',
        hashtags: ['#retailtech', '#productcustomization', '#ecommerce'],
      },
      Facebook: {
        bestHour: '13h15',
        hook: 'Video carrousel + promo limitée',
        hashtags: ['#shopping', '#lookbook', '#newdrop'],
      },
      Twitter: {
        bestHour: '08h00 / 17h30',
        hook: 'Stat clé + thread',
        hashtags: ['#buildinpublic', '#fashiontech', '#growth'],
      },
      Pinterest: {
        bestHour: '22h inspiration',
        hook: 'Moodboard + step-by-step',
        hashtags: ['#diy', '#customdesign', '#creative'],
      },
    };
    return (
      mapping[selectedPlatform.name] || {
        bestHour: '18h',
        hook: 'Visuel hero + CTA clair',
        hashtags: ['#social', '#luneo'],
      }
    );
  }, [selectedPlatform]);

  const handleGenerateCaption = () => {
    setIsGenerating(true);
    setCopyStatus('idle');
    setTimeout(() => {
      const draft = `✨ ${goal} sur ${selectedPlatform.name}

${tone} · CTA : ${cta}

${platformGuidelines.hook}

➡️ Personnalise ta pièce en live sur luneo.app`;
      setCaptionDraft(draft);
      setAssetVariants([
        { id: 'story', title: 'Story 9:16', status: 'généré ✅' },
        { id: 'post', title: 'Post carré', status: 'mockup appliqué' },
        { id: 'reel', title: 'Reel 30s', status: 'script + cut plan' },
      ]);
      setIsGenerating(false);
    }, 900);
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(captionDraft || 'Générez le plan pour copier.');
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2500);
    } catch (error) {
      logger.error('Copy content failed', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      setCopyStatus('error');
    }
  };

  const handleSendApproval = async () => {
    if (!captionDraft) {
      setApprovalError('Générez le contenu avant envoi.');
      return;
    }
    setApprovalError(null);
    setApprovalStatus('sending');
    try {
      const response = await fetch('/api/emails/send-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'marketing@luneo.app',
          brandName: selectedPlatform.name,
          subject: `Approval ${selectedPlatform.name} (${goal})`,
          customMessage: captionDraft,
        }),
      });
      if (!response.ok) throw new Error('send failed');
      setApprovalStatus('sent');
      setTimeout(() => setApprovalStatus('idle'), 4000);
    } catch (error) {
      logger.error('Send approval failed', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      setApprovalStatus('error');
      setApprovalError("Impossible d'envoyer la validation.");
    }
  };

  const toggleCalendarStatus = (slotId: number) => {
    setCalendar((prev) =>
      prev.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              status: slot.status === 'Prêt' ? 'Programmée' : 'Prêt',
            }
          : slot,
      ),
    );
  };

  const handleSyncCalendar = async () => {
    setCalendarStatus('syncing');
    setCalendarError(null);
    try {
      const response = await fetch('/api/emails/send-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'scheduler@luneo.app',
          brandName: 'SocialOps',
          subject: 'Sync calendrier social',
          customMessage: calendar.map((slot) => `${slot.day} ${slot.time} - ${slot.platform} (${slot.status})`).join('\n'),
        }),
      });
      if (!response.ok) throw new Error('sync failed');
      setCalendarStatus('synced');
      setTimeout(() => setCalendarStatus('idle'), 4000);
    } catch (error) {
      logger.error('Sync calendar failed', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      setCalendarStatus('error');
      setCalendarError('Sync impossible sur l’environnement demo.');
    }
  };

  const scrollToInteractive = () => {
    const anchor = document.getElementById('social-studio');
    anchor?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-violet-900 to-fuchsia-900 py-20 px-4">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black,transparent)]" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6">
              <Share2 className="w-4 h-4 text-violet-400" />
              <span className="text-violet-300 text-sm font-medium">Social Media Manager</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
              Social Media
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Gestion Simplifiée
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Créez, planifiez et publiez sur tous vos réseaux sociaux. Génération IA, analytics,
              multi-comptes - gérez votre présence sociale en un seul endroit.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={scrollToInteractive}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white px-8 h-12 text-lg"
              >
                <Eye className="w-5 h-5 mr-2" />
                Voir la Social Studio
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
        id="social-studio"
        className="py-20 px-4 bg-gray-950 border-y border-violet-900/30 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-30 blur-3xl bg-gradient-to-r from-fuchsia-900/40 via-purple-900/20 to-transparent" />
        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-8 bg-gray-900/80 border-violet-500/30 shadow-2xl shadow-violet-900/20">
            <h2 className="text-2xl font-bold text-white mb-2">Social Studio</h2>
            <p className="text-gray-400 mb-6">
              Configurez votre campagne puis générez automatiquement les textes et assets adaptés à
              {` ${selectedPlatform.name}`}.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Objectif</label>
                <Input value={goal} onChange={(event) => setGoal(event.target.value)} />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Ton</label>
                <Input value={tone} onChange={(event) => setTone(event.target.value)} />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">CTA</label>
                <Input value={cta} onChange={(event) => setCta(event.target.value)} />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Brief généré</label>
                <Textarea
                  rows={6}
                  value={captionDraft}
                  onChange={(event) => setCaptionDraft(event.target.value)}
                  placeholder="Cliquez sur générer pour produire un script multi-format."
                />
              </div>
            </div>
            <div className="mt-6 flex flex-col md:flex-row gap-3">
              <Button
                onClick={handleGenerateCaption}
                disabled={isGenerating}
                className="flex-1 bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700"
              >
                {isGenerating ? 'IA en cours...' : 'Générer script & assets'}
              </Button>
              <Button
                onClick={handleCopyCaption}
                variant="outline"
                className="flex-1 border-violet-400 text-white"
              >
                {copyStatus === 'copied' ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Copié
                  </span>
                ) : copyStatus === 'error' ? (
                  'Erreur copie'
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Copy className="w-4 h-4" /> Copier
                  </span>
                )}
              </Button>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Raccourcis : Cmd+Enter pour régénérer · Support hooking Meta/TikTok API
            </div>
          </Card>
          <div className="space-y-6">
            <Card className="p-6 bg-gray-900/90 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-400">Guidelines</p>
                  <h3 className="text-lg font-semibold text-white">{selectedPlatform.name}</h3>
                </div>
                <div className="text-xs px-3 py-1 rounded-full bg-violet-500/10 text-violet-200 border border-violet-500/20">
                  {selectedPlatform.formats}
                </div>
              </div>
              <ul className="space-y-3 text-sm text-gray-200">
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-violet-300" />
                  Meilleur horaire : {platformGuidelines.bestHour}
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-300" />
                  Hook : {platformGuidelines.hook}
                </li>
                <li className="flex flex-wrap gap-2">
                  {platformGuidelines.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-100"
                    >
                      {tag}
                    </span>
                  ))}
                </li>
              </ul>
              <div className="mt-6 text-sm text-gray-400">
                Le caption généré est optimisé selon la longueur recommandée par la plateforme et
                ajoute automatiquement les mentions produit.
              </div>
            </Card>
            <Card className="p-6 bg-gray-900/80 border border-white/5">
              <h3 className="text-white font-semibold mb-4">Assets</h3>
              <ul className="space-y-3">
                {assetVariants.map((asset) => (
                  <li
                    key={asset.id}
                    className="flex items-center justify-between text-sm text-gray-200 border border-gray-800 rounded-lg px-3 py-2 bg-black/30"
                  >
                    <span>{asset.title}</span>
                    <span className="text-xs uppercase tracking-wide text-violet-300">{asset.status}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSendApproval}
                  disabled={approvalStatus === 'sending'}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700"
                >
                  {approvalStatus === 'sending' ? (
                    'Envoi équipe...'
                  ) : approvalStatus === 'sent' ? (
                    'Envoyé ✅'
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <SendHorizontal className="w-4 h-4" />
                      Envoyer en validation
                    </span>
                  )}
                </Button>
                <Button variant="outline" className="flex-1 border-white/20 text-white" onClick={handleSyncCalendar}>
                  Sync calendrier
                </Button>
              </div>
              {approvalError && (
                <p className="text-xs text-red-400 mt-2 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
                  {approvalError}
                </p>
              )}
              {calendarStatus === 'error' && calendarError && (
                <p className="text-xs text-red-400 mt-2 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
                  {calendarError}
                </p>
              )}
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 bg-gray-800/60 border border-violet-500/20 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Calendrier éditorial</h3>
              <span className="text-xs px-3 py-1 rounded-full bg-violet-500/10 text-violet-200 border border-violet-500/20">
                {calendarStatus === 'syncing'
                  ? 'Sync...'
                  : calendarStatus === 'synced'
                  ? 'À jour'
                  : 'Horizon 7 jours'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {calendar.map((slot) => (
                <div key={slot.id} className="border border-gray-700 rounded-xl p-4 bg-gray-900/80">
                  <p className="text-sm text-gray-400">{slot.day}</p>
                  <p className="text-2xl font-bold text-white">{slot.time}</p>
                  <p className="text-sm text-gray-300 mt-2">
                    {slot.platform} • {slot.format}
                  </p>
                  <button
                    onClick={() => toggleCalendarStatus(slot.id)}
                    className={`mt-4 inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full ${
                      slot.status === 'Prêt'
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/40'
                        : 'bg-yellow-500/10 text-yellow-200 border border-yellow-500/30'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {slot.status}
                  </button>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6 bg-gray-800/60 border border-violet-500/20">
            <h3 className="text-xl font-semibold text-white mb-4">Playbook Social Ops</h3>
            <ul className="space-y-4 text-sm text-gray-300">
              <li>📊 KPI live : reach, CPA, long read, taux son activé.</li>
              <li>🤖 Automations : export direct vers Meta/TikTok Ads + buffer fallback.</li>
              <li>🎯 Smart slots : recommandation heure/jour par typologie audience.</li>
              <li>🧾 Validation : workflows Slack + versioning créa.</li>
              <li>🔁 Remix : recyclage auto en format reels/stories.</li>
            </ul>
          </Card>
        </div>
      </section>

      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Tous les Réseaux</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {platforms.map((p) => (
              <Card
                key={p.name}
                onClick={() => setSelectedPlatform(p)}
                className={`p-6 text-center cursor-pointer transition-all border-2 ${
                  selectedPlatform.name === p.name
                    ? 'bg-gradient-to-br from-violet-900/70 to-fuchsia-900/50 border-violet-400 shadow-lg shadow-violet-900/30'
                    : 'bg-gray-800/50 border-gray-700 hover:border-violet-400/60'
                }`}
              >
                <div className="text-6xl mb-4">{p.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{p.name}</h3>
                <p className="text-sm text-gray-400">{p.formats}</p>
                {selectedPlatform.name === p.name && (
                  <p className="mt-3 text-xs uppercase tracking-wide text-violet-200">
                    Sélectionné
                  </p>
                )}
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
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <Card key={i} className="p-6 bg-gray-800/50 border-gray-700">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-lg flex items-center justify-center text-white mb-4">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400">{f.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-br from-violet-900 to-fuchsia-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Dominez les réseaux sociaux</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button className="bg-white text-violet-900 hover:bg-gray-100 px-8 h-12 text-lg font-semibold">
                <Sparkles className="w-5 h-5 mr-2" />
                Commencer
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
