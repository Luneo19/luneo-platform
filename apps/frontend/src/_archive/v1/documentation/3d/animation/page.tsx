'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function Animation3DPageContent() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/help/documentation" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8">
          <ArrowLeft className="w-4 h-4" />
          ← Documentation
        </Link>

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 mb-6 border border-gray-700">
          <h1 className="text-4xl font-bold text-white mb-4">
            Animations 3D
          </h1>
          <p className="text-gray-300 text-lg">
            Ajoutez des animations fluides à vos modèles 3D
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 mb-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Animation de base</h2>
          
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`import { useGLTF, useAnimations } from '@react-three/drei';

function AnimatedModel() {
  const { scene, animations } = useGLTF('/model.glb');
  const { actions } = useAnimations(animations, scene);
  
  useEffect(() => {
    actions['Idle']?.play();
  }, [actions]);
  
  return <primitive object={scene} />;
}`}
            </pre>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 mb-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Contrôle d'animations</h2>
          
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`// Play animation
actions['Walk']?.play();

// Pause
actions['Walk']?.pause();

// Stop and reset
actions['Walk']?.stop();

// Crossfade between animations
actions['Idle']?.fadeOut(0.5);
actions['Walk']?.reset().fadeIn(0.5).play();`}
            </pre>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Formats supportés</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>GLTF / GLB (recommandé)</li>
            <li>FBX</li>
            <li>BVH</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const Animation3DPageMemo = memo(Animation3DPageContent);

export default function Animation3DPage() {
  return (
    <ErrorBoundary componentName="Animation3DPage">
      <Animation3DPageMemo />
    </ErrorBoundary>
  );
}
