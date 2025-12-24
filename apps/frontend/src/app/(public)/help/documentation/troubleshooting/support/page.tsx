'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { MessageSquare, Mail, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function SupportPageContent() {
  const supportChannels = useMemo(() => [
    {
      icon: <Mail className="w-12 h-12 text-blue-400 mx-auto mb-4" />,
      title: 'Email',
      contact: 'support@luneo.app',
      description: 'Réponse sous 24h',
      color: 'text-blue-400'
    },
    {
      icon: <MessageCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />,
      title: 'Chat',
      contact: 'Live chat',
      description: '9h-18h CET',
      color: 'text-green-400'
    },
    {
      icon: <MessageSquare className="w-12 h-12 text-purple-400 mx-auto mb-4" />,
      title: 'Community',
      contact: 'Discord',
      description: 'Communauté active',
      color: 'text-purple-400',
      link: 'https://discord.gg/luneo'
    },
  ], []);

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">Support</h1>
          <p className="text-xl text-gray-400">Obtenez de l'aide</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {supportChannels.map((channel, index) => (
            <Card key={index} className="p-6 bg-gray-800/50 border-gray-700 text-center">
              {channel.icon}
              <h3 className="text-lg font-bold text-white mb-2">{channel.title}</h3>
              <p className="text-sm text-gray-400 mb-4">{channel.contact}</p>
              <p className="text-xs text-gray-500 mb-4">{channel.description}</p>
              {channel.link && (
                <Link href={channel.link}>
                  <Button size="sm" variant="outline" className="border-gray-600 text-white">
                    Rejoindre
                  </Button>
                </Link>
              )}
            </Card>
          ))}
        </div>
      </div>
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
