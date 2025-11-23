'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Palette, CheckCircle, Copy } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function FirstCustomizerPage() {
  const [copied, setCopied] = React.useState('');

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const codeExample1 = `import { LuneoClient } from '@luneo/sdk';

const client = new LuneoClient({
  apiKey: process.env.NEXT_PUBLIC_LUNEO_API_KEY
});

// Créer un produit personnalisable
const product = await client.products.create({
  name: 'T-Shirt Personnalisé',
  baseImage: '/images/tshirt-blanc.png',
  customizable: true
});`;

  const codeExample2 = `import { ProductCustomizer } from '@luneo/react';

export default function CustomizePage() {
  return (
    <ProductCustomizer
      productId="prod_xxx"
      productImage="/images/tshirt.png"
      productName="T-Shirt"
      onSave={(design) => {
        console.log('Design saved:', design);
      }}
    />
  );
}`;

  const codeExample3 = `const config = {
  canvas: {
    width: 800,
    height: 1000,
    backgroundColor: '#ffffff'
  },
  tools: {
    text: true,
    images: true,
    cliparts: true,
    shapes: true
  },
  export: {
    formats: ['png', 'svg', 'pdf'],
    dpi: 300
  }
};`;

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-4">
            ← Documentation
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">Premier Customizer</h1>
          <p className="text-xl text-gray-400">Créez votre premier customizer en 5 minutes</p>
        </div>

        {/* Étape 1 */}
        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full text-white text-sm mr-3">1</span>
            Créer un Produit
          </h2>
          
          <p className="text-gray-300 mb-4">Créez d'abord un produit dans votre dashboard ou via API:</p>
          
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {codeExample1}
            </pre>
            <button
              onClick={() => copyCode(codeExample1, 'ex1')}
              className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
            >
              {copied === 'ex1' ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </Card>

        {/* Étape 2 */}
        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-500 rounded-full text-white text-sm mr-3">2</span>
            Intégrer le Composant
          </h2>
          
          <p className="text-gray-300 mb-4">Ajoutez le composant React dans votre page:</p>
          
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {codeExample2}
            </pre>
            <button
              onClick={() => copyCode(codeExample2, 'ex2')}
              className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
            >
              {copied === 'ex2' ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </Card>

        {/* Étape 3 */}
        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-green-500 rounded-full text-white text-sm mr-3">3</span>
            Configuration Optionnelle
          </h2>
          
          <p className="text-gray-300 mb-4">Personnalisez le comportement du customizer:</p>
          
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {codeExample3}
            </pre>
            <button
              onClick={() => copyCode(codeExample3, 'ex3')}
              className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
            >
              {copied === 'ex3' ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </Card>

        {/* Résultat */}
        <Card className="p-6 bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-400/30 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Palette className="w-6 h-6 text-green-400" />
            Résultat
          </h2>
          <p className="text-gray-300 mb-4">Votre customizer est maintenant opérationnel ! Vos clients peuvent:</p>
          <ul className="space-y-2 text-gray-300">
            <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> Ajouter du texte</li>
            <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> Uploader des images</li>
            <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> Choisir des cliparts</li>
            <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /> Exporter leur design</li>
          </ul>
        </Card>

        {/* Next Steps */}
        <Card className="p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-400/30">
          <h2 className="text-2xl font-bold text-white mb-4">Aller Plus Loin</h2>
          <div className="space-y-3">
            <Link href="/help/documentation/customizer/advanced">
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800">
                <span className="text-white font-medium">Fonctionnalités avancées</span>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
            <Link href="/help/documentation/api/products">
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800">
                <span className="text-white font-medium">API Products</span>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
