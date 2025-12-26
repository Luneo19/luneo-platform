'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function ThreeDExportPageContent() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center space-x-2 text-sm text-gray-400 mb-8">
          <Link href="/help/documentation" className="hover:text-white">Documentation</Link>
          <span>/</span>
          <span className="text-white">3D - Export</span>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold mb-4">Export 3D</h1>
          <p className="text-xl text-gray-300 mb-8">
            Exportez vos configurations 3D en images haute résolution ou modèles AR.
          </p>
        </motion.div>

        <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Formats d'export</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-900 rounded">
              <h3 className="font-bold mb-2">Images</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• PNG (transparent)</li>
                <li>• JPEG (fond blanc)</li>
                <li>• WebP (optimisé)</li>
              </ul>
            </div>
            <div className="p-4 bg-gray-900 rounded">
              <h3 className="font-bold mb-2">3D</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• GLB (AR ready)</li>
                <li>• USDZ (iOS AR)</li>
                <li>• FBX (production)</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 p-6">
          <h2 className="text-2xl font-bold mb-4">Export via API</h2>
          <div className="bg-gray-900 rounded-lg p-4">
            <pre className="text-sm text-gray-300 overflow-x-auto">
              <code>{`// Export image haute résolution
const response = await fetch('/api/3d/export-ar', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    configId: 'config_abc123',
    format: 'png',
    width: 2048,
    height: 2048,
    transparent: true
  })
});

const { imageUrl } = await response.json();
// imageUrl: https://cdn.luneo.app/exports/abc123.png`}</code>
            </pre>
          </div>
        </Card>
      </div>
    </div>
  );
}

const ThreeDExportPageMemo = memo(ThreeDExportPageContent);

export default function ThreeDExportPage() {
  return (
    <ErrorBoundary componentName="ThreeDExportPage">
      <ThreeDExportPageMemo />
    </ErrorBoundary>
  );
}
