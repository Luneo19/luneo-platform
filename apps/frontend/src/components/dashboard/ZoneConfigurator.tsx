/**
 * ★★★ COMPOSANT - CONFIGURATEUR DE ZONES ★★★
 * Interface complète pour définir les zones personnalisables sur un modèle 3D
 * - Viewer 3D interactif avec Three.js
 * - Clic sur mesh pour créer zones
 * - Configuration UV mapping
 * - Options de personnalisation
 * - Validation complète
 */

'use client';

import { useState, useCallback, useMemo, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, PerspectiveCamera, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Trash2, Plus, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { memo } from 'react';

// ========================================
// TYPES
// ========================================

interface Zone {
  id: string;
  name: string;
  description?: string;
  type: 'TEXT' | 'IMAGE' | 'PATTERN' | 'COLOR';
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  uvMinU: number;
  uvMaxU: number;
  uvMinV: number;
  uvMaxV: number;
  maxChars?: number;
  allowedFonts?: string[];
  defaultFont?: string;
  defaultColor?: string;
  defaultSize?: number;
  allowedColors?: string[];
  allowedPatterns?: string[];
  isRequired: boolean;
  order: number;
  metadata?: Record<string, any>;
}

interface ZoneConfiguratorProps {
  productId: string;
  modelUrl: string;
  onSave?: (zones: Zone[]) => void;
}

// ========================================
// COMPOSANT PRINCIPAL
// ========================================

function ZoneConfiguratorContent({ productId, modelUrl, onSave }: ZoneConfiguratorProps) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [isSelectingPosition, setIsSelectingPosition] = useState(false);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'3d' | 'uv'>('3d');
  
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);
  const controlsRef = useRef<any>(null);

  // Queries
  const { data: existingZones, isLoading } = trpc.customization.getZonesByProduct.useQuery(
    { productId },
    { enabled: !!productId }
  );

  // Mutations
  const createZone = trpc.customization.createZone.useMutation();
  const updateZone = trpc.customization.updateZone.useMutation();
  const deleteZone = trpc.customization.deleteZone.useMutation();

  // Load existing zones
  useMemo(() => {
    if (existingZones) {
      setZones(existingZones as Zone[]);
    }
  }, [existingZones]);

  const selectedZone = useMemo(
    () => zones.find((z) => z.id === selectedZoneId),
    [zones, selectedZoneId]
  );

  // ========================================
  // HANDLERS
  // ========================================

  const handleMeshClick = useCallback(
    (event: any) => {
      if (!isSelectingPosition) return;

      const point = event.point;
      const uv = event.uv;

      if (!uv) {
        logger.warn('No UV coordinates found at click point');
        return;
      }

      // Crée nouvelle zone
      const newZone: Zone = {
        id: `zone-${Date.now()}`,
        name: `Zone ${zones.length + 1}`,
        type: 'TEXT',
        positionX: point.x,
        positionY: point.y,
        positionZ: point.z,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,
        uvMinU: Math.max(0, uv.x - 0.1),
        uvMaxU: Math.min(1, uv.x + 0.1),
        uvMinV: Math.max(0, uv.y - 0.1),
        uvMaxV: Math.min(1, uv.y + 0.1),
        isRequired: false,
        order: zones.length,
      };

      setZones([...zones, newZone]);
      setSelectedZoneId(newZone.id);
      setIsSelectingPosition(false);

      logger.info('Zone created', { zoneId: newZone.id, position: point, uv });
    },
    [isSelectingPosition, zones]
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);

    try {
      // Sauvegarde toutes les zones
      const promises = zones.map((zone) => {
        if (zone.id.startsWith('zone-')) {
          // Nouvelle zone
          return createZone.mutateAsync({
            ...zone,
            productId,
          });
        } else {
          // Zone existante mise à jour
          return updateZone.mutateAsync({
            ...zone,
            id: zone.id,
          });
        }
      });

      await Promise.all(promises);

      logger.info('Zones saved successfully', { count: zones.length });
      onSave?.(zones);
    } catch (error) {
      logger.error('Error saving zones', { error });
    } finally {
      setIsSaving(false);
    }
  }, [zones, productId, createZone, updateZone, onSave]);

  const handleDelete = useCallback(
    async (zoneId: string) => {
      if (!zoneId.startsWith('zone-')) {
        // Zone existante, supprime de la DB
        await deleteZone.mutateAsync({ id: zoneId });
      }

      setZones(zones.filter((z) => z.id !== zoneId));
      if (selectedZoneId === zoneId) {
        setSelectedZoneId(null);
      }
    },
    [zones, selectedZoneId, deleteZone]
  );

  const handleUpdateZone = useCallback(
    (updates: Partial<Zone>) => {
      if (!selectedZoneId) return;

      setZones(
        zones.map((z) => (z.id === selectedZoneId ? { ...z, ...updates } : z))
      );
    },
    [zones, selectedZoneId]
  );

  // ========================================
  // RENDER
  // ========================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-screen p-6">
      {/* Viewer 3D */}
      <div className="lg:col-span-2 bg-gray-900 rounded-lg overflow-hidden relative">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 0, 5]} />
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />

            <Model3D url={modelUrl} onClick={handleMeshClick} />

            {/* Visualisation des zones */}
            {zones.map((zone) => (
              <ZoneVisualization
                key={zone.id}
                zone={zone}
                isSelected={zone.id === selectedZoneId}
                isHovered={zone.id === hoveredZoneId}
                onHover={(hovered) => setHoveredZoneId(hovered ? zone.id : null)}
                onClick={() => setSelectedZoneId(zone.id)}
              />
            ))}

            <OrbitControls
              ref={controlsRef}
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={2}
              maxDistance={10}
            />

            <Grid args={[10, 10]} cellColor="#6f6f6f" sectionColor="#9d4b4b" />
            <Environment preset="studio" />
          </Suspense>
        </Canvas>

        {/* Overlay controls */}
        <div className="absolute top-4 left-4 flex gap-2">
          <Button
            variant={isSelectingPosition ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsSelectingPosition(!isSelectingPosition)}
          >
            <Plus className="w-4 h-4 mr-2" />
            {isSelectingPosition ? 'Annuler' : 'Ajouter Zone'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === '3d' ? 'uv' : '3d')}
          >
            {viewMode === '3d' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Panneau Configuration */}
      <div className="space-y-4 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>Zones Personnalisables</CardTitle>
            <CardDescription>
              {zones.length} zone{zones.length > 1 ? 's' : ''} définie{zones.length > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Liste des zones */}
            <div className="space-y-2">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedZoneId === zone.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedZoneId(zone.id)}
                  onMouseEnter={() => setHoveredZoneId(zone.id)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{zone.name}</p>
                      <p className="text-sm text-gray-500">{zone.type}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(zone.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Formulaire zone sélectionnée */}
            {selectedZone && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Configuration Zone</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="zone-name">Nom</Label>
                    <Input
                      id="zone-name"
                      value={selectedZone.name}
                      onChange={(e) => handleUpdateZone({ name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="zone-type">Type</Label>
                    <Select
                      value={selectedZone.type}
                      onValueChange={(value) => handleUpdateZone({ type: value as Zone['type'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TEXT">Texte / Gravure</SelectItem>
                        <SelectItem value="IMAGE">Image</SelectItem>
                        <SelectItem value="PATTERN">Motif</SelectItem>
                        <SelectItem value="COLOR">Couleur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedZone.type === 'TEXT' && (
                    <>
                      <div>
                        <Label htmlFor="max-chars">Caractères max</Label>
                        <Input
                          id="max-chars"
                          type="number"
                          value={selectedZone.maxChars || 50}
                          onChange={(e) =>
                            handleUpdateZone({ maxChars: parseInt(e.target.value) || undefined })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="default-font">Police par défaut</Label>
                        <Input
                          id="default-font"
                          value={selectedZone.defaultFont || ''}
                          onChange={(e) => handleUpdateZone({ defaultFont: e.target.value })}
                          placeholder="Arial"
                        />
                      </div>

                      <div>
                        <Label htmlFor="default-color">Couleur par défaut</Label>
                        <Input
                          id="default-color"
                          type="color"
                          value={selectedZone.defaultColor || '#000000'}
                          onChange={(e) => handleUpdateZone({ defaultColor: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  {/* UV Mapping */}
                  <div className="space-y-2 pt-4 border-t">
                    <Label>UV Mapping</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">U Min</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={selectedZone.uvMinU}
                          onChange={(e) =>
                            handleUpdateZone({ uvMinU: parseFloat(e.target.value) })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">U Max</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={selectedZone.uvMaxU}
                          onChange={(e) =>
                            handleUpdateZone({ uvMaxU: parseFloat(e.target.value) })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">V Min</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={selectedZone.uvMinV}
                          onChange={(e) =>
                            handleUpdateZone({ uvMinV: parseFloat(e.target.value) })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">V Max</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={selectedZone.uvMaxV}
                          onChange={(e) =>
                            handleUpdateZone({ uvMaxV: parseFloat(e.target.value) })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bouton sauvegarder */}
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={isSaving || zones.length === 0}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder les Zones
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ========================================
// COMPOSANTS 3D
// ========================================

function Model3D({ url, onClick }: { url: string; onClick: (event: any) => void }) {
  const { scene } = useGLTF(url);

  return (
    <primitive
      object={scene}
      onClick={onClick}
      onPointerOver={(e: any) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    />
  );
}

function ZoneVisualization({
  zone,
  isSelected,
  isHovered,
  onHover,
  onClick,
}: {
  zone: Zone;
  isSelected: boolean;
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
  onClick: () => void;
}) {
  const color = isSelected ? '#3b82f6' : isHovered ? '#10b981' : '#6b7280';

  return (
    <mesh
      position={[zone.positionX, zone.positionY, zone.positionZ]}
      rotation={[zone.rotationX, zone.rotationY, zone.rotationZ]}
      scale={[zone.scaleX, zone.scaleY, zone.scaleZ]}
      onClick={onClick}
      onPointerOver={() => onHover(true)}
      onPointerOut={() => onHover(false)}
    >
      <boxGeometry args={[0.5, 0.1, 0.5]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.5}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

// ========================================
// EXPORT
// ========================================

const ZoneConfiguratorComponent = memo(ZoneConfiguratorContent);

export function ZoneConfigurator(props: ZoneConfiguratorProps) {
  return (
    <ErrorBoundary>
      <ZoneConfiguratorComponent {...props} />
    </ErrorBoundary>
  );
}

export default ZoneConfigurator;
