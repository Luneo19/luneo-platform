import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Politique des cookies - Luneo Tech',
  description:
    'Politique d\'utilisation des cookies Luneo Tech. Types de cookies, gestion et consentement.',
  openGraph: {
    title: 'Politique des cookies - Luneo Tech',
    description: 'Comment Luneo Tech utilise les cookies.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Politique des cookies - Luneo Tech',
    description: 'Politique des cookies Luneo Tech.',
  },
};

const LAST_UPDATE = '1er février 2026';

function CookiesPolicyPageContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      <div className="dark-section relative noise-overlay py-12">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="relative z-10 max-w-4xl mx-auto px-4">
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
            Dernière mise à jour : {LAST_UPDATE}
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
            <h2 className="text-2xl font-bold text-white mb-4">3. Consentement</h2>
            <p className="text-gray-300 leading-relaxed">
              Les cookies essentiels sont nécessaires au fonctionnement du site et ne peuvent pas être désactivés. Les cookies de performance et d'analyse ne sont déposés qu'après votre consentement explicite via notre bannière de cookies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">4. Liste des Cookies</h2>
            <div className="overflow-x-auto rounded-lg border border-gray-700">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-800/50">
                    <th className="px-4 py-3 font-semibold text-white">Nom</th>
                    <th className="px-4 py-3 font-semibold text-white">Finalité</th>
                    <th className="px-4 py-3 font-semibold text-white">Durée</th>
                    <th className="px-4 py-3 font-semibold text-white">Fournisseur</th>
                    <th className="px-4 py-3 font-semibold text-white">Catégorie</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-gray-700/50">
                    <td className="px-4 py-3">csrf_token</td>
                    <td className="px-4 py-3">Sécurité CSRF</td>
                    <td className="px-4 py-3">Session</td>
                    <td className="px-4 py-3">Luneo</td>
                    <td className="px-4 py-3">Essentiel</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="px-4 py-3">luneo_locale</td>
                    <td className="px-4 py-3">Préférence langue</td>
                    <td className="px-4 py-3">1 an</td>
                    <td className="px-4 py-3">Luneo</td>
                    <td className="px-4 py-3">Fonctionnel</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="px-4 py-3">onboarding_completed</td>
                    <td className="px-4 py-3">Statut onboarding</td>
                    <td className="px-4 py-3">1 an</td>
                    <td className="px-4 py-3">Luneo</td>
                    <td className="px-4 py-3">Fonctionnel</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="px-4 py-3">access_token</td>
                    <td className="px-4 py-3">Authentification</td>
                    <td className="px-4 py-3">15 min</td>
                    <td className="px-4 py-3">Luneo</td>
                    <td className="px-4 py-3">Essentiel</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="px-4 py-3">refresh_token</td>
                    <td className="px-4 py-3">Renouvellement session</td>
                    <td className="px-4 py-3">7 jours</td>
                    <td className="px-4 py-3">Luneo</td>
                    <td className="px-4 py-3">Essentiel</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="px-4 py-3">_vercel_analytics</td>
                    <td className="px-4 py-3">Mesure performance</td>
                    <td className="px-4 py-3">Session</td>
                    <td className="px-4 py-3">Vercel</td>
                    <td className="px-4 py-3">Performance</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="px-4 py-3">_ga, _gid</td>
                    <td className="px-4 py-3">Google Analytics</td>
                    <td className="px-4 py-3">2 ans / 24h</td>
                    <td className="px-4 py-3">Google</td>
                    <td className="px-4 py-3">Analyse</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="px-4 py-3">stripe_mid</td>
                    <td className="px-4 py-3">Paiement sécurisé</td>
                    <td className="px-4 py-3">1 an</td>
                    <td className="px-4 py-3">Stripe</td>
                    <td className="px-4 py-3">Essentiel</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">5. Gestion des Cookies</h2>
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
            <h2 className="text-2xl font-bold text-white mb-4">6. Cookies Tiers</h2>
            <p className="text-gray-300 leading-relaxed">
              Nous utilisons des services tiers (analytics, publicité) qui peuvent déposer leurs propres cookies. 
              Ces cookies sont soumis aux politiques de confidentialité de ces tiers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">7. Contact et Responsable</h2>
            <p className="text-gray-300 mb-4">
              Responsable du traitement : Luneo Tech Sarl, Rue du Seyon 10, 2000 Neuchâtel, Suisse.
            </p>
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
    </div>
  );
}

export default function CookiesPolicyPage() {
  return <CookiesPolicyPageContent />;
}
