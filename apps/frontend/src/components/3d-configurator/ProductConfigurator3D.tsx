'use client';

import React, { useRef, useEffect, useState, Suspense, memo, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Download, Camera, Maximize2, RotateCcw, Palette, Box, Type } from 'lucide-react';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface ProductConfigurator3DProps {
  productId: string;
  modelUrl: string;
  onSave?: (configuration: Record<string, unknown>) => void;
  className?: string;
}

interface Model3DProps {
  url: string;
  selectedMaterial?: string;
  selectedColor?: string;
  onLoad?: () => void;
}

const MATERIAL_CONFIGS: Record<string, { metalness: number; roughness: number }> = {
  leather: { metalness: 0.1, roughness: 0.85 },
  fabric: { metalness: 0.05, roughness: 0.9 },
  metal: { metalness: 0.95, roughness: 0.2 },
  plastic: { metalness: 0.2, roughness: 0.7 },
  wood: { metalness: 0.05, roughness: 0.8 },
};

function Model3D({ url, selectedMaterial, selectedColor, onLoad }: Model3DProps) {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (scene && onLoad) {
      onLoad();
    }
  }, [scene, onLoad]);

  useEffect(() => {
    if (scene && selectedColor) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.color.set(selectedColor);
          }
        }
      });
    }
  }, [scene, selectedColor]);

  useEffect(() => {
    if (scene && selectedMaterial) {
      const config = MATERIAL_CONFIGS[selectedMaterial];
      if (!config) {
        return;
      }

      scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.metalness = config.metalness;
          child.material.roughness = config.roughness;
        }
      });
    }
  }, [scene, selectedMaterial]);

  useFrame(() => {
    if (modelRef.current) {
      // Subtle rotation animation
      modelRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={modelRef}>
      <primitive object={scene} />
    </group>
  );
}

function ProductConfigurator3D({
  productId,
  modelUrl,
  onSave,
  className = '',
}: ProductConfigurator3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('leather');
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [selectedPart, setSelectedPart] = useState<string>('');
  const [engravingText, setEngravingText] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const materialOptions = [
    { id: 'leather', name: 'Leather', color: '#8B4513' },
    { id: 'fabric', name: 'Fabric', color: '#4169E1' },
    { id: 'metal', name: 'Metal', color: '#C0C0C0' },
    { id: 'plastic', name: 'Plastic', color: '#FFFFFF' },
    { id: 'wood', name: 'Wood', color: '#DEB887' },
  ];

  const colorOptions = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#8B4513', '#C0C0C0',
    '#FFD700', '#E5E4E2', '#B87333', '#4169E1', '#DEB887',
  ];

  const handleModelLoad = () => {
    setLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const configuration = {
        productId,
        material: selectedMaterial,
        color: selectedColor,
        part: selectedPart,
        engraving: engravingText,
      };

      if (onSave) {
        onSave(configuration);
      }

      // Save to API
      await api.post('/api/v1/configurator-3d/configurations', configuration);
      logger.info('Configuration saved', {
        productId,
        configurationKeys: Object.keys(configuration),
      });
    } catch (error) {
      logger.error('Error saving configuration', {
        error,
        productId,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleScreenshot = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `product-${productId}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const handleReset = () => {
    setSelectedMaterial('leather');
    setSelectedColor('#000000');
    setSelectedPart('');
    setEngravingText('');
  };

  return (
    <div className={`flex h-full bg-gradient-to-br from-gray-50 to-gray-100 ${className}`}>
      {/* 3D Viewer */}
      <div className="flex-1 relative">
        <Canvas
          ref={canvasRef}
          shadows
          camera={{ position: [0, 1.5, 3], fov: 45 }}
          gl={{ preserveDrawingBuffer: true, antialias: true }}
        >
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 1.5, 3]} />
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              minDistance={1}
              maxDistance={10}
              maxPolarAngle={Math.PI / 2}
            />
            
            <Environment preset="studio" />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
            <spotLight position={[-5, 5, 0]} intensity={0.5} />
            <spotLight position={[5, 5, 0]} intensity={0.5} />
            
            <Model3D
              url={modelUrl}
              selectedMaterial={selectedMaterial}
              selectedColor={selectedColor}
              onLoad={handleModelLoad}
            />
            
            <ContactShadows
              position={[0, -0.8, 0]}
              opacity={0.4}
              scale={10}
              blur={2.5}
              far={4}
            />
          </Suspense>
        </Canvas>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
              <p className="text-white font-medium">Loading 3D Model...</p>
            </div>
          </div>
        )}

        {/* Top Controls */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleScreenshot}
            className="bg-white/90 backdrop-blur"
            title="Screenshot"
          >
            <Camera className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            className="bg-white/90 backdrop-blur"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-white/90 backdrop-blur"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Right Panel - Configuration */}
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Configure Product</h2>
            <p className="text-sm text-gray-600 mt-1">Customize your 3D product</p>
          </div>

          <Tabs defaultValue="materials" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="materials" className="text-xs">
                <Box className="w-3 h-3 mr-1" />
                Material
              </TabsTrigger>
              <TabsTrigger value="colors" className="text-xs">
                <Palette className="w-3 h-3 mr-1" />
                Colors
              </TabsTrigger>
              <TabsTrigger value="parts" className="text-xs">
                <Box className="w-3 h-3 mr-1" />
                Parts
              </TabsTrigger>
              <TabsTrigger value="text" className="text-xs">
                <Type className="w-3 h-3 mr-1" />
                Text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="materials" className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">Select Material</h3>
                <div className="grid grid-cols-2 gap-2">
                  {materialOptions.map((material) => (
                    <Card
                      key={material.id}
                      className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                        selectedMaterial === material.id
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedMaterial(material.id)}
                    >
                      <div
                        className="w-full h-12 rounded mb-2"
                        style={{ backgroundColor: material.color }}
                      />
                      <p className="text-xs font-medium text-center">{material.name}</p>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="colors" className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">Select Color</h3>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                        selectedColor === color
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                      title={color}
                    />
                  ))}
                </div>
                <div className="mt-4">
                  <label className="text-xs font-medium text-gray-700">Custom Color</label>
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-full h-10 mt-1 rounded border border-gray-300 cursor-pointer"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="parts" className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">Customize Parts</h3>
                <p className="text-xs text-gray-600 mb-4">
                  Select different parts to customize your product
                </p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    Change Strap
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Change Buckle
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Add Charm
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">Engrave Text</h3>
                <input
                  type="text"
                  placeholder="Enter text to engrave..."
                  value={engravingText}
                  onChange={(e) => setEngravingText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {engravingText.length}/20 characters
                </p>
                <div className="mt-4 space-y-2">
                  <label className="text-xs font-medium text-gray-700">Font</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option>Arial</option>
                    <option>Helvetica</option>
                    <option>Times New Roman</option>
                    <option>Courier</option>
                  </select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
            size="lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>

          {/* Configuration Summary */}
          <Card className="p-4 bg-gray-50">
            <h3 className="text-sm font-semibold mb-2">Configuration</h3>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Material:</span>
                <span className="font-medium text-gray-900 capitalize">{selectedMaterial}</span>
              </div>
              <div className="flex justify-between">
                <span>Color:</span>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <span className="font-medium text-gray-900">{selectedColor}</span>
                </div>
              </div>
              {engravingText && (
                <div className="flex justify-between">
                  <span>Engraving:</span>
                  <span className="font-medium text-gray-900">{engravingText}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Optimisation avec React.memo pour éviter les re-renders inutiles
const ProductConfigurator3DMemo = memo(ProductConfigurator3D);

export default function ProductConfigurator3DWrapper(props: ProductConfigurator3DProps) {
  return (
    <ErrorBoundary componentName="ProductConfigurator3D">
      <ProductConfigurator3DMemo {...props} />
    </ErrorBoundary>
  );
}
