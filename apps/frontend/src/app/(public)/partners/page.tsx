'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Handshake, TrendingUp, Users, Award } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function PartnersPageContent() {
  const benefits = useMemo(() => [
    { icon: TrendingUp, title: 'Commissions 25%', desc: 'Sur toutes les ventes générées' },
    { icon: Users, title: 'Support dédié', desc: 'Account manager personnel' },
    { icon: Award, title: 'Ressources exclusives', desc: 'Formations, templates, outils' },
    { icon: Handshake, title: 'Co-marketing', desc: 'Visibilité sur nos canaux' },
  ], []);

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Handshake className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-6">Programme Partenaires</h1>
          <p className="text-2xl text-blue-100 mb-8">
            Rejoignez notre réseau de partenaires et bénéficiez de commissions attractives, support dédié, et ressources exclusives.
          </p>
          <Link href="/contact" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 inline-block">
            Devenir partenaire
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">Avantages Partenaires</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="bg-gray-50 rounded-xl p-6 text-center">
              <benefit.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-gray-600 text-sm">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const PartnersPageMemo = memo(PartnersPageContent);

export default function PartnersPage() {
  return (
    <ErrorBoundary componentName="PartnersPage">
      <PartnersPageMemo />
    </ErrorBoundary>
  );
}
