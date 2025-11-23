import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ApiLimitsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/help/documentation" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          ← Documentation
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Limites et Quotas API
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Comprendre les limites de taux et quotas de l'API Luneo
          </p>
        </div>

        {/* Rate Limits by Plan */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Limites par Plan
          </h2>
          
          <div className="space-y-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Starter (Gratuit)</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• 100 requêtes/heure</li>
                <li>• 1 000 requêtes/jour</li>
                <li>• 10 designs/mois</li>
                <li>• 5 commandes/mois</li>
              </ul>
            </div>

            <div className="border border-purple-200 dark:border-purple-700 rounded-lg p-6 bg-purple-50/50 dark:bg-purple-900/20">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Professional</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• 1 000 requêtes/heure</li>
                <li>• 10 000 requêtes/jour</li>
                <li>• 1 000 designs/mois</li>
                <li>• Illimité commandes</li>
              </ul>
            </div>

            <div className="border border-blue-200 dark:border-blue-700 rounded-lg p-6 bg-blue-50/50 dark:bg-blue-900/20">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Business</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• 5 000 requêtes/heure</li>
                <li>• 50 000 requêtes/jour</li>
                <li>• 10 000 designs/mois</li>
                <li>• Illimité commandes</li>
              </ul>
            </div>

            <div className="border border-gold-200 dark:border-gold-700 rounded-lg p-6 bg-gold-50/50 dark:bg-gold-900/20">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Enterprise</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• Limites personnalisées</li>
                <li>• SLA garanti 99.99%</li>
                <li>• Support prioritaire 24/7</li>
                <li>• Quota sur mesure</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Headers */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            En-têtes de Réponse
          </h2>
          
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1699564800`}
            </pre>
          </div>
        </div>

        {/* Error Codes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Codes d'Erreur
          </h2>
          
          <ul className="space-y-3 text-gray-600 dark:text-gray-300">
            <li><strong>429 Too Many Requests</strong> - Limite de taux dépassée</li>
            <li><strong>402 Payment Required</strong> - Quota mensuel atteint</li>
            <li><strong>403 Forbidden</strong> - Plan insuffisant</li>
          </ul>
        </div>

        <div className="mt-8">
          <Link href="/pricing" className="text-purple-600 hover:text-purple-700">
            Voir les plans et tarifs →
          </Link>
        </div>
      </div>
    </div>
  );
}

