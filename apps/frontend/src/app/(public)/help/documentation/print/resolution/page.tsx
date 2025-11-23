import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';

export default function PrintResolutionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/help/documentation" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          ← Documentation
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Printer className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Résolution Print
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Exportez vos designs en haute résolution pour l'impression
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Résolutions recommandées</h2>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
            <li><strong>300 DPI</strong> - Print professionnel (haute qualité)</li>
            <li><strong>150 DPI</strong> - Print standard</li>
            <li><strong>72 DPI</strong> - Écran uniquement</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Export haute résolution</h2>
          
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`const highResExport = await luneo.designs.export({
  designId: 'design_123',
  format: 'png',
  dpi: 300,
  width: 5000,
  height: 5000
});`}
            </pre>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Tailles print courantes</h2>
          <ul className="space-y-2 text-gray-600 dark:text-gray-300">
            <li>T-Shirt : 3600x3600px @ 300 DPI</li>
            <li>Poster A4 : 3508x2480px @ 300 DPI</li>
            <li>Mug : 2700x1200px @ 300 DPI</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

