'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { ArrowLeft, Camera, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TryOnDemo } from '@/components/lazy';

function VirtualTryOnDemoPageContent() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/solutions/virtual-try-on">
            <Button
              variant="outline"
              className="border-cyan-500/50 hover:bg-cyan-500/10 mb-6"
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
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <Camera className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold">
                  Virtual Try-On
                </h1>
                <p className="text-gray-400">Démo Interactive AR</p>
              </div>
            </div>

            <p className="text-lg text-gray-300 mb-6">
              Essayez lunettes, montres, bijoux en temps réel avec tracking MediaPipe 468+21 points
            </p>
          </motion>
        </div>

        {/* Demo Component */}
        <TryOnDemo category="all" showControls={true} />

        {/* Info Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-gray-900/50 border border-cyan-500/20 rounded-lg">
            <Sparkles className="w-10 h-10 text-cyan-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              Tracking Ultra-Précis
            </h3>
            <p className="text-sm text-gray-400">
              468 points faciaux + 21 points main pour ajustement parfait en temps réel
            </p>
          </div>

          <div className="p-6 bg-gray-900/50 border border-blue-500/20 rounded-lg">
            <Camera className="w-10 h-10 text-blue-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              Export AR Natif
            </h3>
            <p className="text-sm text-gray-400">
              USDZ pour iOS AR Quick Look et GLB pour Android Scene Viewer
            </p>
          </div>

          <div className="p-6 bg-gray-900/50 border border-purple-500/20 rounded-lg">
            <Sparkles className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              Performance 60 FPS
            </h3>
            <p className="text-sm text-gray-400">
              Optimisé WebGL pour tracking et rendu fluide sur tout appareil
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">
            Prêt à intégrer le Virtual Try-On sur votre site ?
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-8"
            >
              Commencer Gratuitement
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

const MemoizedVirtualTryOnDemoPageContent = memo(VirtualTryOnDemoPageContent);

export default function VirtualTryOnDemoPage() {
  return (
    <ErrorBoundary level="page" componentName="VirtualTryOnDemoPage">
      <MemoizedVirtualTryOnDemoPageContent />
    </ErrorBoundary>
  );
}
