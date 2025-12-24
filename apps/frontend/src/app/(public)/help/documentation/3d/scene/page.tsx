'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Box } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function Scene3DPageContent() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/help/documentation" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8">
          <ArrowLeft className="w-4 h-4" />
          ← Documentation
        </Link>

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 mb-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Box className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">
              Scène 3D
            </h1>
          </div>
          <p className="text-gray-300 text-lg">
            Configuration et gestion de scènes 3D complètes
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 mb-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Créer une scène</h2>
          
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`import { Scene, PerspectiveCamera, WebGLRenderer } from 'three';

const scene = new Scene();
scene.background = new THREE.Color(0xf0f0f0);

const camera = new PerspectiveCamera(
  75, 
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);`}
            </pre>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 mb-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Environnement</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Background color ou texture HDRI</li>
            <li>Fog pour la profondeur</li>
            <li>Post-processing (bloom, tone mapping)</li>
            <li>Environment maps pour les reflets</li>
          </ul>
        </div>

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Gestion des objets</h2>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`// Ajouter un objet
scene.add(mesh);

// Retirer un objet
scene.remove(mesh);

// Parcourir tous les objets
scene.traverse((object) => {
  if (object.isMesh) {
    // Traiter le mesh
  }
});`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

const Scene3DPageMemo = memo(Scene3DPageContent);

export default function Scene3DPage() {
  return (
    <ErrorBoundary componentName="Scene3DPage">
      <Scene3DPageMemo />
    </ErrorBoundary>
  );
}
