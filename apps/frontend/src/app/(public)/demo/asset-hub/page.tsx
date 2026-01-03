'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { ArrowLeft, Database, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AssetHubDemo } from '@/components/lazy';
import { logger } from '@/lib/logger';

function AssetHubDemoPageContent() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/solutions/3d-asset-hub">
            <Button
              variant="outline"
              className="border-green-500/50 hover:bg-green-500/10 mb-6"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Retour
            </Button>
          </Link>

          <motion
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Database className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold">
                  3D Asset Hub
                </h1>
                <p className="text-gray-400">Démo Upload/Optimize/Convert</p>
              </div>
            </div>

            <p className="text-lg text-gray-300 mb-6">
              Uploadez, optimisez, convertissez vos modèles 3D avec AI mesh simplification et LOD auto
            </p>
          </motion>
        </div>

        {/* Demo Component */}
        <AssetHubDemo
          maxFileSize={500}
          supportedFormats={['GLB', 'FBX', 'OBJ', 'GLTF', 'USD', 'USDZ', 'STL', '3DS', 'COLLADA']}
          onAssetProcessed={(asset) => {
            logger.info('Asset processed', { assetId: asset?.id, assetName: asset?.name });
          }}
        />

        {/* Info Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-gray-900/50 border border-green-500/20 rounded-lg">
            <Database className="w-10 h-10 text-green-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              12+ Formats
            </h3>
            <p className="text-sm text-gray-400">
              Support GLB, FBX, OBJ, USD, USDZ, STL, 3DS, COLLADA et plus
            </p>
          </div>

          <div className="p-6 bg-gray-900/50 border border-blue-500/20 rounded-lg">
            <Sparkles className="w-10 h-10 text-blue-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              Optimisation AI
            </h3>
            <p className="text-sm text-gray-400">
              Réduction intelligente 50-90% avec préservation détails visuels
            </p>
          </div>

          <div className="p-6 bg-gray-900/50 border border-purple-500/20 rounded-lg">
            <Database className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              Batch Processing
            </h3>
            <p className="text-sm text-gray-400">
              Traitez 1000+ assets/heure avec BullMQ et Redis
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">
            Gérez vos assets 3D comme un pro
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8"
            >
              Commencer Gratuitement
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

const MemoizedAssetHubDemoPageContent = memo(AssetHubDemoPageContent);

export default function AssetHubDemoPage() {
  return (
    <ErrorBoundary level="page" componentName="AssetHubDemoPage">
      <MemoizedAssetHubDemoPageContent />
    </ErrorBoundary>
  );
}

