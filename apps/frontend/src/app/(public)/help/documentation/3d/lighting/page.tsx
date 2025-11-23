'use client';

import React from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function ThreeDLightingPage() {
  const [copied, setCopied] = React.useState('');
  const copyCode = (code: string, id: string) => { navigator.clipboard.writeText(code); setCopied(id); setTimeout(() => setCopied(''), 2000); };

  const lightExample = `// Lighting Configuration
const config = {
  lights: {
    ambient: {
      color: '#ffffff',
      intensity: 0.5
    },
    directional: {
      color: '#ffffff',
      intensity: 1.0,
      position: [5, 5, 5]
    },
    environment: '/hdri/studio.hdr'
  },
  shadows: true
};`;

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">3D Lighting</h1>
          <p className="text-xl text-gray-400">Éclairage réaliste avec IBL</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Configuration</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">{lightExample}</pre>
            <button onClick={() => copyCode(lightExample, 'light')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
              {copied === 'light' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Types d'Éclairage</h2>
          <div className="space-y-2 text-gray-300">
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-yellow-400" /> Ambient Light</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-yellow-400" /> Directional Light</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-yellow-400" /> Point Light</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-yellow-400" /> Environment HDRI</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

