'use client';

import React, { memo, useMemo } from 'react';
import { Mail, MessageCircle, Phone, Clock } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function SupportPageContent() {
  const supportChannels = useMemo(() => [
    {
      icon: Mail,
      title: 'Email Support',
      contact: 'support@luneo.app',
      description: 'Réponse sous 24h',
      color: 'text-blue-600'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      contact: 'Chat en direct',
      description: 'Lun-Ven 9h-18h',
      color: 'text-green-600'
    },
    {
      icon: Phone,
      title: 'Téléphone',
      contact: '+33 1 XX XX XX XX',
      description: 'Enterprise uniquement',
      color: 'text-purple-600'
    }
  ], []);

  const hours = useMemo(() => [
    { service: 'Support Email', schedule: '24/7 - Réponse sous 24h' },
    { service: 'Live Chat & Téléphone', schedule: 'Lun-Ven 9h-18h CET' }
  ], []);

  return (
    <div className="min-h-screen bg-gray-900">
      <section className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Support</h1>
          <p className="text-xl text-green-100">Notre équipe est là pour vous aider</p>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {supportChannels.map((channel, index) => {
            const Icon = channel.icon;
            return (
              <div key={index} className="bg-gray-800/50 rounded-xl shadow-lg p-8 text-center border border-gray-700">
                <Icon className={`w-12 h-12 ${channel.color.replace('600', '400')} mx-auto mb-4`} />
                <h3 className="font-bold text-xl mb-2 text-white">{channel.title}</h3>
                <p className="text-gray-300 mb-4">{channel.contact}</p>
                <p className="text-sm text-gray-400">{channel.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 bg-gray-800/50 rounded-xl shadow-lg p-8 border border-gray-700">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
            <Clock className="w-8 h-8 text-blue-400" />
            Heures d'ouverture
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {hours.map((item, index) => (
              <div key={index}>
                <h3 className="font-semibold mb-2 text-white">{item.service}</h3>
                <p className="text-gray-300">{item.schedule}</p>
              </div>
            ))}
          </div>
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
