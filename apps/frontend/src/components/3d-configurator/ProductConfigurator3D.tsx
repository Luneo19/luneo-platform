'use client';

import React, { useRef, useEffect, useState, Suspense, memo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera, useGLTF, Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Download, Camera, Maximize2, RotateCcw, Palette, Box, Type, Save } from 'lucide-react';
import { api } from '@/lib/api/client';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useI18n } from '@/i18n/useI18n';

interface ProductConfigurator3DProps {
  /** Configuration id (backend uses :id in path) */
  productId: string;
  /** Project id for backend GET configurations/:id?projectId= */
  projectId?: string | null;
  modelUrl: string;
  onSave?: (configuration: Record<string, unknown>) => void;
  className?: string;
}

interface Model3DProps {
  url: string;
  selectedMaterial?: string;
  selectedColor?: string;
  engravingText?: string;
  engravingFont?: string;
  engravingColor?: string;
  onLoad?: () => void;
}

const MATERIAL_CONFIGS: Record<string, { metalness: number; roughness: number }> = {
  leather: { metalness: 0.1, roughness: 0.85 },
  fabric: { metalness: 0.05, roughness: 0.9 },
  metal: { metalness: 0.95, roughness: 0.2 },
  plastic: { metalness: 0.2, roughness: 0.7 },
  wood: { metalness: 0.05, roughness: 0.8 },
  glass: { metalness: 0.1, roughness: 0.05 },
  gold: { metalness: 1.0, roughness: 0.15 },
  silver: { metalness: 0.95, roughness: 0.2 },
  rose_gold: { metalness: 0.95, roughness: 0.18 },
};

// Three.js font URL for 3D text engraving
const FONT_URLS: Record<string, string> = {
  helvetiker: 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/fonts/helvetiker_regular.typeface.json',
  helvetiker_bold: 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/fonts/helvetiker_bold.typeface.json',
  optimer: 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/fonts/optimer_regular.typeface.json',
  gentilis: 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/fonts/gentilis_regular.typeface.json',
};

const FONT_OPTIONS = [
  { value: 'helvetiker', label: 'Helvetiker' },
  { value: 'helvetiker_bold', label: 'Helvetiker Bold' },
  { value: 'optimer', label: 'Optimer' },
  { value: 'gentilis', label: 'Gentilis' },
];

function Model3D({ url, selectedMaterial, selectedColor, engravingText, engravingFont, engravingColor, onLoad }: Model3DProps) {
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
      if (!config) return;

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
      modelRef.current.rotation.y += 0.001;
    }
  });

  const fontUrl = FONT_URLS[engravingFont || 'helvetiker'] || FONT_URLS['helvetiker'];

  return (
    <group ref={modelRef}>
      <primitive object={scene} />
      {/* Real 3D Text engraving using drei Text3D */}
      {engravingText && engravingText.trim() && (
        <Center position={[0, 0.5, 0.55]}>
          <Text3D
            font={fontUrl}
            size={0.08}
            height={0.01}
            curveSegments={12}
            bevelEnabled
            bevelThickness={0.002}
            bevelSize={0.001}
            bevelSegments={3}
          >
            {engravingText}
            <meshStandardMaterial
              color={engravingColor || '#000000'}
              metalness={0.7}
              roughness={0.3}
            />
          </Text3D>
        </Center>
      )}
    </group>
  );
}

// Default fallback options (names are translated via i18n in render)
const DEFAULT_MATERIALS = [
  { id: 'leather', color: '#8B4513' },
  { id: 'fabric', color: '#4169E1' },
  { id: 'metal', color: '#C0C0C0' },
  { id: 'gold', color: '#FFD700' },
  { id: 'silver', color: '#C0C0C0' },
  { id: 'rose_gold', color: '#B76E79' },
  { id: 'wood', color: '#DEB887' },
  { id: 'glass', color: '#E8E8E8' },
];

const DEFAULT_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#8B4513', '#C0C0C0',
  '#FFD700', '#E5E4E2', '#B87333', '#4169E1', '#DEB887',
];

function ProductConfigurator3D({
  productId,
  projectId,
  modelUrl,
  onSave,
  className = '',
}: ProductConfigurator3DProps) {
  const { t } = useI18n();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('metal');
  const [selectedColor, setSelectedColor] = useState<string>('#C0C0C0');
  const [selectedPart, setSelectedPart] = useState<string>('');
  const [engravingText, setEngravingText] = useState<string>('');
  const [engravingFont, setEngravingFont] = useState<string>('helvetiker');
  const [engravingColor, setEngravingColor] = useState<string>('#000000');
  const [isSaving, setIsSaving] = useState(false);
  const [materialOptions, setMaterialOptions] = useState<Array<{ id: string; name?: string; color: string }>>(DEFAULT_MATERIALS);
  const [colorOptions, setColorOptions] = useState(DEFAULT_COLORS);

  // Load configuration options from backend: GET configurations/:id?projectId= (backend returns options in config)
  useEffect(() => {
    if (!projectId || !productId) return;
    async function loadOptions() {
      try {
        const res = await api.get<{ options?: Array<{ type?: string; name?: string; label?: string }>; materials?: unknown[]; colors?: unknown[] }>(
          `/api/v1/configurator-3d/configurations/${productId}`,
          { params: { projectId } }
        );
        const data = res as Record<string, unknown>;
        if (data?.materials && Array.isArray(data.materials) && data.materials.length > 0) {
          setMaterialOptions(data.materials as Array<{ id: string; name?: string; color: string }>);
        }
        if (data?.colors && Array.isArray(data.colors) && data.colors.length > 0) {
          setColorOptions(data.colors as string[]);
        }
        logger.info('3D configurator options loaded from API', { productId, projectId });
      } catch {
        logger.info('Using default 3D configurator options', { productId });
      }
    }
    loadOptions();
  }, [productId, projectId]);

  const handleModelLoad = useCallback(() => {
    setLoading(false);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const configuration = {
        productId,
        material: selectedMaterial,
        color: selectedColor,
        part: selectedPart,
        engraving: engravingText,
        engravingFont,
        engravingColor,
      };

      if (onSave) {
        onSave(configuration);
      }

      await api.post('/api/v1/configurator-3d/sessions', {
        configurationId: productId,
        selectedOptions: configuration,
      });
      logger.info('Configuration saved', { productId });
    } catch (error) {
      logger.error('Error saving configuration', {
        error,
        productId,
        message: getErrorDisplayMessage(error),
      });
    } finally {
      setIsSaving(false);
    }
  }, [productId, selectedMaterial, selectedColor, selectedPart, engravingText, engravingFont, engravingColor, onSave]);

  const handleScreenshot = useCallback(() => {
    const canvas = canvasContainerRef.current?.querySelector('canvas');
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `product-${productId}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  }, [productId]);

  const handleReset = useCallback(() => {
    setSelectedMaterial('metal');
    setSelectedColor('#C0C0C0');
    setSelectedPart('');
    setEngravingText('');
    setEngravingFont('helvetiker');
    setEngravingColor('#000000');
  }, []);

  return (
    <div className={`flex h-full bg-gradient-to-br from-gray-50 to-gray-100 ${className}`}>
      {/* 3D Viewer */}
      <div className="flex-1 relative" ref={canvasContainerRef}>
        <Canvas
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
              engravingText={engravingText}
              engravingFont={engravingFont}
              engravingColor={engravingColor}
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
              <p className="text-white font-medium">{t('configurator3d.loading')}</p>
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
            title={t('configurator3d.screenshot')}
          >
            <Camera className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            className="bg-white/90 backdrop-blur"
            title={t('configurator3d.reset')}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-white/90 backdrop-blur"
            title={t('configurator3d.fullscreen')}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Right Panel - Configuration */}
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('configurator3d.configureProduct')}</h2>
            <p className="text-sm text-gray-600 mt-1">{t('configurator3d.customizeProduct')}</p>
          </div>

          <Tabs defaultValue="materials" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="materials" className="text-xs">
                <Box className="w-3 h-3 mr-1" />
                {t('configurator3d.materials')}
              </TabsTrigger>
              <TabsTrigger value="colors" className="text-xs">
                <Palette className="w-3 h-3 mr-1" />
                {t('configurator3d.colors')}
              </TabsTrigger>
              <TabsTrigger value="parts" className="text-xs">
                <Box className="w-3 h-3 mr-1" />
                {t('configurator3d.parts')}
              </TabsTrigger>
              <TabsTrigger value="text" className="text-xs">
                <Type className="w-3 h-3 mr-1" />
                {t('configurator3d.textEngraving')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="materials" className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">{t('configurator3d.selectMaterial')}</h3>
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
                      <p className="text-xs font-medium text-center">
                        {t(`configurator3d.materialNames.${material.id}` as 'configurator3d.materialNames.leather') || material.name || material.id}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="colors" className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">{t('configurator3d.selectColor')}</h3>
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
                  <label className="text-xs font-medium text-gray-700">{t('configurator3d.customColor')}</label>
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
                <h3 className="text-sm font-semibold mb-3">{t('configurator3d.customizeParts')}</h3>
                <p className="text-xs text-gray-600 mb-4">
                  {t('configurator3d.customizePartsDesc')}
                </p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    {t('configurator3d.changeStrap')}
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    {t('configurator3d.changeBuckle')}
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    {t('configurator3d.addCharm')}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-3">{t('configurator3d.textEngraving')}</h3>
                <input
                  type="text"
                  placeholder={t('configurator3d.engravingPlaceholderText')}
                  value={engravingText}
                  onChange={(e) => setEngravingText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  maxLength={30}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('configurator3d.engravingChars', { count: engravingText.length })}
                </p>

                <div className="mt-4 space-y-2">
                  <label className="text-xs font-medium text-gray-700">{t('configurator3d.font3d')}</label>
                  <select
                    value={engravingFont}
                    onChange={(e) => setEngravingFont(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4 space-y-2">
                  <label className="text-xs font-medium text-gray-700">{t('configurator3d.engravingColor')}</label>
                  <div className="flex gap-2 flex-wrap">
                    {['#000000', '#FFFFFF', '#FFD700', '#C0C0C0', '#B87333'].map((c) => (
                      <button
                        key={c}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          engravingColor === c ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: c }}
                        onClick={() => setEngravingColor(c)}
                        title={c}
                      />
                    ))}
                    <input
                      type="color"
                      value={engravingColor}
                      onChange={(e) => setEngravingColor(e.target.value)}
                      className="w-8 h-8 rounded-full cursor-pointer border border-gray-300"
                    />
                  </div>
                </div>

                {engravingText && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                    {t('configurator3d.engravingPreviewNote')}
                  </div>
                )}
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
                {t('configurator3d.saving')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t('configurator3d.saveButton')}
              </>
            )}
          </Button>

          {/* Configuration Summary */}
          <Card className="p-4 bg-gray-50">
            <h3 className="text-sm font-semibold mb-2">{t('configurator3d.configuration')}</h3>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>{t('configurator3d.materialLabel')}:</span>
                <span className="font-medium text-gray-900 capitalize">{selectedMaterial}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('configurator3d.colorLabel')}:</span>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <span className="font-medium text-gray-900">{selectedColor}</span>
                </div>
              </div>
              {engravingText && (
                <>
                  <div className="flex justify-between">
                    <span>{t('configurator3d.engravingLabel')}:</span>
                    <span className="font-medium text-gray-900 truncate max-w-[120px]">{engravingText}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('configurator3d.fontLabel')}:</span>
                    <span className="font-medium text-gray-900 capitalize">{engravingFont}</span>
                  </div>
                </>
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
