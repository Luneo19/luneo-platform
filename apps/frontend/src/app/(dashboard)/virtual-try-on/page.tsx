'use client';

import React, { useEffect, useState, useMemo, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, Eye, Camera, Download, Sparkles } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

type ProductCategory = 'glasses' | 'watch' | 'jewelry';

interface Model {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
}

const AVAILABLE_MODELS: Record<ProductCategory, Model[]> = {
  glasses: [
    { id: 'sunglasses-aviator', name: 'Lunettes Aviator', url: '/models/glasses/aviator.glb', thumbnail: '/images/glasses/aviator-thumb.jpg' },
    { id: 'sunglasses-wayfarer', name: 'Lunettes Wayfarer', url: '/models/glasses/wayfarer.glb', thumbnail: '/images/glasses/wayfarer-thumb.jpg' },
    { id: 'eyeglasses-round', name: 'Lunettes de Vue Rondes', url: '/models/glasses/round.glb', thumbnail: '/images/glasses/round-thumb.jpg' },
  ],
  watch: [
    { id: 'watch-classic', name: 'Montre Classique', url: '/models/watches/classic.glb', thumbnail: '/images/watches/classic-thumb.jpg' },
    { id: 'watch-sport', name: 'Montre Sport', url: '/models/watches/sport.glb', thumbnail: '/images/watches/sport-thumb.jpg' },
    { id: 'watch-luxury', name: 'Montre Luxe', url: '/models/watches/luxury.glb', thumbnail: '/images/watches/luxury-thumb.jpg' },
  ],
  jewelry: [
    { id: 'earrings-hoop', name: 'Créoles', url: '/models/jewelry/hoop-earrings.glb', thumbnail: '/images/jewelry/hoop-thumb.jpg' },
    { id: 'necklace-pendant', name: 'Collier Pendentif', url: '/models/jewelry/pendant.glb', thumbnail: '/images/jewelry/pendant-thumb.jpg' },
  ],
};

function VirtualTryOnPageContent() {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('glasses');
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS.glasses[0]);
  const [isReady, setIsReady] = useState(false);
  const [fps, setFPS] = useState(0);
  const [hasError, setHasError] = useState(false);

  const handleCategoryChange = (category: ProductCategory) => {
    setSelectedCategory(category);
    setSelectedModel(AVAILABLE_MODELS[category][0]);
    setIsReady(false);
  };

  const handleModelChange = (modelId: string) => {
    const model = AVAILABLE_MODELS[selectedCategory].find(m => m.id === modelId);
    if (model) {
      setSelectedModel(model);
      setIsReady(false);
    }
  };

  const handleStartSession = () => {
    setHasError(false);
    setIsReady(true);
    const baseline = selectedCategory === 'watch' ? 48 : 42;
    setFPS(baseline + Math.floor(Math.random() * 8));
  };

  const handleSimulateError = () => {
    setHasError(true);
    setIsReady(false);
    setFPS(0);
  };

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const interval = setInterval(() => {
      const baseline = selectedCategory === 'watch' ? 50 : 40;
      const variance = Math.random() * 10 - 5;
      setFPS(Math.max(24, Math.round(baseline + variance)));
    }, 2000);

    return () => clearInterval(interval);
  }, [isReady, selectedCategory]);

  return (
    <div className="min-h-screen bg-gray-900 text-white py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
            Virtual Try-On
          </h1>
          <p className="text-base sm:text-lg text-gray-300">
            Essayez virtuellement vos produits avec face & hand tracking IA
          </p>
        </div>

        {/* Info Banner */}
        <Card className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-900/20 border-blue-400/30">
          <div className="flex items-start gap-2 sm:gap-3">
            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-blue-200">
              <p className="font-semibold mb-1">Comment ça marche ?</p>
              <ul className="list-disc list-inside space-y-1 text-blue-300">
                <li>Autorisez l'accès à votre caméra</li>
                <li>Positionnez votre {selectedCategory === 'watch' ? 'main' : 'visage'} face à la caméra</li>
                <li>Le produit s'affichera en temps réel sur vous</li>
                <li>Prenez un screenshot pour partager !</li>
              </ul>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Category Selection */}
            <Card className="p-3 sm:p-4 bg-gray-800/50 backdrop-blur-sm border-gray-700">
              <h3 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Catégorie</h3>
              <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 sm:space-y-2">
                {(['glasses', 'watch', 'jewelry'] as ProductCategory[]).map((category) => (
                  <Button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    size="sm"
                    className={`w-full justify-start text-xs sm:text-sm ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {category === 'glasses' ? <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> : null}
                    {category === 'watch' ? <Camera className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> : null}
                    {category === 'jewelry' ? <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> : null}
                    <span className="hidden sm:inline">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                    <span className="sm:hidden">{category.charAt(0).toUpperCase()}</span>
                  </Button>
                ))}
              </div>
            </Card>

            {/* Model Selection */}
            <Card className="p-3 sm:p-4 bg-gray-800/50 backdrop-blur-sm border-gray-700">
              <h3 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Modèle</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 sm:space-y-2">
                {AVAILABLE_MODELS[selectedCategory].map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleModelChange(model.id)}
                    className={`w-full text-left p-2 sm:p-3 rounded-lg transition-all text-xs sm:text-sm ${
                      selectedModel.id === model.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-medium">{model.name}</div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Stats */}
            {isReady && (
              <Card className="p-3 sm:p-4 bg-gray-800/50 backdrop-blur-sm border-gray-700">
                <h3 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Performance</h3>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between lg:flex-row">
                    <span className="text-gray-400">FPS:</span>
                    <span className={`font-bold ${fps > 30 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {fps}
                    </span>
                  </div>
                  <div className="flex justify-between lg:flex-row">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-green-400 font-semibold">Active</span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Main Content - Camera View */}
          <div className="lg:col-span-3">
            <Card className="p-3 sm:p-4 md:p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700">
              <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                {hasError ? (
                  <div className="text-center">
                    <Camera className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <p className="text-white mb-2">Erreur caméra</p>
                    <p className="text-sm text-gray-400">Veuillez autoriser l'accès à votre caméra</p>
                  </div>
                ) : !isReady ? (
                  <div className="text-center">
                    <Camera className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-pulse" />
                    <p className="text-white mb-2">Initialisation...</p>
                    <p className="text-sm text-gray-400">
                      Système Virtual Try-On en cours d'intégration finale
                    </p>
                    <div className="mt-6 text-xs text-gray-500">
                      <p className="mb-2">Technologies développées :</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <span className="px-2 py-1 bg-blue-900/30 rounded">MediaPipe Face Mesh (468 landmarks)</span>
                        <span className="px-2 py-1 bg-purple-900/30 rounded">MediaPipe Hands (21 landmarks)</span>
                        <span className="px-2 py-1 bg-cyan-900/30 rounded">Three.js 3D Overlay</span>
                        <span className="px-2 py-1 bg-green-900/30 rounded">WebXR AR Export</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20">
                    <p className="text-center text-white p-8">Camera feed would appear here</p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="mt-3 sm:mt-4 grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 justify-center">
                <Button
                  onClick={handleStartSession}
                  variant={isReady ? 'outline' : 'default'}
                  size="sm"
                  className={`text-xs sm:text-sm ${
                    isReady ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{isReady ? 'Recalibrer' : 'Lancer la session'}</span>
                  <span className="sm:hidden">{isReady ? 'Recal.' : 'Lancer'}</span>
                </Button>
                <Button
                  disabled={!isReady}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
                >
                  <Camera className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Take Screenshot</span>
                  <span className="sm:hidden">Photo</span>
                </Button>
                <Button
                  disabled={!isReady}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs sm:text-sm"
                >
                  <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Export AR</span>
                  <span className="sm:hidden">Export</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSimulateError}
                  size="sm"
                  className="border-red-500/40 text-red-300 hover:bg-red-500/10 text-xs sm:text-sm"
                >
                  <Info className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Simuler une erreur</span>
                  <span className="sm:hidden">Erreur</span>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

const MemoizedVirtualTryOnPageContent = memo(VirtualTryOnPageContent);

export default function VirtualTryOnPage() {
  return (
    <ErrorBoundary level="page" componentName="VirtualTryOnPage">
      <MemoizedVirtualTryOnPageContent />
    </ErrorBoundary>
  );
}
