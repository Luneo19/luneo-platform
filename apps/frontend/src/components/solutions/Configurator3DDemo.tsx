'use client';

import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Palette,
  Type,
  Maximize,
  Rotate3D,
  Download,
  Camera,
  Share2,
  Eye,
  Grid3x3,
  Layers,
  Zap,
  Settings,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { logger } from '@/lib/logger';

interface Material {
  id: string;
  name: string;
  color: string;
  metalness: number;
  roughness: number;
}

interface Config3D {
  material: string;
  color: string;
  engravingText: string;
  isExploded: boolean;
  showWireframe: boolean;
  showGrid: boolean;
}

interface Configurator3DDemoProps {
  modelUrl?: string;
  enableExplodedView?: boolean;
  enableEngraving?: boolean;
  onConfigChange?: (config: Config3D) => void;
}

function Configurator3DDemo({
  modelUrl = '/models/default.glb',
  enableExplodedView = true,
  enableEngraving = true,
  onConfigChange,
}: Configurator3DDemoProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRotating, setIsRotating] = useState(false);
  const [isExploded, setIsExploded] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showWireframe, setShowWireframe] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('metal');
  const [selectedColor, setSelectedColor] = useState<string>('#3B82F6');
  const [engravingText, setEngravingText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('material');
  const [fps, setFps] = useState(60);
  const [polygons, setPolygons] = useState(50000);

  const materials: Material[] = [
    { id: 'metal', name: 'Métal Brossé', color: '#C0C0C0', metalness: 1.0, roughness: 0.3 },
    { id: 'gold', name: 'Or 18K', color: '#FFD700', metalness: 1.0, roughness: 0.2 },
    { id: 'wood', name: 'Bois Chêne', color: '#8B4513', metalness: 0.0, roughness: 0.8 },
    { id: 'leather', name: 'Cuir', color: '#654321', metalness: 0.0, roughness: 0.9 },
    { id: 'carbon', name: 'Fibre Carbone', color: '#1a1a1a', metalness: 0.8, roughness: 0.1 },
    { id: 'glass', name: 'Verre', color: '#E8F4F8', metalness: 0.0, roughness: 0.0 },
  ];

  const colors = [
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#10B981', // Green
    '#F59E0B', // Orange
    '#EF4444', // Red
    '#6366F1', // Indigo
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#A855F7', // Purple
    '#06B6D4', // Cyan
    '#84CC16', // Lime
  ];

  const tabs = [
    { id: 'material', name: 'Matériau', icon: Layers },
    { id: 'color', name: 'Couleur', icon: Palette },
    { id: 'engraving', name: 'Gravure', icon: Type },
    { id: 'size', name: 'Dimensions', icon: Maximize },
  ];

  // Simulate 3D engine loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    // Simulate FPS counter
    const fpsInterval = setInterval(() => {
      setFps(Math.floor(55 + Math.random() * 10));
      const variation = Math.floor(Math.random() * 2000) - 1000;
      const baseline = isExploded ? 42000 : 50000;
      const next = baseline + variation;
      setPolygons(Math.max(10000, next));
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(fpsInterval);
    };
  }, [isExploded]);

  // Handle config changes
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange({
        material: selectedMaterial,
        color: selectedColor,
        engravingText,
        isExploded,
        showGrid,
        showWireframe,
      });
    }
  }, [
    selectedMaterial,
    selectedColor,
    engravingText,
    isExploded,
    showGrid,
    showWireframe,
    onConfigChange,
  ]);

  const toggleExploded = () => {
    setIsExploded(!isExploded);
  };

  const exportModel = (format: string) => {
    logger.info('Exporting model', { format });
    // Real implementation would use @luneo/ar-export
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900/50 border-blue-500/20 overflow-hidden">
        {/* 3D Viewport */}
        <div className="relative aspect-square bg-gradient-to-br from-blue-900/20 to-purple-900/20">
          <div ref={canvasRef} className="w-full h-full flex items-center justify-center">
            {isLoading ? (
              // Loading State
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
                />
                <p className="text-white font-medium">Chargement modèle 3D...</p>
                <p className="text-sm text-gray-400 mt-2">
                  Initialisation Three.js + WebGL
                </p>
              </div>
            ) : (
              // 3D Model Simulation
              <motion.div
                animate={{
                  rotateY: isRotating ? 360 : 0,
                  scale: isExploded ? 1.2 : 1,
                }}
                transition={{
                  rotateY: {
                    duration: 4,
                    repeat: isRotating ? Infinity : 0,
                    ease: 'linear',
                  },
                  scale: {
                    duration: 0.5,
                  },
                }}
                className="relative"
                style={{
                  transformStyle: 'preserve-3d',
                  perspective: '1000px',
                }}
              >
                {/* Main Product */}
                <div
                  className="w-64 h-64 rounded-2xl shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${selectedColor} 0%, ${materials.find(m => m.id === selectedMaterial)?.color || selectedColor} 100%)`,
                    transform: isExploded ? 'translateZ(50px)' : 'translateZ(0)',
                  }}
                >
                  {/* Engraving Text */}
                  {engravingText && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p
                        className="text-4xl font-bold text-white/30"
                        style={{
                          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                        }}
                      >
                        {engravingText}
                      </p>
                    </div>
                  )}

                  {/* Material Badge */}
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg">
                    <p className="text-xs text-white font-medium">
                      {materials.find(m => m.id === selectedMaterial)?.name}
                    </p>
                  </div>

                {/* Model Source */}
                {modelUrl && (
                  <Link
                    href={modelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-4 right-4 max-w-[220px] truncate rounded-lg bg-black/50 px-3 py-1 text-xs text-white/80 backdrop-blur-sm transition hover:bg-black/70"
                  >
                    {modelUrl}
                  </Link>
                )}
                </div>

                {/* Exploded Parts (simulation) */}
                {isExploded && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, x: -50, y: -50 }}
                      animate={{ opacity: 1, x: -100, y: -100 }}
                      className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg"
                    />
                    <motion.div
                      initial={{ opacity: 0, x: 50, y: -50 }}
                      animate={{ opacity: 1, x: 100, y: -100 }}
                      className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 100 }}
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-br from-pink-400 to-pink-600 rounded-lg"
                    />
                  </>
                )}
              </motion.div>
            )}
          </div>

          {/* Viewport Controls */}
          {!isLoading && (
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button
                onClick={() => setIsRotating(!isRotating)}
                className={`w-10 h-10 ${
                  isRotating ? 'bg-blue-500/30' : 'bg-black/60'
                } backdrop-blur-sm border border-blue-500/30 rounded-lg flex items-center justify-center hover:bg-black/80 transition-colors`}
                title="Auto-rotation"
              >
                <Rotate3D className="w-5 h-5 text-white" />
              </button>

              {enableExplodedView && (
                <button
                  onClick={toggleExploded}
                  className={`w-10 h-10 ${
                    isExploded ? 'bg-purple-500/30' : 'bg-black/60'
                  } backdrop-blur-sm border border-purple-500/30 rounded-lg flex items-center justify-center hover:bg-black/80 transition-colors`}
                  title="Exploded view"
                >
                  <Layers className="w-5 h-5 text-white" />
                </button>
              )}

              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`w-10 h-10 ${
                  showGrid ? 'bg-green-500/30' : 'bg-black/60'
                } backdrop-blur-sm border border-green-500/30 rounded-lg flex items-center justify-center hover:bg-black/80 transition-colors`}
                title="Show grid"
              >
                <Grid3x3 className="w-5 h-5 text-white" />
              </button>

              <button
                onClick={() => setShowWireframe(!showWireframe)}
                className={`w-10 h-10 ${
                  showWireframe ? 'bg-pink-500/30' : 'bg-black/60'
                } backdrop-blur-sm border border-pink-500/30 rounded-lg flex items-center justify-center hover:bg-black/80 transition-colors`}
                title="Wireframe"
              >
                <Eye className="w-5 h-5 text-white" />
              </button>
            </div>
          )}

          {/* Stats Overlay */}
          {!isLoading && (
            <div className="absolute bottom-4 left-4 space-y-2">
              <div className="bg-black/60 backdrop-blur-sm border border-blue-500/30 px-3 py-2 rounded-lg">
                <p className="text-xs text-white font-medium">
                  {fps} FPS · {polygons.toLocaleString()} polygons
                </p>
              </div>
              {showGrid && (
                <div className="bg-black/60 backdrop-blur-sm border border-green-500/30 px-3 py-2 rounded-lg">
                  <p className="text-xs text-green-400 font-medium">
                    Grid: ON
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Configuration Panel */}
        <div className="p-6 bg-gray-900/30 border-t border-gray-700">
          {/* Tabs */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-400' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`}>
                  {tab.name}
                </span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[200px]">
            {activeTab === 'material' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h4 className="text-sm font-semibold text-gray-400 mb-3">
                  Sélectionnez un Matériau:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {materials.map((material) => (
                    <div
                      key={material.id}
                      onClick={() => setSelectedMaterial(material.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedMaterial === material.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-700 hover:border-blue-500/50 bg-gray-800/50'
                      }`}
                    >
                      <div
                        className="w-full aspect-square rounded-lg mb-2"
                        style={{
                          background: `linear-gradient(135deg, ${material.color} 0%, ${material.color}dd 100%)`,
                        }}
                      />
                      <p className="text-xs text-white font-medium text-center">
                        {material.name}
                      </p>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Metalness:</span>
                          <span className="text-gray-300">{material.metalness}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Roughness:</span>
                          <span className="text-gray-300">{material.roughness}</span>
                        </div>
                      </div>
                      {selectedMaterial === material.id && (
                        <div className="mt-2 flex justify-center">
                          <CheckCircle className="w-5 h-5 text-blue-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'color' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h4 className="text-sm font-semibold text-gray-400 mb-3">
                  Choisissez une Couleur:
                </h4>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-3">
                  {colors.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedColor(color)}
                      className={`aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                        selectedColor === color
                          ? 'border-blue-500 ring-2 ring-blue-500/50'
                          : 'border-gray-700 hover:border-blue-500/50'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {/* Custom Color Picker */}
                <div className="pt-4 border-t border-gray-700">
                  <label className="text-sm font-semibold text-gray-400 mb-2 block">
                    Couleur Personnalisée:
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-16 h-12 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'engraving' && enableEngraving && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h4 className="text-sm font-semibold text-gray-400 mb-3">
                  Gravure 3D Texte:
                </h4>
                <input
                  type="text"
                  value={engravingText}
                  onChange={(e) => setEngravingText(e.target.value)}
                  placeholder="Entrez votre texte (max 20 caractères)..."
                  maxLength={20}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-2">Police</label>
                    <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
                      <option>Arial</option>
                      <option>Helvetica</option>
                      <option>Times New Roman</option>
                      <option>Courier New</option>
                      <option>Georgia</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-2">Profondeur</label>
                    <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
                      <option>Shallow (0.5mm)</option>
                      <option>Medium (1.0mm)</option>
                      <option>Deep (2.0mm)</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-400 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Le texte sera gravé en 3D sur le modèle avec extrusion réelle
                    </span>
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'size' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h4 className="text-sm font-semibold text-gray-400 mb-3">
                  Dimensions (cm):
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-2">
                      Largeur: <span className="text-white font-mono">100 cm</span>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      defaultValue="100"
                      className="w-full accent-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-2">
                      Hauteur: <span className="text-white font-mono">100 cm</span>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      defaultValue="100"
                      className="w-full accent-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-2">
                      Profondeur: <span className="text-white font-mono">50 cm</span>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      defaultValue="50"
                      className="w-full accent-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700 flex items-center justify-between">
                  <span className="text-sm text-gray-400">Volume:</span>
                  <span className="text-white font-bold">0.5 m³</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <Button
              onClick={() => exportModel('glb')}
              variant="outline"
              className="border-blue-500/50 hover:bg-blue-500/10"
            >
              <Download className="mr-2 w-4 h-4" />
              GLB
            </Button>

            <Button
              onClick={() => exportModel('usdz')}
              variant="outline"
              className="border-purple-500/50 hover:bg-purple-500/10"
            >
              <Camera className="mr-2 w-4 h-4" />
              USDZ
            </Button>

            <Button
              onClick={() => exportModel('share')}
              variant="outline"
              className="border-green-500/50 hover:bg-green-500/10"
            >
              <Share2 className="mr-2 w-4 h-4" />
              Partager
            </Button>

            <Button
              onClick={() => exportModel('print')}
              variant="outline"
              className="border-pink-500/50 hover:bg-pink-500/10"
            >
              <Zap className="mr-2 w-4 h-4" />
              Print 4K
            </Button>
          </div>
        </div>
      </Card>

      {/* Tech Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gray-900/50 border-blue-500/20 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Three.js r160</h4>
              <p className="text-xs text-gray-400">WebGL 2.0</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Rendu 3D temps réel avec PBR materials et IBL lighting
          </p>
        </Card>

        <Card className="bg-gray-900/50 border-purple-500/20 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">PBR Materials</h4>
              <p className="text-xs text-gray-400">Photo-réaliste</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Metalness, roughness, normal maps pour réalisme maximal
          </p>
        </Card>

        <Card className="bg-gray-900/50 border-green-500/20 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Performance</h4>
              <p className="text-xs text-gray-400">Optimisé GPU</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            60 FPS desktop, 30 FPS mobile avec LODs adaptatifs
          </p>
        </Card>
      </div>

      {/* Usage Example */}
      <Card className="bg-gray-900/50 border-blue-500/20 p-6">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          Intégration Code:
        </h4>
        <div className="bg-black/50 rounded-lg p-4 font-mono text-xs text-gray-300 overflow-x-auto">
          <pre>{`import { Configurator3D } from '@luneo/optimization';

const config = new Configurator3D({
  container: '#viewer',
  modelUrl: '/models/product.glb',
  material: '${selectedMaterial}',
  color: '${selectedColor}',
  engraving: '${engravingText || 'Your Text'}'
});

// Export
const glb = await config.exportGLB();
const usdz = await config.exportUSDZ();
const print = await config.exportPrintReady({ dpi: 300 });`}</pre>
        </div>
      </Card>
    </div>
  );
}

// Optimisation avec React.memo pour éviter les re-renders inutiles
export default memo(Configurator3DDemo);

