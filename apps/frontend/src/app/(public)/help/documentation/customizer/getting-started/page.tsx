import Link from 'next/link';

export const metadata = {
  title: 'Visual Customizer Getting Started - Luneo',
};

export default function CustomizerGettingStartedPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/help/documentation" className="text-blue-600">← Documentation</Link>
      <h1 className="text-4xl font-bold mt-4 mb-2">Visual Customizer - Getting Started</h1>
      <div className="prose prose-lg">
        <p>Le Visual Customizer est un éditeur canvas basé sur Konva.js pour créer des designs 2D.</p>
        <h2>Installation</h2>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
          <pre>{`npm install @luneo/customizer`}</pre>
        </div>
        <h2>Usage</h2>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
          <pre>{`import { Customizer } from '@luneo/customizer';

<Customizer template="t-shirt" />`}</pre>
        </div>
      </div>
    </div>
  );
}
