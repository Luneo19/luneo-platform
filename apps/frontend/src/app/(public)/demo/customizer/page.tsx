'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { ArrowLeft, Palette, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomizerDemo } from '@/components/lazy';
import { logger } from '@/lib/logger';

function CustomizerDemoPageContent() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/solutions/customizer">
            <Button
              variant="outline"
              className="border-purple-500/50 hover:bg-purple-500/10 mb-6"
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
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Palette className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold">
                  Visual Customizer
                </h1>
                <p className="text-gray-400">Démo Interactive Konva.js</p>
              </div>
            </div>

            <p className="text-lg text-gray-300 mb-6">
              Éditeur visuel professionnel avec texte, images, formes, cliparts, et export print 300 DPI
            </p>
          </motion>
        </div>

        {/* Demo Component */}
        <div className="w-full max-w-[800px] mx-auto overflow-hidden">
          <CustomizerDemo
            width={800}
            height={800}
            backgroundColor="#FFFFFF"
            onSave={(elements) => {
              logger.info('Design saved', { elementsCount: elements?.length || 0 });
            }}
            onExport={(format) => {
              logger.info('Export triggered', { format });
            }}
          />
        </div>

        {/* Info Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-gray-900/50 border border-purple-500/20 rounded-lg">
            <Palette className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              Éditeur Professionnel
            </h3>
            <p className="text-sm text-gray-400">
              Interface Konva.js intuitive avec multi-layers Photoshop-style
            </p>
          </div>

          <div className="p-6 bg-gray-900/50 border border-pink-500/20 rounded-lg">
            <Sparkles className="w-10 h-10 text-pink-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              Export Print-Ready
            </h3>
            <p className="text-sm text-gray-400">
              PNG/PDF 300 DPI avec CMYK, bleed 3mm, crop marks pour imprimeurs
            </p>
          </div>

          <div className="p-6 bg-gray-900/50 border border-blue-500/20 rounded-lg">
            <Palette className="w-10 h-10 text-blue-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              Collaboration Temps Réel
            </h3>
            <p className="text-sm text-gray-400">
              Multi-users editing avec WebSockets et cursors visibles
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center p-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl">
          <p className="text-xl font-semibold text-white mb-2">
            Vous aimez ? Ajoutez ça à votre boutique.
          </p>
          <p className="text-gray-400 mb-6">
            Intégrez ce customizer sur votre site en 5 minutes. Gratuit pour commencer.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8"
            >
              Commencer Gratuitement
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

const MemoizedCustomizerDemoPageContent = memo(CustomizerDemoPageContent);

export default function CustomizerDemoPage() {
  return (
    <ErrorBoundary level="page" componentName="CustomizerDemoPage">
      <MemoizedCustomizerDemoPageContent />
    </ErrorBoundary>
  );
}

