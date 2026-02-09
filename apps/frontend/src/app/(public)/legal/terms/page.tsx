import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Conditions d\'utilisation - Luneo',
  description:
    'Conditions d\'utilisation de la plateforme Luneo. Licence, propriété intellectuelle et responsabilités.',
  openGraph: {
    title: 'Conditions d\'utilisation - Luneo',
    description: 'Conditions d\'utilisation de la plateforme Luneo.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conditions d\'utilisation - Luneo',
    description: 'Conditions d\'utilisation de la plateforme Luneo.',
  },
};

function TermsPageContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      <div className="dark-section relative noise-overlay py-12">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <Link href="/" className="text-blue-400 hover:text-blue-300 flex items-center gap-2 mb-8">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Conditions d'Utilisation</h1>
            <p className="text-slate-400">Dernière mise à jour: 3 Novembre 2025</p>
          </div>

          <Card className="p-8 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04]">
            <div className="prose prose-invert max-w-none">
              <h2 className="text-2xl font-bold text-white mb-4">1. Acceptation des Conditions</h2>
              <p className="text-slate-300 mb-6">
                En utilisant Luneo, vous acceptez ces conditions d'utilisation.
              </p>

              <h2 className="text-2xl font-bold text-white mb-4">2. Licence d'Utilisation</h2>
              <p className="text-slate-300 mb-6">
                Nous vous accordons une licence non-exclusive et révocable pour utiliser notre plateforme.
              </p>

              <h2 className="text-2xl font-bold text-white mb-4">3. Propriété Intellectuelle</h2>
              <p className="text-slate-300 mb-6">
                Vous conservez tous les droits sur vos designs. Luneo conserve les droits sur la plateforme.
              </p>

              <h2 className="text-2xl font-bold text-white mb-4">4. Responsabilités</h2>
              <p className="text-slate-300 mb-6">
                Vous êtes responsable du contenu que vous créez et partagez sur la plateforme.
              </p>

              <h2 className="text-2xl font-bold text-white mb-4">5. Contact</h2>
              <p className="text-slate-300">
                Questions légales: <a href="mailto:legal@luneo.app" className="text-blue-400 hover:text-blue-300">legal@luneo.app</a>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function TermsPage() {
  return <TermsPageContent />;
}
