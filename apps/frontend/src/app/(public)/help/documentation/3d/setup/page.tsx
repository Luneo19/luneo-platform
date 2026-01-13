'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function ThreeDSetupPageContent() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const installCode = useMemo(() => 'npm install @luneo/3d three @react-three/fiber @react-three/drei', []);

  const basicExample = useMemo(() => `import { ProductConfigurator3D } from '@luneo/3d';

export default function Configurator() {
  return (
    <ProductConfigurator3D
      productId="shoe-sneaker"
      modelUrl="/models/shoe.glb"
      config={{
        camera: { position: [0, 2, 5], fov: 45 },
        lights: { ambient: 0.5, directional: 1.0 },
        materials: { changeable: ['upper', 'sole', 'laces'] },
        colors: {
          upper: ['#FF0000', '#00FF00', '#0000FF'],
          sole: ['#FFFFFF', '#000000'],
          laces: ['#FFFFFF', '#000000', '#808080']
        }
      }}
      onSave={(config) => {
        // Handle save
      }}
    />
  );
}`, []);

  const advancedConfig = useMemo(() => `config={{
  camera: {
    position: [0, 2, 5],
    fov: 45,
    near: 0.1,
    far: 1000,
    controls: true, // Orbit controls
    autoRotate: false
  },
  lights: {
    ambient: { color: '#FFFFFF', intensity: 0.5 },
    directional: { color: '#FFFFFF', intensity: 1.0, position: [5, 5, 5] },
    point: { color: '#FFFFFF', intensity: 0.8, position: [0, 3, 0] }
  },
  environment: {
    background: '#F0F0F0',
    skybox: '/textures/skybox.hdr',
    shadows: true
  },
  materials: {
    changeable: ['upper', 'sole', 'laces'],
    textures: {
      upper: ['/textures/leather.jpg', '/textures/canvas.jpg'],
      sole: ['/textures/rubber.jpg']
    }
  },
  export: {
    format: 'png',
    width: 2048,
    height: 2048,
    transparent: false
  }
}}`, []);

  const preparationSteps = useMemo(() => [
    { step: 1, text: 'Exportez vos modèles au format', code: 'GLB', code2: 'GLTF' },
    { step: 2, text: 'Optimisez la géométrie (max 50k polygones recommandé)' },
    { step: 3, text: 'Nommez les matériaux de façon claire (ex:"upper_material","sole_material")' },
    { step: 4, text: 'Testez dans', link: 'https://gltf-viewer.donmccurdy.com/', linkText: 'GLTF Viewer' },
    { step: 5, text: 'Uploadez dans Dashboard Luneo → 3D Models' }
  ], []);

  const CodeBlock = ({ code, id, title }: { code: string; id: string; title?: string }) => (
    <div className="mb-6">
      {title && <h3 className="text-2xl font-bold mb-4">{title}</h3>}
      <div className="relative">
        <div className="bg-gray-900 rounded-lg p-4">
          <pre className="text-sm text-gray-300 overflow-x-auto">
            <code>{code}</code>
          </pre>
        </div>
        <button
          onClick={() => copyCode(code, id)}
          className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
        >
          {copied === id ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <DocPageTemplate
      title="Configuration 3D Configurator"
      description="Configurez le configurateur 3D avec Three.js pour des expériences produit immersives"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: '3D', href: '/help/documentation/3d' },
        { label: 'Setup', href: '/help/documentation/3d/setup' }
      ]}
      relatedLinks={[
        { title: 'Models', href: '/help/documentation/3d/models', description: 'Gestion modèles' },
        { title: 'Getting Started', href: '/help/documentation/3d/getting-started', description: 'Guide 3D' }
      ]}
    >
      <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Installation</h2>
        <CodeBlock code={installCode} id="install" />
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Exemple de base</h2>
        <CodeBlock code={basicExample} id="basic" />
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Préparer vos modèles 3D</h2>
        <ol className="space-y-3 text-gray-300">
          {preparationSteps.map((item) => (
            <li key={item.step} className="flex items-start">
              <span className="text-blue-400 mr-3 font-bold">{item.step}.</span>
              <span>
                {item.text}
                {item.code && (
                  <>
                    {' '}
                    <code className="bg-gray-700 px-2 py-1 rounded">{item.code}</code>
                    {item.code2 && (
                      <>
                        {' '}ou{' '}
                        <code className="bg-gray-700 px-2 py-1 rounded">{item.code2}</code>
                      </>
                    )}
                  </>
                )}
                {item.link && (
                  <>
                    {' '}
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      {item.linkText}
                    </a>
                  </>
                )}
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <h2 className="text-2xl font-bold mb-4">Configuration avancée</h2>
        <CodeBlock code={advancedConfig} id="advanced" />
      </Card>
    </DocPageTemplate>
  );
}

const ThreeDSetupPageMemo = memo(ThreeDSetupPageContent);

export default function ThreeDSetupPage() {
  return (
    <ErrorBoundary componentName="ThreeDSetupPage">
      <ThreeDSetupPageMemo />
    </ErrorBoundary>
  );
}
