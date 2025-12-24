'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function CookiesPolicyPageContent() {
  const lastUpdate = useMemo(() => new Date().toLocaleDateString('fr-FR'), []);
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Politique d'Utilisation des Cookies
          </h1>
          <p className="text-lg text-gray-400">
            Dernière mise à jour : {lastUpdate}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none prose-invert">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">1. Qu'est-ce qu'un Cookie ?</h2>
            <p className="text-gray-300 leading-relaxed">
              Les cookies sont de petits fichiers texte stockés sur votre appareil lorsque vous visitez notre site. 
              Ils nous permettent de mémoriser vos préférences et d'améliorer votre expérience.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">2. Types de Cookies Utilisés</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Cookies Essentiels</h3>
                <p className="text-gray-300">
                  Nécessaires au fonctionnement du site. Ils permettent la navigation, l'authentification et l'accès aux zones sécurisées.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Cookies de Performance</h3>
                <p className="text-gray-300">
                  Nous aident à comprendre comment les visiteurs utilisent notre site (pages visitées, temps passé, etc.).
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Cookies de Fonctionnalité</h3>
                <p className="text-gray-300">
                  Mémorisent vos préférences (langue, région, thème) pour améliorer votre expérience.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Cookies Publicitaires</h3>
                <p className="text-gray-300">
                  Utilisés pour vous proposer des publicités pertinentes selon vos centres d'intérêt.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">3. Gestion des Cookies</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Vous pouvez contrôler et gérer les cookies de plusieurs façons :
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Via les paramètres de votre navigateur</li>
              <li>Via notre bandeau de consentement</li>
              <li>En nous contactant à privacy@luneo.app</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">4. Cookies Tiers</h2>
            <p className="text-gray-300 leading-relaxed">
              Nous utilisons des services tiers (analytics, publicité) qui peuvent déposer leurs propres cookies. 
              Ces cookies sont soumis aux politiques de confidentialité de ces tiers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">5. Contact</h2>
            <p className="text-gray-300">
              Pour toute question concernant notre utilisation des cookies :{' '}
              <a href="mailto:privacy@luneo.app" className="text-blue-400 hover:text-blue-300 underline">
                privacy@luneo.app
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

const CookiesPolicyPageMemo = memo(CookiesPolicyPageContent);

export default function CookiesPolicyPage() {
  return (
    <ErrorBoundary componentName="CookiesPolicyPage">
      <CookiesPolicyPageMemo />
    </ErrorBoundary>
  );
}
