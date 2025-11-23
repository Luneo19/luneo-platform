import Link from 'next/link';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';

export default function Textures3DPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/help/documentation" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          ← Documentation
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <ImageIcon className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Textures 3D
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Gérez les textures PBR de vos modèles 3D
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Textures PBR</h2>
          
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`{
  baseColor: '/textures/albedo.jpg',
  metallic: '/textures/metallic.jpg',
  roughness: '/textures/roughness.jpg',
  normal: '/textures/normal.jpg',
  ao: '/textures/ao.jpg'
}`}
            </pre>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Compression</h2>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
            <li>KTX2 / Basis Universal (recommandé)</li>
            <li>WebP pour albedo</li>
            <li>JPG pour normales</li>
            <li>Résolution max: 2K pour web, 4K pour desktop</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Optimisation</h2>
          
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`import { optimizeTextures } from '@luneo/3d-tools';

await optimizeTextures({
  model: '/model.glb',
  maxSize: 2048,
  compression: 'ktx2',
  quality: 'high'
});`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

