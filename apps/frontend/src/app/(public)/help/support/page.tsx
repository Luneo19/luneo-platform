'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Mail, MessageCircle, Clock, ArrowRight } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHero, FeatureCard } from '@/components/marketing/shared';
import { SUPPORT_CONFIG, hasLiveChatConfigured } from '@/lib/support-config';

function SupportPageContent() {
  const supportChannels = useMemo(() => [
    {
      icon: Mail,
      title: 'Support email',
      contact: SUPPORT_CONFIG.email,
      description: 'Réponse sous 24h',
      color: 'text-blue-600'
    },
    {
      icon: MessageCircle,
      title: 'Chat en direct',
      contact: 'Chat en direct',
      description: 'Lun-Ven 9h-18h',
      color: 'text-green-600'
    }
  ], []);

  const hours = useMemo(() => [
    { service: 'Support email', schedule: '24/7 - Réponse sous 24h' },
    { service: 'Chat en direct', schedule: 'Lun-Ven 9h-18h CET' }
  ], []);

  return (
    <div className="min-h-screen">
      <PageHero
        title="Support"
        description="Notre équipe vous aide à déployer et opérer vos agents IA."
        gradient="from-blue-700 via-blue-600 to-indigo-600"
      />

      <section className="max-w-7xl mx-auto px-4 py-14 sm:py-20">
        <div className="grid md:grid-cols-2 gap-6">
          {supportChannels.map((channel) => {
            const Icon = channel.icon;
            return (
              <FeatureCard
                key={channel.title}
                icon={<Icon className={`w-6 h-6 ${channel.color.replace('600', '400')}`} />}
                title={channel.title}
                description={`${channel.contact} - ${channel.description}`}
              />
            );
          })}
        </div>

        <div className="mt-8 grid lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-dark-card/60 border-white/[0.04]">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
              <Clock className="w-5 h-5 text-blue-400" />
              Heures d'ouverture
            </h2>
            {hours.map((item, index) => (
              <div key={index} className="mb-3 last:mb-0">
                <h3 className="font-medium text-white">{item.service}</h3>
                <p className="text-sm text-slate-300">{item.schedule}</p>
              </div>
            ))}
          </Card>

          <Card className="p-6 bg-dark-card/60 border-white/[0.04]">
            <h2 className="text-xl font-semibold text-white mb-3">Assistance rapide</h2>
            <p className="text-sm text-slate-300 mb-4">
              Ouvrez un ticket, suivez vos demandes ou contactez directement notre équipe par email.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="bg-blue-600 hover:bg-blue-500 text-white">
                <Link href={`mailto:${SUPPORT_CONFIG.email}`}>
                  Écrire au support
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-white/10 text-slate-300 hover:bg-white/5">
                <Link href={hasLiveChatConfigured() ? SUPPORT_CONFIG.liveChatUrl : SUPPORT_CONFIG.contactPath}>
                  {hasLiveChatConfigured() ? 'Ouvrir le chat' : 'Ouvrir un ticket'}
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

const SupportPageMemo = memo(SupportPageContent);

export default function SupportPage() {
  return (
    <ErrorBoundary componentName="SupportPage">
      <SupportPageMemo />
    </ErrorBoundary>
  );
}
