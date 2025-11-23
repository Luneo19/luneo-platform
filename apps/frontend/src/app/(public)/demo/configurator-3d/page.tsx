'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Box, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Configurator3DDemo } from '@/components/lazy';
import { logger } from '@/lib/logger';

export default function Configurator3DDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/solutions/configurator-3d">
            <Button
              variant="outline"
              className="border-blue-500/50 hover:bg-blue-500/10 mb-6"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Retour
            </Button>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Box className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold">
                  Configurateur 3D
                </h1>
                <p className="text-gray-400">Démo Interactive Three.js</p>
              </div>
            </div>

            <p className="text-lg text-gray-300 mb-6">
              Configurez produits en 3D avec PBR materials, gravure texte, et export multi-format
            </p>
          </motion.div>
        </div>

        {/* Demo Component */}
        <Configurator3DDemo
          enableExplodedView={true}
          enableEngraving={true}
          onConfigChange={(config) => {
            logger.debug('Config changed', { hasConfig: !!config });
          }}
        />

        {/* Info Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-gray-900/50 border border-blue-500/20 rounded-lg">
            <Box className="w-10 h-10 text-blue-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              Rendu PBR Réaliste
            </h3>
            <p className="text-sm text-gray-400">
              Materials avec metalness, roughness, normal maps pour photo-réalisme
            </p>
          </div>

          <div className="p-6 bg-gray-900/50 border border-purple-500/20 rounded-lg">
            <Sparkles className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              Gravure 3D Texte
            </h3>
            <p className="text-sm text-gray-400">
              Ajoutez du texte gravé en 3D avec extrusion et profondeur variable
            </p>
          </div>

          <div className="p-6 bg-gray-900/50 border border-green-500/20 rounded-lg">
            <Box className="w-10 h-10 text-green-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              Export Production
            </h3>
            <p className="text-sm text-gray-400">
              GLB, USDZ, FBX optimisés + Print 4K/8K 300 DPI pour fabrication
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">
            Intégrez le configurateur 3D sur votre e-commerce
          </p>
          <Link href="/auth/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8"
            >
              Commencer Gratuitement
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

