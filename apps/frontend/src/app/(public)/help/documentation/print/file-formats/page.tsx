import Link from 'next/link';
import { ArrowLeft, FileType } from 'lucide-react';

export default function PrintFileFormatsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/help/documentation" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          ← Documentation
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FileType className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Formats de Fichiers Print
            </h1>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">PNG</h3>
            <p className="text-gray-600 dark:text-gray-300">Idéal pour les designs avec transparence. Qualité lossless.</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">PDF</h3>
            <p className="text-gray-600 dark:text-gray-300">Format vectoriel recommandé pour l'impression professionnelle.</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">SVG</h3>
            <p className="text-gray-600 dark:text-gray-300">Vectoriel, redimensionnable sans perte. Parfait pour les logos.</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">TIFF</h3>
            <p className="text-gray-600 dark:text-gray-300">Format professionnel pour offset printing et grand format.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

