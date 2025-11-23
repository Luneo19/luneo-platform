import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function SecurityCorsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/help/documentation" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          ← Documentation
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              CORS (Cross-Origin Resource Sharing)
            </h1>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Configuration CORS</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Configurez les domaines autorisés à accéder à l'API Luneo depuis votre dashboard :
          </p>
          <div className="bg-gray-900 rounded-lg p-4">
            <code className="text-green-400 text-sm">
              Dashboard → Settings → API → CORS Origins
            </code>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Domaines autorisés</h2>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
            <li>https://app.example.com</li>
            <li>https://example.com</li>
            <li>https://app.luneo.app (production) ou http://localhost:3000 (développement local uniquement)</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Sécurité</h2>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
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

