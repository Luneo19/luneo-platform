import Link from 'next/link';
import { ArrowLeft, BarChart3 } from 'lucide-react';

export default function AnalyticsMetricsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/help/documentation" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          ← Documentation
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Métriques Analytics
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Suivez les performances de vos designs et conversions
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Métriques disponibles</h2>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
            <li>Vues de designs</li>
            <li>Taux de personnalisation</li>
            <li>Taux de conversion</li>
            <li>Temps moyen de customisation</li>
            <li>Abandons de panier</li>
            <li>Revenus par design</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">API Analytics</h2>
          
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`const analytics = await fetch('/api/analytics/metrics', {
  method: 'GET',
  headers: { 'Authorization': \`Bearer \${apiKey}\` }
});

const data = await analytics.json();
console.log('Views:', data.views);
console.log('Conversion Rate:', data.conversionRate);`}
            </pre>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Webhooks</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Recevez des événements en temps réel :
          </p>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
            <li><code>design.viewed</code></li>
            <li><code>design.customized</code></li>
            <li><code>design.ordered</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

