import Link from 'next/link';
import { CheckCircle2, TrendingUp } from 'lucide-react';

export default function ApiStatusPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              API Status
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Tous les systèmes opérationnels
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Performance API
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Latence moyenne</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">45ms</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Uptime (30j)</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">99.99%</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Requêtes/jour</div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">2.5M</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Endpoints
          </h2>
          
          <div className="space-y-3">
            {['GET /api/designs', 'POST /api/designs', 'GET /api/orders', 'POST /api/ai/generate'].map((endpoint) => (
              <div key={endpoint} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <code className="font-mono text-sm">{endpoint}</code>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Opérationnel
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/help/documentation/api-reference" className="text-purple-600 hover:text-purple-700 font-medium">
            Voir la documentation API →
          </Link>
        </div>
      </div>
    </div>
  );
}

