'use client';

import React, { useState, memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import {
  ArrowLeft,
  Wand2,
  Hand,
  Smartphone,
  Box,
  Eye,
  ShoppingBag,
  Play,
  RotateCcw,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const arFeatures = [
  {
    id: 'hand-tracking',
    label: 'Hand Tracking',
    description: 'Essayez des bracelets et bagues en temps réel avec le suivi des mains',
    icon: Hand,
    color: 'amber',
  },
  {
    id: 'body-tracking',
    label: 'Body Tracking',
    description: 'Visualisez des vetements sur votre silhouette grace a la detection de pose',
    icon: Eye,
    color: 'orange',
  },
  {
    id: 'surface-placement',
    label: 'Placement 3D',
    description: 'Placez des objets 3D sur n\'importe quelle surface avec WebXR',
    icon: Box,
    color: 'yellow',
  },
];

const productShowcase = [
  { name: 'Bracelet Lune', type: 'Bijoux - Hand Tracking', img: '/placeholder-design.svg' },
  { name: 'T-Shirt Urban', type: 'Textile - Body Tracking', img: '/placeholder-design.svg' },
  { name: 'Mug Artisan', type: 'Objet - Surface Placement', img: '/placeholder-design.svg' },
  { name: 'Sac Voyageur', type: 'Accessoire - Body Tracking', img: '/placeholder-design.svg' },
];

function ARExperienceDemoPageContent() {
  const [selectedFeature, setSelectedFeature] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/demo">
            <Button variant="outline" className="border-amber-500/50 hover:bg-amber-500/10 mb-6">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Retour
            </Button>
          </Link>

          <motion initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Wand2 className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-2">
                  AR Experience
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-500/50">
                    Demo
                  </span>
                </h1>
                <p className="text-gray-400">Expériences AR immersives avec WebXR</p>
              </div>
            </div>
          </motion>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feature Selector */}
          <div className="lg:col-span-1 space-y-3">
            {arFeatures.map((f, i) => (
              <button
                key={f.id}
                onClick={() => setSelectedFeature(i)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedFeature === i
                    ? 'bg-amber-500/10 border-amber-500/50 border-2'
                    : 'bg-gray-900/50 border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <f.icon className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-white">{f.label}</span>
                </div>
                <p className="text-xs text-gray-400">{f.description}</p>
              </button>
            ))}

            {/* Device info */}
            <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-white">Compatibilite</span>
              </div>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>iOS 16+ (Safari, ARKit)</li>
                <li>Android 12+ (Chrome, ARCore)</li>
                <li>Desktop (WebXR avec casque VR)</li>
              </ul>
            </div>
          </div>

          {/* AR Preview */}
          <Card className="lg:col-span-2 bg-gray-900/50 border-gray-700 overflow-hidden">
            <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              {/* Simulated AR viewport */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Grid overlay simulating AR */}
                  <div className="absolute inset-0 opacity-20">
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundImage:
                          'linear-gradient(rgba(251,191,36,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.3) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                      }}
                    />
                  </div>
                  <div className="relative z-10 text-center p-8">
                    <div className="w-32 h-32 mx-auto mb-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 border-dashed flex items-center justify-center">
                      <Wand2 className="w-12 h-12 text-amber-400/60" />
                    </div>
                    <p className="text-gray-300 font-medium mb-1">
                      {arFeatures[selectedFeature].label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isPlaying
                        ? 'Simulation AR active - En production, votre camera serait utilisee'
                        : 'Cliquez sur Demarrer pour lancer l\'apercu AR'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Scanning animation when playing */}
              {isPlaying && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />
                  {/* Corner markers */}
                  {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map(
                    (pos) => (
                      <div
                        key={pos}
                        className={`absolute ${pos} w-6 h-6 border-amber-400/60 ${
                          pos.includes('top') ? 'border-t-2' : 'border-b-2'
                        } ${pos.includes('left') ? 'border-l-2' : 'border-r-2'}`}
                      />
                    ),
                  )}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="p-4 flex items-center justify-between border-t border-gray-700">
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsPlaying(!isPlaying)}
                  size="sm"
                  className={`${
                    isPlaying
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Arreter
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-1" />
                      Demarrer AR
                    </>
                  )}
                </Button>
                <Button size="sm" variant="outline" className="border-gray-600">
                  <Maximize2 className="w-4 h-4 mr-1" />
                  Plein ecran
                </Button>
              </div>
              <span className="text-xs text-gray-500">Apercu demo - Camera non requise</span>
            </div>
          </Card>
        </div>

        {/* Product Showcase */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            Produits compatibles AR
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {productShowcase.map((p) => (
              <Card
                key={p.name}
                className="p-4 bg-gray-900/50 border-gray-700 hover:border-amber-500/30 transition-colors cursor-pointer"
              >
                <div className="w-full aspect-square bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                  <Box className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-sm font-medium text-white">{p.name}</p>
                <p className="text-xs text-gray-400">{p.type}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-gray-900/50 border border-amber-500/20 rounded-lg">
            <Hand className="w-10 h-10 text-amber-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Hand Tracking</h3>
            <p className="text-sm text-gray-400">
              Détectez les mains en temps réel pour essayer bijoux et accessoires
            </p>
          </div>
          <div className="p-6 bg-gray-900/50 border border-orange-500/20 rounded-lg">
            <Eye className="w-10 h-10 text-orange-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Pose Detection</h3>
            <p className="text-sm text-gray-400">
              Suivi du corps complet pour la visualisation de vetements et accessoires
            </p>
          </div>
          <div className="p-6 bg-gray-900/50 border border-yellow-500/20 rounded-lg">
            <Smartphone className="w-10 h-10 text-yellow-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">WebXR natif</h3>
            <p className="text-sm text-gray-400">
              Fonctionne directement dans le navigateur, sans application a telecharger
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">Integrez l&apos;AR dans votre e-commerce avec Luneo</p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-8"
            >
              Commencer Gratuitement
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

const MemoizedContent = memo(ARExperienceDemoPageContent);

export default function ARExperienceDemoPage() {
  return (
    <ErrorBoundary level="page" componentName="ARExperienceDemoPage">
      <MemoizedContent />
    </ErrorBoundary>
  );
}
