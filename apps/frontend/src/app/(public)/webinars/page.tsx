'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { Calendar, Clock, Video } from 'lucide-react';

function WebinarsPageContent() {
  const webinars = [
    {
      title: 'Démarrer avec Luneo en 30 minutes',
      date: '15 Nov 2025',
      time: '14:00 CET',
      duration: '30 min',
      status: 'upcoming',
    },
    {
      title: 'AI Studio : Générer 1000 designs/jour',
      date: '20 Nov 2025',
      time: '15:00 CET',
      duration: '45 min',
      status: 'upcoming',
    },
    {
      title: 'Virtual Try-On : Guide Complet',
      date: '1 Nov 2025',
      time: '14:00 CET',
      duration: '60 min',
      status: 'replay',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 py-20">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-5xl font-bold text-center text-white mb-4">
          Webinars
        </h1>
        <p className="text-center text-xl text-gray-300 mb-16">
          Formations gratuites en direct avec nos experts
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {webinars.map((webinar, idx) => (
            <div key={idx} className="bg-gray-800/50 rounded-xl shadow-lg p-8 border border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <Video className="w-10 h-10 text-purple-400" />
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  webinar.status === 'upcoming' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-gray-700 text-gray-300 border border-gray-600'
                }`}>
                  {webinar.status === 'upcoming' ? 'À venir' : 'Replay'}
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-4">
                {webinar.title}
              </h3>

              <div className="space-y-2 text-gray-300 mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{webinar.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{webinar.time} • {webinar.duration}</span>
                </div>
              </div>

              <Link 
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all"
              >
                {webinar.status === 'upcoming' ? 'S\'inscrire gratuitement' : 'Voir le replay'}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const WebinarsPageMemo = memo(WebinarsPageContent);

export default function WebinarsPage() {
  return (
    <ErrorBoundary componentName="WebinarsPage">
      <WebinarsPageMemo />
    </ErrorBoundary>
  );
}
