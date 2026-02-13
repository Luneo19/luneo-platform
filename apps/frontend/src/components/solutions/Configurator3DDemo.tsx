'use client';

import React, { useState, useEffect, useRef, memo, useCallback, useMemo, Suspense } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
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
  Loader2,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { logger } from '@/lib/logger';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Text3D } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as THREE from 'three';
import html2canvas from 'html2canvas';
// BUNDLE-01: jsPDF importé dynamiquement (~200KB) - voir handleExportPDF()
import { ThreeDErrorBoundary } from '@/components/ErrorBoundary';
import { exportToGLB, exportToPNG, disposeThreeJSResources, downloadBlob } from '@/lib/utils/export-3d';

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

// 3D Model Component with ref for export
const Model3D = React.forwardRef<THREE.Group, {
  material: Material;
  color: string;
  engravingText: string;
  isExploded: boolean;
  showWireframe: boolean;
  modelUrl: string;
}>(({ material, color, engravingText, isExploded, showWireframe, modelUrl }, ref) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(true);
  const textRef = useRef<THREE.Mesh>(null);

  // Expose model via ref
  useEffect(() => {
    if (ref && model) {
      if (typeof ref === 'function') {
        ref(model);
      } else {
        ref.current = model;
      }
    }
  }, [model, ref]);

  // Load model
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        setModel(gltf.scene.clone());
        setLoading(false);
      },
      undefined,
      (error) => {
        logger.error('Model loading error', { error, modelUrl });
        setLoading(false);
        setModel(null);
      }
    );
  }, [modelUrl]);

  // Rotate model
  useFrame((state, delta) => {
    if (model) {
      model.rotation.y += delta * 0.5;
    }
  });

  // Create material
  const materialObj = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: color || material.color,
      metalness: material.metalness,
      roughness: material.roughness,
    });
  }, [material, color]);

  // Update material when it changes
  useEffect(() => {
    if (materialObj && model) {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = materialObj.clone();
          child.castShadow = true;
          child.receiveShadow = true;
          if (showWireframe) {
            child.material.wireframe = true;
          } else {
            child.material.wireframe = false;
          }
        }
      });
    }
  }, [materialObj, model, showWireframe]);

  if (loading) {
    return (
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#3B82F6" />
      </mesh>
    );
  }

  if (!model) {
    // Fallback: Create a simple box with material
    return (
      <>
        <mesh ref={meshRef} position={isExploded ? [0.2, 0.2, 0.2] : [0, 0, 0]}>
          <boxGeometry args={[2, 2, 2]} />
          <primitive object={materialObj} attach="material" />
        </mesh>
        {engravingText && (
          <Text3D
            ref={textRef}
            font="/fonts/helvetiker_bold.typeface.json"
            size={0.3}
            height={0.1}
            position={[0, 0, 1.1]}
            material={new THREE.MeshStandardMaterial({ color: '#FFD700' })}
          >
            {engravingText}
          </Text3D>
        )}
      </>
    );
  }

  return (
    <>
      <primitive
        object={model}
        position={isExploded ? [0.2, 0.2, 0.2] : [0, 0, 0]}
        scale={1}
      />
      {engravingText && (
        <Text3D
          ref={textRef}
          font="/fonts/helvetiker_bold.typeface.json"
          size={0.3}
          height={0.1}
          position={[0, 0, 1.1]}
          material={new THREE.MeshStandardMaterial({ color: '#FFD700' })}
        >
          {engravingText}
        </Text3D>
      )}
    </>
  );
});

Model3D.displayName = 'Model3D';

// Scene Component with export capability
function Scene3D({
  material,
  color,
  engravingText,
  isExploded,
  showGrid,
  showWireframe,
  modelUrl,
  onSceneReady,
}: {
  material: Material;
  color: string;
  engravingText: string;
  isExploded: boolean;
  showGrid: boolean;
  showWireframe: boolean;
  modelUrl: string;
  onSceneReady?: (scene: THREE.Scene, model: THREE.Group | null) => void;
}) {
  const modelRef = useRef<THREE.Group>(null);
  const sceneRef = useThree((state) => state.scene);

  useEffect(() => {
    if (onSceneReady && sceneRef) {
      onSceneReady(sceneRef, modelRef.current);
    }
  }, [sceneRef, onSceneReady]);

  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      camera={{ position: [5, 5, 5], fov: 50 }}
    >
      <PerspectiveCamera makeDefault position={[5, 5, 5]} />
      <OrbitControls enableDamping dampingFactor={0.05} />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />
      
      {/* Environment */}
      <Environment preset="sunset" />
      
      {/* Grid */}
      {showGrid && (
        <gridHelper args={[10, 10, '#888888', '#444444']} />
      )}
      
      {/* Model */}
      <Suspense
        fallback={
          <mesh>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial color="#3B82F6" />
          </mesh>
        }
      >
        <Model3D
          ref={modelRef}
          material={material}
          color={color}
          engravingText={engravingText}
          isExploded={isExploded}
          showWireframe={showWireframe}
          modelUrl={modelUrl}
        />
      </Suspense>
    </Canvas>
  );
}

function Configurator3DDemo({
  modelUrl = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/models/gltf/Duck/glTF-Binary/Duck.glb',
  enableExplodedView = true,
  enableEngraving = true,
  onConfigChange,
}: Configurator3DDemoProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
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
  const [isExporting, setIsExporting] = useState(false);

  const materials: Material[] = [
    { id: 'metal', name: 'Métal Brossé', color: '#C0C0C0', metalness: 1.0, roughness: 0.3 },
    { id: 'gold', name: 'Or 18K', color: '#FFD700', metalness: 1.0, roughness: 0.2 },
    { id: 'wood', name: 'Bois Chêne', color: '#8B4513', metalness: 0.0, roughness: 0.8 },
    { id: 'leather', name: 'Cuir', color: '#654321', metalness: 0.0, roughness: 0.9 },
    { id: 'carbon', name: 'Fibre Carbone', color: '#1a1a1a', metalness: 0.8, roughness: 0.1 },
    { id: 'glass', name: 'Verre', color: '#E8F4F8', metalness: 0.0, roughness: 0.0 },
  ];

  const colors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444',
    '#6366F1', '#14B8A6', '#F97316', '#A855F7', '#06B6D4', '#84CC16',
  ];

  const tabs = [
    { id: 'material', name: 'Matériau', icon: Layers },
    { id: 'color', name: 'Couleur', icon: Palette },
    { id: 'engraving', name: 'Gravure', icon: Type },
    { id: 'size', name: 'Dimensions', icon: Maximize },
  ];

  const currentMaterial = useMemo(
    () => materials.find((m) => m.id === selectedMaterial) || materials[0],
    [selectedMaterial]
  );

  // Demo simulation - replace with real API in production. Initialize 3D engine.
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

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

  // Export GLB (utilise utilitaire export-3d)
  const exportGLB = useCallback(async () => {
    if (!sceneRef.current || !modelRef.current) {
      logger.warn('No scene or model to export');
      return;
    }

    setIsExporting(true);
    try {
      const modelToExport = modelRef.current.clone();
      
      // Apply current material to exported model
      const materialObj = new THREE.MeshStandardMaterial({
        color: selectedColor || currentMaterial.color,
        metalness: currentMaterial.metalness,
        roughness: currentMaterial.roughness,
      });

      modelToExport.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = materialObj;
        }
      });

      // Use utility function for export
      const blob = await exportToGLB(modelToExport, {
        format: 'glb',
        includeTextures: true,
        includeAnimations: false,
      });

      downloadBlob(blob, `luneo-3d-config-${Date.now()}.glb`);
      logger.info('GLB exported successfully');
    } catch (error) {
      logger.error('GLB export error', { error });
    } finally {
      setIsExporting(false);
    }
  }, [currentMaterial, selectedColor]);

  // Export USDZ (via API or conversion)
  const exportUSDZ = useCallback(async () => {
    setIsExporting(true);
    try {
      // First export as GLB
      await exportGLB();
      
      // For USDZ, we need to use an API or conversion service
      // For demo purposes, show a message
      logger.info('USDZ export - Use AR Quick Look on iOS or convert GLB to USDZ');
      alert('Pour exporter en USDZ, utilisez l\'AR Quick Look sur iOS ou convertissez le GLB via notre API.');
    } catch (error) {
      logger.error('USDZ export error', { error });
    } finally {
      setIsExporting(false);
    }
  }, [exportGLB]);

  // Export PNG 4K
  const exportPNG = useCallback(async () => {
    if (!canvasRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = canvasRef.current.querySelector('canvas');
      if (!canvas) {
        logger.warn('No canvas found for PNG export');
        return;
      }

      // Render at 4K resolution
      const width = 3840;
      const height = 2160;
      const dataURL = canvas.toDataURL('image/png', 1.0);
      
      const img = new Image();
      img.onload = () => {
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = width;
        exportCanvas.height = height;
        const ctx = exportCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          exportCanvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `luneo-3d-config-${Date.now()}.png`;
              a.click();
              URL.revokeObjectURL(url);
            }
          }, 'image/png', 1.0);
        }
      };
      img.src = dataURL;
    } catch (error) {
      logger.error('PNG export error', { error });
    } finally {
      setIsExporting(false);
    }
  }, []);

  /**
   * BUNDLE-01: Export PDF 300DPI avec jsPDF chargé dynamiquement
   * Économie ~200KB sur le bundle initial
   */
  const exportPDF = useCallback(async () => {
    if (!canvasRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = canvasRef.current.querySelector('canvas');
      if (!canvas) return;

      // BUNDLE-01: Dynamic import de jsPDF
      const { default: jsPDF } = await import('jspdf');
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [297, 210], // A4 landscape
      });

      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`luneo-3d-config-${Date.now()}.pdf`);
      logger.info('PDF exported successfully');
    } catch (error) {
      logger.error('PDF export error', { error });
    } finally {
      setIsExporting(false);
    }
  }, []);

  // View in AR (iOS Quick Look)
  const viewInAR = useCallback(async () => {
    try {
      // Export GLB first
      await exportGLB();
      
      // For iOS, create a USDZ link
      // For demo, show instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        alert('Sur iOS, téléchargez le GLB et utilisez AR Quick Look pour visualiser en AR.');
      } else {
        alert('Pour visualiser en AR:\n- iOS: Utilisez AR Quick Look avec USDZ\n- Android: Utilisez Scene Viewer avec GLB\n- Web: Utilisez WebXR (Chrome/Edge)');
      }
    } catch (error) {
      logger.error('AR view error', { error });
    }
  }, [exportGLB]);

  const exportModel = useCallback((format: string) => {
    switch (format) {
      case 'glb':
        exportGLB();
        break;
      case 'usdz':
        exportUSDZ();
        break;
      case 'png':
        exportPNG();
        break;
      case 'pdf':
        exportPDF();
        break;
      case 'ar':
        viewInAR();
        break;
      default:
        logger.warn('Unknown export format', { format });
    }
  }, [exportGLB, exportUSDZ, exportPNG, exportPDF, viewInAR]);

  const handleSceneReady = useCallback((scene: THREE.Scene, model: THREE.Group | null) => {
    sceneRef.current = scene;
    modelRef.current = model;
  }, []);

  // Cleanup Three.js resources on unmount
  useEffect(() => {
    return () => {
      if (modelRef.current) {
        try {
          disposeThreeJSResources(modelRef.current);
        } catch (error) {
          logger.warn('Error disposing Three.js resources', { error });
        }
        modelRef.current = null;
      }
      if (sceneRef.current) {
        sceneRef.current = null;
      }
    };
  }, []);

  return (
    <ThreeDErrorBoundary componentName="Configurator3DDemo">
      <div className="space-y-6">
      <Card className="bg-gray-900/50 border-blue-500/20 overflow-hidden">
        {/* 3D Viewport */}
        <div className="relative aspect-square bg-gradient-to-br from-blue-900/20 to-purple-900/20">
          <div ref={canvasRef} className="w-full h-full">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-16 h-16 text-blue-400 animate-spin mx-auto mb-4" />
                  <p className="text-white font-medium">Chargement modèle 3D...</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Initialisation Three.js + WebGL
                  </p>
                </div>
              </div>
            ) : (
              <Scene3D
                material={currentMaterial}
                color={selectedColor}
                engravingText={engravingText}
                isExploded={isExploded}
                showGrid={showGrid}
                showWireframe={showWireframe}
                modelUrl={modelUrl}
                onSceneReady={handleSceneReady}
              />
            )}
          </div>

          {/* Viewport Controls */}
          {!isLoading && (
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
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

              <button
                onClick={() => exportModel('ar')}
                className="w-10 h-10 bg-cyan-500/30 backdrop-blur-sm border border-cyan-500/30 rounded-lg flex items-center justify-center hover:bg-black/80 transition-colors"
                title="View in AR"
              >
                <Smartphone className="w-5 h-5 text-white" />
              </button>
            </div>
          )}

          {/* Stats Overlay */}
          {!isLoading && (
            <div className="absolute bottom-4 left-4 space-y-2 z-10">
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
              <motion
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
              </motion>
            )}

            {activeTab === 'color' && (
              <motion
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h4 className="text-sm font-semibold text-gray-400 mb-3">
                  Sélectionnez une Couleur:
                </h4>
                <div className="grid grid-cols-6 gap-3">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-12 h-12 rounded-lg border-2 transition-all ${
                        selectedColor === color
                          ? 'border-white scale-110'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="mt-4">
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-full h-12 rounded-lg cursor-pointer"
                  />
                </div>
              </motion>
            )}

            {activeTab === 'engraving' && enableEngraving && (
              <motion
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h4 className="text-sm font-semibold text-gray-400 mb-3">
                  Texte de Gravure:
                </h4>
                <input
                  type="text"
                  value={engravingText}
                  onChange={(e) => setEngravingText(e.target.value)}
                  placeholder="Ex: LUNEO 2024"
                  maxLength={20}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
                <p className="text-xs text-gray-400">
                  Le texte sera gravé en 3D sur le produit
                </p>
              </motion>
            )}

            {activeTab === 'size' && (
              <motion
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h4 className="text-sm font-semibold text-gray-400 mb-3">
                  Dimensions:
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-400">10cm</p>
                    <p className="text-xs text-gray-400 mt-1">Largeur</p>
                  </div>
                  <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-400">8cm</p>
                    <p className="text-xs text-gray-400 mt-1">Hauteur</p>
                  </div>
                  <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-400">5cm</p>
                    <p className="text-xs text-gray-400 mt-1">Profondeur</p>
                  </div>
                </div>
              </motion>
            )}
          </div>
        </div>
      </Card>

      {/* Export Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Button
          onClick={() => exportModel('glb')}
          disabled={isExporting}
          variant="outline"
          className="border-blue-500/50 hover:bg-blue-500/10"
        >
          {isExporting ? (
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
          ) : (
            <Download className="mr-2 w-4 h-4" />
          )}
          GLB
        </Button>
        <Button
          onClick={() => exportModel('usdz')}
          disabled={isExporting}
          variant="outline"
          className="border-purple-500/50 hover:bg-purple-500/10"
        >
          {isExporting ? (
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
          ) : (
            <Download className="mr-2 w-4 h-4" />
          )}
          USDZ
        </Button>
        <Button
          onClick={() => exportModel('png')}
          disabled={isExporting}
          variant="outline"
          className="border-green-500/50 hover:bg-green-500/10"
        >
          {isExporting ? (
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
          ) : (
            <Camera className="mr-2 w-4 h-4" />
          )}
          PNG 4K
        </Button>
        <Button
          onClick={() => exportModel('pdf')}
          disabled={isExporting}
          variant="outline"
          className="border-orange-500/50 hover:bg-orange-500/10"
        >
          {isExporting ? (
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
          ) : (
            <Download className="mr-2 w-4 h-4" />
          )}
          PDF 300DPI
        </Button>
        <Button
          onClick={() => exportModel('ar')}
          disabled={isExporting}
          variant="outline"
          className="border-cyan-500/50 hover:bg-cyan-500/10"
        >
          {isExporting ? (
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
          ) : (
            <Smartphone className="mr-2 w-4 h-4" />
          )}
          AR
        </Button>
      </div>
    </div>
    </ThreeDErrorBoundary>
  );
}

export default memo(Configurator3DDemo);
