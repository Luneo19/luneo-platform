'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function SecurityCorsPageContent() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/help/documentation" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8">
          <ArrowLeft className="w-4 h-4" />
          ← Documentation
        </Link>

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 mb-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-green-400" />
            <h1 className="text-4xl font-bold text-white">
              CORS (Cross-Origin Resource Sharing)
            </h1>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 mb-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Configuration CORS</h2>
          <p className="text-gray-300 mb-4">
            Configurez les domaines autorisés à accéder à l'API Luneo depuis votre dashboard :
          </p>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <code className="text-green-400 text-sm">
              Dashboard → Settings → API → CORS Origins
            </code>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 mb-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Domaines autorisés</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>https://app.example.com</li>
            <li>https://example.com</li>
            <li>https://app.luneo.app (production) ou http://localhost:3000 (développement local uniquement)</li>
          </ul>
        </div>

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Sécurité</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>✅ Utilisez HTTPS en production</li>
            <li>✅ Limitez aux domaines nécessaires</li>
            <li>✅ Évitez les wildcards (*) en production</li>
            <li>✅ Tokens API requis même avec CORS</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

