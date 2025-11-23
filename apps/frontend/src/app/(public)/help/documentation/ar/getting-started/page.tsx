import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ArGettingStartedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/help/documentation" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          ← Documentation
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AR - Getting Started
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Premier export AR en 10 minutes
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Installation</h2>
          
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4">
            <pre className="text-sm text-green-400">
{`npm install @luneo/ar-export`}
            </pre>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Export USDZ (iOS)</h2>
          
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`import { exportToUSDZ } from '@luneo/ar-export';

const usdzFile = await exportToUSDZ({
  modelUrl: '/models/product.glb',
  scale: 1.0,
  optimization: 'medium'
});`}
            </pre>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Export GLB (Android)</h2>
          
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`import { exportToGLB } from '@luneo/ar-export';

const glbFile = await exportToGLB({
  modelUrl: '/models/product.glb',
  compression: true,
  draco: true
});`}
            </pre>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">WebXR</h2>
          
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`<model-viewer
  src="/models/product.glb"
  ar
  ar-modes="webxr scene-viewer quick-look"
  camera-controls
  auto-rotate
></model-viewer>`}
            </pre>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/demo/ar-export" className="text-purple-600 hover:text-purple-700">
            Voir la démo AR Export →
          </Link>
        </div>
      </div>
    </div>
  );
}

