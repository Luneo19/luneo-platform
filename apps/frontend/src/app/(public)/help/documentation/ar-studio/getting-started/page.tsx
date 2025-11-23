import Link from 'next/link';

export const metadata = {
  title: 'AR Studio Getting Started - Luneo',
};

export default function ARStudioGettingStartedPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/help/documentation" className="text-blue-600">← Documentation</Link>
      <h1 className="text-4xl font-bold mt-4 mb-2">AR Studio - Getting Started</h1>
      <div className="prose prose-lg">
        <p>L'AR Studio permet de créer des expériences AR pour iOS (USDZ) et Android (GLB).</p>
        <h2>Créer une expérience AR</h2>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
          <pre>{`const ar = await luneo.ar.create({
  model: 'model.glb',
  scale: { x: 1, y: 1, z: 1 },
  enablePlacement: true
});

// Export for iOS
await ar.export('usdz');

// Export for Android
await ar.export('glb');`}</pre>
        </div>
      </div>
    </div>
  );
}



