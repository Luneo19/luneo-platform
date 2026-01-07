'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function WidgetDemoPage() {
  const [productId, setProductId] = useState('demo-product-123');
  const [apiKey, setApiKey] = useState('demo-api-key');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-4xl font-bold mb-2">🎨 Démo Widget Luneo</h1>
          <p className="text-gray-600 mb-8">
            Testez le widget éditeur de personnalisation de produits
          </p>

          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product ID
              </label>
              <input
                type="text"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="demo-product-123"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="demo-api-key"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Link
              href={`/widget/editor?productId=${productId}&apiKey=${apiKey}`}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Ouvrir l'éditeur
            </Link>
            <Link
              href="/widget/docs"
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
            >
              Documentation
            </Link>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-md">
            <h2 className="font-semibold mb-2">📚 Intégration</h2>
            <pre className="text-sm bg-white p-4 rounded border overflow-x-auto">
{`<script src="https://cdn.luneo.app/widget/v1/luneo-widget.iife.js"></script>
<script>
  LuneoWidget.init({
    container: '#my-widget',
    apiKey: '${apiKey}',
    productId: '${productId}',
    locale: 'fr',
    theme: 'light',
    onSave: (design) => console.log('Saved:', design),
    onError: (error) => console.error('Error:', error),
    onReady: () => console.log('Ready!')
  });
</script>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}





