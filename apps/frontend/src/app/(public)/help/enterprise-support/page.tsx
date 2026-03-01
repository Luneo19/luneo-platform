'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Mail, MessageCircle, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHero, FeatureCard } from '@/components/marketing/shared';
import { SUPPORT_CONFIG, hasLiveChatConfigured } from '@/lib/support-config';

function EnterpriseSupportPageContent() {
  const features = useMemo(() => [
    'Account manager dedie',
    'Support 24/7 par email + chat en direct',
    'SLA 99.9% uptime garanti',
    'Onboarding personnalise',
    'Formation equipe incluse',
  ], []);

  const channels = useMemo(() => [
    {
      icon: Mail,
      title: 'Canal principal',
      description: SUPPORT_CONFIG.email,
    },
    {
      icon: MessageCircle,
      title: 'Canal temps reel',
      description: hasLiveChatConfigured() ? 'Chat en direct actif' : 'Formulaire de ticket',
    },
    {
      icon: Shield,
      title: 'SLA entreprise',
      description: 'Priorite elevee et suivi incident dedie',
    },
  ], []);

  return (
    <div className="min-h-screen">
      <PageHero
        title="Enterprise Support"
        description="Un parcours support harmonise avec nos parcours publics et dashboard."
        gradient="from-slate-800 via-indigo-800 to-blue-700"
      />

      <section className="max-w-7xl mx-auto px-4 py-14 sm:py-20">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {channels.map((channel) => {
            const Icon = channel.icon;
            return (
              <FeatureCard
                key={channel.title}
                icon={<Icon className="w-6 h-6 text-blue-400" />}
                title={channel.title}
                description={channel.description}
              />
            );
          })}
        </div>

        <Card className="p-8 bg-dark-card/60 border-white/[0.04] mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Inclus</h2>
          <div className="space-y-3 text-slate-200">
            {features.map((feature, index) => (
              <div key={index} className="flex gap-2 items-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild className="bg-blue-600 hover:bg-blue-500 text-white px-8 h-12 text-lg">
              <Link href={`mailto:${SUPPORT_CONFIG.email}`}>
                Ecrire au support
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/10 text-slate-200 hover:bg-white/5 px-8 h-12 text-lg">
              <Link href={hasLiveChatConfigured() ? SUPPORT_CONFIG.liveChatUrl : SUPPORT_CONFIG.contactPath}>
                {hasLiveChatConfigured() ? 'Ouvrir le chat' : 'Ouvrir un ticket'}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

const EnterpriseSupportPageMemo = memo(EnterpriseSupportPageContent);

export default function EnterpriseSupportPage() {
  return (
    <ErrorBoundary componentName="EnterpriseSupportPage">
      <EnterpriseSupportPageMemo />
    </ErrorBoundary>
  );
}
