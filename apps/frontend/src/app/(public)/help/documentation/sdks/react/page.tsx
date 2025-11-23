'use client';

import React from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function ReactSDKPage() {
  const [copied, setCopied] = React.useState('');

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const installExample = `npm install @luneo/react`;

  const customizerExample = `import { ProductCustomizer } from '@luneo/react';

export default function CustomizePage() {
  return (
    <ProductCustomizer
      productId="prod_xxx"
      productImage="/tshirt.png"
      productName="T-Shirt"
      onSave={(design) => console.log('Saved:', design)}
    />
  );
}`;

  const config3dExample = `import { ProductConfigurator3D } from '@luneo/react';

export default function Configure3DPage() {
  return (
    <ProductConfigurator3D
      productId="prod_xxx"
      modelUrl="/models/chair.glb"
      onExportAR={(url) => console.log('AR:', url)}
    />
  );
}`;

  const tryonExample = `import { VirtualTryOnComponent } from '@luneo/react';

export default function TryOnPage() {
  return (
    <VirtualTryOnComponent
      category="glasses"
      modelUrl="/models/sunglasses.glb"
      onCapture={(screenshot) => console.log('Screenshot:', screenshot)}
    />
  );
}`;

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-4">
            ← Documentation
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">React SDK</h1>
          <p className="text-xl text-gray-400">Composants React prêts à l'emploi</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Installation</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 font-mono">
              {installExample}
            </pre>
            <button onClick={() => copyCode(installExample, 'install')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
              {copied === 'install' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">ProductCustomizer</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {customizerExample}
            </pre>
            <button onClick={() => copyCode(customizerExample, 'customizer')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
              {copied === 'customizer' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">ProductConfigurator3D</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {config3dExample}
            </pre>
            <button onClick={() => copyCode(config3dExample, '3d')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
              {copied === '3d' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">VirtualTryOn</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {tryonExample}
            </pre>
            <button onClick={() => copyCode(tryonExample, 'tryon')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
              {copied === 'tryon' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
