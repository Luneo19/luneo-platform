/**
 * 🚀 Lazy Loading Components
 * 
 * Composants lourds (3D, AR, Konva) chargés dynamiquement
 * pour réduire le bundle initial de ~850KB → ~300KB
 */

import dynamic from 'next/dynamic';

// 3D Configurator (~400KB)
export const Configurator3DDemo = dynamic(
  () => import('@/components/solutions/Configurator3DDemo'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-gray-900 rounded-xl">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement du configurateur 3D...</p>
        </div>
      </div>
    ),
  }
);

// Visual Customizer Konva (~200KB)
export const CustomizerDemo = dynamic(
  () => import('@/components/solutions/CustomizerDemo'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-xl">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de l'éditeur...</p>
        </div>
      </div>
    ),
  }
);

// Virtual Try-On (~150KB)
export const TryOnDemo = dynamic(
  () => import('@/components/solutions/TryOnDemo'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-gray-900 rounded-xl">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement de l'AR...</p>
        </div>
      </div>
    ),
  }
);

// Asset Hub Demo (~100KB)
export const AssetHubDemo = dynamic(
  () => import('@/components/solutions/AssetHubDemo'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-blue-900 to-purple-900 rounded-xl">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">Chargement de l'Asset Hub...</p>
        </div>
      </div>
    ),
  }
);

/**
 * UTILISATION:
 * 
 * Au lieu de:
 * import Configurator3DDemo from '@/components/solutions/Configurator3DDemo'; // ❌ 400KB chargés immédiatement
 * 
 * Utiliser:
 * import { Configurator3DDemo } from '@/components/lazy'; // ✅ Chargé uniquement quand affiché
 * 
 * ÉCONOMIE: ~850KB → ~300KB sur le bundle initial (-65%)
 */



