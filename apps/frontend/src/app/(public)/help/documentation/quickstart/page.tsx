'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Zap, Check } from 'lucide-react';
import { logger } from '../../../../../lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function QuickstartPageContent() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/help/documentation" className="text-blue-600 hover:text-blue-700">
          ← Documentation
        </Link>
        <div className="flex items-center gap-3 mt-4 mb-2">
          <Zap className="w-10 h-10 text-yellow-500" />
          <h1 className="text-4xl font-bold">Quickstart Guide</h1>
        </div>
        <p className="text-xl text-gray-600">Créez votre premier design en 5 minutes</p>
      </div>

      <div className="prose prose-lg max-w-none">
        <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-8">
          <p className="font-semibold text-blue-900 mb-2">⚡ Quick Setup</p>
          <p className="text-blue-800">Ce guide vous permettra de créer votre premier design en moins de 5 minutes.</p>
        </div>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Étape 1 : Créer un compte</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4">
            <pre>{`# Via l'interface web
https://app.luneo.app/register

# Ou via API
curl -X POST https://api.luneo.app/v1/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "you@company.com",
    "password": "your-password",
    "name": "Your Name"
  }'`}</pre>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Étape 2 : Obtenir votre API Key</h2>
          <ol className="list-decimal pl-6 space-y-3">
            <li>Allez dans <strong>Settings → API Keys</strong></li>
            <li>Cliquez sur <strong>Generate New Key</strong></li>
            <li>Copiez votre clé (elle ne sera affichée qu'une fois)</li>
            <li>Stockez-la en sécurité (variables d'environnement recommandées)</li>
          </ol>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Étape 3 : Créer votre premier design</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4">
            <pre>{`fetch('https://api.luneo.app/v1/designs', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My First Design',
    template: 't-shirt',
    customizations: {
      color: '#FF0000',
      text: 'Hello Luneo!',
      font: 'Arial'
    }
  })
})
.then(res => res.json())
.then(data => logger.info('Design created:', data.id));`}</pre>
          </div>
          <div className="flex items-start gap-3 bg-green-50 border-l-4 border-green-600 p-4">
            <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-green-900">Succès !</p>
              <p className="text-green-800">Votre design est créé. Vous pouvez maintenant l'exporter, le modifier, ou l'utiliser dans vos apps.</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Prochaines Étapes</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/help/documentation/api-reference" className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors">
              <h3 className="font-bold text-lg mb-2">📖 API Reference</h3>
              <p className="text-gray-600 text-sm">Documentation complète de l'API</p>
            </Link>
            <Link href="/help/documentation/sdk/react" className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors">
              <h3 className="font-bold text-lg mb-2">⚛️ React SDK</h3>
              <p className="text-gray-600 text-sm">Intégration React en 5 minutes</p>
            </Link>
            <Link href="/help/documentation/examples" className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors">
              <h3 className="font-bold text-lg mb-2">💡 Exemples</h3>
              <p className="text-gray-600 text-sm">Code examples et use cases</p>
            </Link>
            <Link href="/help/support" className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors">
              <h3 className="font-bold text-lg mb-2">💬 Support</h3>
              <p className="text-gray-600 text-sm">Besoin d'aide ? Contactez-nous</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

const QuickstartPageMemo = memo(QuickstartPageContent);

export default function QuickstartPage() {
  return (
    <ErrorBoundary componentName="QuickstartPage">
      <QuickstartPageMemo />
    </ErrorBoundary>
  );
}



