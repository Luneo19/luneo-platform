'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-blue-400 hover:text-blue-300 flex items-center gap-2 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Conditions d'Utilisation</h1>
          <p className="text-gray-400">Dernière mise à jour: 3 Novembre 2025</p>
        </div>

        <Card className="p-8 bg-gray-800/50 border-gray-700">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptation des Conditions</h2>
            <p className="text-gray-300 mb-6">
              En utilisant Luneo, vous acceptez ces conditions d'utilisation.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">2. Licence d'Utilisation</h2>
            <p className="text-gray-300 mb-6">
              Nous vous accordons une licence non-exclusive et révocable pour utiliser notre plateforme.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">3. Propriété Intellectuelle</h2>
            <p className="text-gray-300 mb-6">
              Vous conservez tous les droits sur vos designs. Luneo conserve les droits sur la plateforme.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">4. Responsabilités</h2>
            <p className="text-gray-300 mb-6">
              Vous êtes responsable du contenu que vous créez et partagez sur la plateforme.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">5. Contact</h2>
            <p className="text-gray-300">
              Questions légales: <a href="mailto:legal@luneo.app" className="text-blue-400 hover:text-blue-300">legal@luneo.app</a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
