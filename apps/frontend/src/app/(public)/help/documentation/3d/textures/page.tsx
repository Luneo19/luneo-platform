'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function Textures3DPageContent() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/help/documentation" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8">
          <ArrowLeft className="w-4 h-4" />
          ← Documentation
        </Link>

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 mb-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <ImageIcon className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">
              Textures 3D
            </h1>
          </div>
          <p className="text-gray-300 text-lg">
            Gérez les textures PBR de vos modèles 3D
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 mb-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Textures PBR</h2>
          
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

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 mb-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Compression</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>KTX2 / Basis Universal (recommandé)</li>
            <li>WebP pour albedo</li>
            <li>JPG pour normales</li>
            <li>Résolution max: 2K pour web, 4K pour desktop</li>
          </ul>
        </div>

        <div className="bg-gray-800/50 rounded-xl shadow-lg p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Upload de textures</h2>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`const formData = new FormData();
formData.append('texture', file);
formData.append('type', 'albedo');

const response = await fetch('/api/3d/textures', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer TOKEN' },
  body: formData
});`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

const Textures3DPageMemo = memo(Textures3DPageContent);

export default function Textures3DPage() {
  return (
    <ErrorBoundary componentName="Textures3DPage">
      <Textures3DPageMemo />
    </ErrorBoundary>
  );
}
