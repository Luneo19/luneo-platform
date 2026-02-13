import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Politique de confidentialité - Luneo Tech',
  description:
    'Politique de confidentialité Luneo Tech. Collecte, utilisation et protection de vos données. Conformité RGPD.',
  openGraph: {
    title: 'Politique de confidentialité - Luneo Tech',
    description: 'Comment Luneo Tech collecte et protège vos données.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Politique de confidentialité - Luneo Tech',
    description: 'Politique de confidentialité Luneo Tech.',
  },
};

function PrivacyPageContent() {
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
            <h1 className="text-4xl font-bold text-white mb-4">Politique de Confidentialité</h1>
            <p className="text-slate-400">Dernière mise à jour: 3 Novembre 2025</p>
          </div>

          <Card className="p-8 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04]">
            <div className="prose prose-invert max-w-none">
              <h2 className="text-2xl font-bold text-white mb-4">1. Collecte des Données</h2>
              <p className="text-slate-300 mb-6">
                Luneo Tech collecte uniquement les données nécessaires au fonctionnement du service : email, nom, designs créés.
              </p>

              <h2 className="text-2xl font-bold text-white mb-4">2. Utilisation des Données</h2>
              <p className="text-slate-300 mb-6">
                Vos données sont utilisées pour fournir le service, améliorer nos fonctionnalités, et vous contacter concernant votre compte.
              </p>

              <h2 className="text-2xl font-bold text-white mb-4">3. Protection</h2>
              <p className="text-slate-300 mb-6">
                Nous utilisons le chiffrement AES-256, HTTPS partout, et sommes conformes RGPD.
              </p>

              <h2 className="text-2xl font-bold text-white mb-4">4. Vos Droits</h2>
              <p className="text-slate-300 mb-6">
                Vous pouvez accéder, modifier, ou supprimer vos données à tout moment via votre dashboard ou en nous contactant.
              </p>

              <h2 className="text-2xl font-bold text-white mb-4">5. Contact</h2>
              <p className="text-slate-300">
                Pour toute question: <a href="mailto:privacy@luneo.app" className="text-blue-400 hover:text-blue-300">privacy@luneo.app</a>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  return <PrivacyPageContent />;
}
