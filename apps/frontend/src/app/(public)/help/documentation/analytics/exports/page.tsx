import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';

export default function AnalyticsExportsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/help/documentation" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          ← Documentation
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Download className="w-8 h-8 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Exports Analytics
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Exportez vos données analytics aux formats CSV, JSON, Excel
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Formats disponibles</h2>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
            <li>CSV (Excel compatible)</li>
            <li>JSON</li>
            <li>XLSX (Excel)</li>
            <li>PDF (rapports)</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Export via API</h2>
          
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`const exportData = await fetch('/api/analytics/export', {
  method: 'POST',
  headers: { 
    'Authorization': \`Bearer \${apiKey}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    format: 'csv',
    startDate: '2025-01-01',
    endDate: '2025-11-06',
    metrics: ['views', 'conversions', 'revenue']
  })
});

const blob = await exportData.blob();
// Download file...`}
            </pre>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Exports programmés</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Configurez des exports automatiques (quotidiens, hebdomadaires, mensuels) envoyés par email ou webhook.
          </p>
        </div>
      </div>
    </div>
  );
}

