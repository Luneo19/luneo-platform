import React from 'react';
import Link from 'next/link';
import { Zap, Check } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function QuickstartPageContent() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300">
            ← Documentation
          </Link>
          <div className="flex items-center gap-3 mt-4 mb-2">
            <Zap className="w-10 h-10 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white">Quickstart Guide</h1>
          </div>
          <p className="text-xl text-gray-300">Créez votre premier design en 5 minutes</p>
        </div>

        <div className="prose prose-lg max-w-none prose-invert">
          <div className="bg-blue-900/30 border-l-4 border-blue-500 p-6 mb-8 rounded-lg">
            <p className="font-semibold text-blue-300 mb-2">⚡ Quick Setup</p>
            <p className="text-blue-200">Ce guide vous permettra de créer votre premier design en moins de 5 minutes.</p>
          </div>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-white">Étape 1 : Créer un compte</h2>
            <div className="bg-gray-800/50 border border-gray-700 text-gray-300 p-4 rounded-lg mb-4">
              <pre className="text-sm">{`# Via l'interface web
https://luneo.app/register

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
            <h2 className="text-3xl font-bold mb-6 text-white">Étape 2 : Obtenir votre API Key</h2>
            <ol className="list-decimal pl-6 space-y-3 text-gray-300">
              <li>Allez dans <strong className="text-white">Settings → API Keys</strong></li>
              <li>Cliquez sur <strong className="text-white">Generate New Key</strong></li>
              <li>Copiez votre clé (elle ne sera affichée qu'une fois)</li>
              <li>Stockez-la en sécurité (variables d'environnement recommandées)</li>
            </ol>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-white">Étape 3 : Créer votre premier design</h2>
            <div className="bg-gray-800/50 border border-gray-700 text-gray-300 p-4 rounded-lg mb-4">
              <pre className="text-sm">{`fetch('https://api.luneo.app/v1/designs', {
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
.then(data => console.info('Design created:', data.id));`}</pre>
            </div>
            <div className="flex items-start gap-3 bg-green-900/30 border-l-4 border-green-500 p-4 rounded-lg">
              <Check className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-green-300">Succès !</p>
                <p className="text-green-200">Votre design est créé. Vous pouvez maintenant l'exporter, le modifier, ou l'utiliser dans vos apps.</p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-white">Prochaines Étapes</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/help/documentation/api-reference" className="bg-gray-800/50 border-2 border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-colors">
                <h3 className="font-bold text-lg mb-2 text-white">📖 API Reference</h3>
                <p className="text-gray-300 text-sm">Documentation complète de l'API</p>
              </Link>
              <Link href="/help/documentation/sdks/react" className="bg-gray-800/50 border-2 border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-colors">
                <h3 className="font-bold text-lg mb-2 text-white">⚛️ React SDK</h3>
                <p className="text-gray-300 text-sm">Intégration React en 5 minutes</p>
              </Link>
              <Link href="/help/documentation" className="bg-gray-800/50 border-2 border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-colors">
                <h3 className="font-bold text-lg mb-2 text-white">💡 Exemples</h3>
                <p className="text-gray-300 text-sm">Code examples et use cases</p>
              </Link>
              <Link href="/help/support" className="bg-gray-800/50 border-2 border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-colors">
                <h3 className="font-bold text-lg mb-2 text-white">💬 Support</h3>
                <p className="text-gray-300 text-sm">Besoin d'aide ? Contactez-nous</p>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function QuickstartPage() {
  return (
    <ErrorBoundary componentName="QuickstartPage">
      <QuickstartPageContent />
    </ErrorBoundary>
  );
}



