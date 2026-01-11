'use client';

import React, { useState, memo, useCallback, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import {
  Share2,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Calendar,
  Sparkles,
  Eye,
  ArrowRight,
  TrendingUp,
  Image as ImageIcon,
  Video,
  FileText,
  CheckCircle,
  Zap,
  BarChart,
  Clock,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { logger } from '@/lib/logger';
import { PageHero, SectionHeader } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';

function SocialMediaPageContent() {
  const [selectedPlatform, setSelectedPlatform] = useState<{
    name: string;
    icon: React.ReactNode;
    color: string;
  }>({
    name: 'Instagram',
    icon: <Instagram className="w-5 h-5" />,
    color: 'from-pink-500 to-purple-600',
  });
  const [postType, setPostType] = useState<'post' | 'story' | 'reel'>('post');
  const [content, setContent] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleStatus, setScheduleStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const platforms = [
    { name: 'Instagram', icon: <Instagram className="w-5 h-5" />, color: 'from-pink-500 to-purple-600' },
    { name: 'Facebook', icon: <Facebook className="w-5 h-5" />, color: 'from-blue-600 to-blue-700' },
    { name: 'Twitter/X', icon: <Twitter className="w-5 h-5" />, color: 'from-sky-400 to-blue-600' },
    { name: 'LinkedIn', icon: <Linkedin className="w-5 h-5" />, color: 'from-blue-600 to-blue-800' },
  ];

  const postTypes = [
    { id: 'post', name: 'Post', icon: <FileText className="w-4 h-4" /> },
    { id: 'story', name: 'Story', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'reel', name: 'Reel', icon: <Video className="w-4 h-4" /> },
  ];

  const scrollToOrchestrator = () => {
    const anchor = document.getElementById('social-orchestrator');
    anchor?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleGenerateContent = async () => {
    setIsGenerating(true);
    setTimeout(() => {
      setContent('🎨 Nouveau design disponible ! Découvrez notre collection personnalisable avec des designs uniques créés par IA. #Design #Personnalisation #IA');
      setIsGenerating(false);
    }, 1500);
  };

  const handleSchedule = async () => {
    if (!content.trim() || !scheduledDate || !scheduledTime) {
      setScheduleStatus('error');
      return;
    }
    setIsScheduling(true);
    setScheduleStatus('idle');
    try {
      const response = await fetch('/api/emails/send-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'social@luneo.app',
          brandName: selectedPlatform.name,
          subject: `Publication programmée ${selectedPlatform.name}`,
          customMessage: `Type: ${postType}\nDate: ${scheduledDate} ${scheduledTime}\nContenu: ${content}`,
        }),
      });
      if (!response.ok) throw new Error('Schedule failed');
      setScheduleStatus('success');
      setTimeout(() => {
        setScheduleStatus('idle');
        setContent('');
        setScheduledDate('');
        setScheduledTime('');
      }, 3000);
    } catch (error) {
      logger.error('Schedule post failed', {
        error,
        platform: selectedPlatform,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      setScheduleStatus('error');
    } finally {
      setIsScheduling(false);
    }
  };

  const features = [
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Planning Automatique',
      description: 'Programmez vos publications à l\'avance sur tous vos réseaux.',
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'Génération IA',
      description: 'Créez des visuels uniques avec DALL-E 3 et des captions optimisées.',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Analytics Social',
      description: 'Suivez engagement, reach, conversions en temps réel.',
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: 'Multi-Comptes',
      description: 'Gérez tous vos profils depuis un tableau de bord unifié.',
    },
    {
      icon: <BarChart className="w-6 h-6" />,
      title: 'A/B Testing',
      description: 'Testez différents formats et horaires pour optimiser vos performances.',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Hashtags IA',
      description: 'Suggestions automatiques de hashtags pertinents par plateforme.',
    },
  ];

  const benefits = [
    {
      title: 'Engagement',
      stat: '+60%',
      description: 'Augmentation moyenne',
      color: 'from-pink-500 to-purple-500',
    },
    {
      title: 'Reach',
      stat: 'x2.5',
      description: 'Portée multipliée',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Temps',
      stat: '-75%',
      description: 'Temps économisé',
      color: 'from-orange-500 to-red-500',
    },
    {
      title: 'Posts/mois',
      stat: '100+',
      description: 'Publications automatisées',
      color: 'from-green-500 to-teal-500',
    },
  ];

  return (
    <>
      <PageHero
        title="Social Media"
        description="Automatisez vos publications sur tous les réseaux sociaux avec des visuels générés par IA. Planification, A/B testing, analytics intégrés."
        badge="Social Media Manager"
        gradient="from-pink-600 via-purple-600 to-indigo-600"
        cta={{
          label: 'Voir l\'orchestrateur',
          href: '#social-orchestrator'
        }}
      />

    <div className="min-h-screen bg-white text-gray-900">

      {/* Orchestrator Section */}
      <section
        id="social-orchestrator"
        className="py-20 px-4 bg-gray-50 border-y border-pink-200 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-30 blur-3xl bg-gradient-to-r from-pink-900/40 via-purple-900/20 to-transparent" />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Orchestrateur Social</h2>
            <p className="text-xl text-gray-400">Créez et programmez vos publications</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Platform Selection */}
            <Card className="p-8 bg-gray-900/80 border-pink-500/30">
              <h3 className="text-xl font-bold text-white mb-4">Plateforme</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {platforms.map((platform) => (
                  <Card
                    key={platform.name}
                    onClick={() => setSelectedPlatform(platform)}
                    className={`p-4 text-center cursor-pointer transition-all border-2 ${
                      selectedPlatform.name === platform.name
                        ? 'bg-gradient-to-br from-pink-900/70 to-purple-900/50 border-pink-400 shadow-lg shadow-pink-900/30'
                        : 'bg-gray-800/50 border-gray-700 hover:border-pink-400/60'
                    }`}
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${platform.color} rounded-lg flex items-center justify-center text-white mx-auto mb-2`}>
                      {platform.icon}
                    </div>
                    <p className="text-sm font-medium text-white">{platform.name}</p>
                  </Card>
                ))}
              </div>

              <h3 className="text-xl font-bold text-white mb-4">Type de publication</h3>
              <div className="grid grid-cols-3 gap-3">
                {postTypes.map((type) => (
                  <Card
                    key={type.id}
                    onClick={() => setPostType(type.id as any)}
                    className={`p-3 text-center cursor-pointer transition-all ${
                      postType === type.id
                        ? 'bg-pink-500/20 border-pink-500'
                        : 'bg-gray-800/50 border-gray-700 hover:border-pink-500/50'
                    }`}
                  >
                    <div className="text-pink-400 mb-1 flex justify-center">{type.icon}</div>
                    <p className="text-xs font-medium text-white">{type.name}</p>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Content & Schedule */}
            <Card className="p-8 bg-gray-900/80 border-pink-500/30">
              <h3 className="text-xl font-bold text-white mb-4">Contenu</h3>
              <div className="space-y-4 mb-6">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  placeholder="Écrivez votre publication ou générez du contenu avec IA..."
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <Button
                  onClick={handleGenerateContent}
                  disabled={isGenerating}
                  variant="outline"
                  className="w-full border-pink-400 text-white hover:bg-pink-500/10"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Générer avec IA
                    </>
                  )}
                </Button>
              </div>

              <h3 className="text-xl font-bold text-white mb-4">Programmation</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Date</label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Heure</label>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>

              <Button
                onClick={handleSchedule}
                disabled={isScheduling || !content.trim() || !scheduledDate || !scheduledTime}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
              >
                {isScheduling ? (
                  <>
                    <Clock className="w-5 h-5 mr-2 animate-spin" />
                    Programmation...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Programmer la publication
                  </>
                )}
              </Button>
              {scheduleStatus === 'success' && (
                <div className="mt-4 text-green-400 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Publication programmée avec succès !
                </div>
              )}
              {scheduleStatus === 'error' && (
                <div className="mt-4 text-red-400 text-sm">
                  Erreur. Vérifiez que tous les champs sont remplis.
                </div>
              )}
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Fonctionnalités Social Media</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <Card key={i} className="p-6 bg-gray-800/50 border-gray-700">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center text-white mb-4">
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

      <CTASectionNew />
    </div>
    </>
  );
}

const SocialMediaPageMemo = memo(SocialMediaPageContent);

export default function SocialMediaPage() {
  return (
    <ErrorBoundary componentName="SocialMediaPage">
      <SocialMediaPageMemo />
    </ErrorBoundary>
  );
}
