import Link from 'next/link';

export const metadata = {
  title: '3D Configurator Getting Started - Luneo',
};

export default function ConfiguratorGettingStartedPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/help/documentation" className="text-blue-600">← Documentation</Link>
      <h1 className="text-4xl font-bold mt-4 mb-2">3D Configurator - Getting Started</h1>
      <div className="prose prose-lg">
        <p>Le 3D Configurator permet la personnalisation de modèles 3D avec PBR materials.</p>
        <h2>Installation</h2>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
          <pre>{`npm install @luneo/configurator`}</pre>
        </div>
        <h2>Usage</h2>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
          <pre>{`import { Configurator3D } from '@luneo/configurator';

<Configurator3D 
  model="product.glb"
  enableAR={true}
/>`}</pre>
        </div>
      </div>
    </div>
  );
}



