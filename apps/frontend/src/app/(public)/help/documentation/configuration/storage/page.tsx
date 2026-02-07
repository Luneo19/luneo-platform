'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function StorageConfigPageContent() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">Storage Setup</h1>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Cloudinary</h2>
          <p className="text-gray-300">Images, designs et exports sont stockés sur <strong>Cloudinary</strong>, avec CDN et optimisation automatique. Configurez les variables d&apos;environnement backend (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) pour activer le stockage.</p>
        </Card>
      </div>
    </div>
  );
}

const StorageConfigPageMemo = memo(StorageConfigPageContent);

export default function StorageConfigPage() {
  return (
    <ErrorBoundary componentName="StorageConfigPage">
      <StorageConfigPageMemo />
    </ErrorBoundary>
  );
}
