import Link from 'next/link';
import { ArrowLeft, Palette } from 'lucide-react';

export default function ColorManagementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/help/documentation" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          ← Documentation
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-8 h-8 text-pink-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Gestion des Couleurs
            </h1>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Espaces colorimétriques</h2>
          <ul className="space-y-3 text-gray-600 dark:text-gray-300">
            <li><strong>RGB</strong> - Écran (sRGB, Display P3)</li>
            <li><strong>CMYK</strong> - Impression offset</li>
            <li><strong>Pantone</strong> - Couleurs spot</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Profils ICC</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Luneo supporte les profils ICC pour une conversion couleur précise :
          </p>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
            <li>sRGB IEC61966-2.1</li>
            <li>Adobe RGB (1998)</li>
            <li>FOGRA39 (ISO Coated v2)</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Conseils</h2>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
            <li>Utilisez RGB pour écran, CMYK pour print</li>
            <li>Évitez les couleurs très saturées (impossible en CMYK)</li>
            <li>Ajoutez 3mm de fond perdu (bleed)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

