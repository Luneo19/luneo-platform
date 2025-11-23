'use client';

import React from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function ThreeDMaterialsPage() {
  const [copied, setCopied] = React.useState('');
  const copyCode = (code: string, id: string) => { navigator.clipboard.writeText(code); setCopied(id); setTimeout(() => setCopied(''), 2000); };

  const materialExample = `// PBR Materials
const materials = {
  wood: {
    diffuse: '/textures/wood_diffuse.jpg',
    normal: '/textures/wood_normal.jpg',
    roughness: 0.8,
    metalness: 0.0
  },
  metal: {
    diffuse: '/textures/metal_diffuse.jpg',
    roughness: 0.2,
    metalness: 1.0
  }
};

configurator.setMaterial('wood');`;

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">3D Materials</h1>
          <p className="text-xl text-gray-400">Matériaux PBR réalistes</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Configuration Matériaux</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">{materialExample}</pre>
            <button onClick={() => copyCode(materialExample, 'mat')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
              {copied === 'mat' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Presets Disponibles</h2>
          <div className="space-y-2 text-gray-300">
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-orange-400" /> Wood (Bois naturel)</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-gray-400" /> Metal (Métal brossé)</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-blue-400" /> Fabric (Tissu)</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-purple-400" /> Plastic (Plastique)</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-cyan-400" /> Glass (Verre)</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
