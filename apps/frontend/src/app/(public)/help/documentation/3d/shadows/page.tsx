import Link from 'next/link';
import { ArrowLeft, Sun } from 'lucide-react';

export default function Shadows3DPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/help/documentation" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          ← Documentation
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Sun className="w-8 h-8 text-yellow-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Ombres 3D
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Gérez l'éclairage et les ombres de vos scènes 3D
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Shadow Mapping</h2>
          
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`const light = new THREE.DirectionalLight(0xffffff, 1);
light.castShadow = true;
light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 500;`}
            </pre>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Types d'ombres</h2>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
            <li>PCF (Percentage Closer Filtering)</li>
            <li>PCF Soft Shadows</li>
            <li>VSM (Variance Shadow Maps)</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Optimisation</h2>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
            <li>Utilisez des shadow maps 1024x1024 pour mobile</li>
            <li>Limitez le nombre de lumières avec ombres</li>
            <li>Utilisez des baked shadows quand possible</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

