'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Eraser, Brush } from 'lucide-react';
import { logger } from '@/lib/logger';

export interface SelectionMetadata {
  uvBBox: {
    min: { u: number; v: number };
    max: { u: number; v: number };
  };
  selectedFaceIndices: number[];
  textureWidth: number;
  textureHeight: number;
}

export interface SelectionToolProps {
  modelUrl: string;
  textureUrl?: string;
  textureWidth?: number;
  textureHeight?: number;
  onSelectionComplete?: (maskDataUrl: string, metadata: SelectionMetadata) => void;
  className?: string;
}

interface MeshSelectionState {
  mesh: THREE.Mesh;
  selectedFaces: Set<number>;
  originalColors: Float32Array;
  geometry: THREE.BufferGeometry;
  uvAttribute: THREE.BufferAttribute;
}

/**
 * SelectionTool - 3D face selection tool with raycast picking and paint brush
 */
export default function SelectionTool({
  modelUrl,
  textureUrl,
  textureWidth = 1024,
  textureHeight = 1024,
  onSelectionComplete,
  className = '',
}: SelectionToolProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [brushSize, setBrushSize] = useState(0.1);
  const [selectedMeshes, setSelectedMeshes] = useState<Map<THREE.Mesh, MeshSelectionState>>(new Map());
  const [maskCanvas, setMaskCanvas] = useState<HTMLCanvasElement | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const isDraggingRef = useRef(false);

  const { scene, gl, camera } = useThree();
  const { scene: gltfScene } = useGLTF(modelUrl);

  // Initialize mask canvas
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = textureWidth;
    canvas.height = textureHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, textureWidth, textureHeight);
    }
    setMaskCanvas(canvas);
  }, [textureWidth, textureHeight]);

  // Initialize mesh selection states
  useEffect(() => {
    const meshStates = new Map<THREE.Mesh, MeshSelectionState>();
    
    gltfScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geometry = child.geometry;
        const uvAttribute = geometry.getAttribute('uv') as THREE.BufferAttribute;
        
        if (!uvAttribute) {
          logger.warn('Mesh missing UV coordinates', {
            meshName: child.name,
            modelUrl,
          });
          return;
        }

        // Store original colors if material has color attribute
        let originalColors: Float32Array | null = null;
        const colorAttribute = geometry.getAttribute('color') as THREE.BufferAttribute;
        if (colorAttribute) {
          originalColors = new Float32Array(colorAttribute.array);
        }

        meshStates.set(child, {
          mesh: child,
          selectedFaces: new Set(),
          originalColors: originalColors || new Float32Array(),
          geometry,
          uvAttribute,
        });
      }
    });

    setSelectedMeshes(meshStates);
  }, [gltfScene]);

  // Handle mouse/touch events for raycasting
  // Helper functions defined before useCallback
  const findNearbyFaces = useCallback((
    mesh: THREE.Mesh,
    point: THREE.Vector3,
    radius: number,
    startFaceIndex: number,
    positionAttribute: THREE.BufferAttribute,
    indices: THREE.BufferAttribute
  ): number[] => {
    const nearbyFaces = new Set<number>();
    const worldPoint = point.clone();
    
    // Transform point to local space
    mesh.worldToLocal(worldPoint);

    // Check all faces
    const faceCount = indices.count / 3;
    for (let i = 0; i < faceCount; i++) {
      const v0 = new THREE.Vector3().fromBufferAttribute(positionAttribute, indices.getX(i * 3));
      const v1 = new THREE.Vector3().fromBufferAttribute(positionAttribute, indices.getX(i * 3 + 1));
      const v2 = new THREE.Vector3().fromBufferAttribute(positionAttribute, indices.getX(i * 3 + 2));

      // Calculate face center
      const faceCenter = new THREE.Vector3()
        .add(v0)
        .add(v1)
        .add(v2)
        .multiplyScalar(1 / 3);

      const distance = worldPoint.distanceTo(faceCenter);
      if (distance <= radius) {
        nearbyFaces.add(i);
      }
    }

    return Array.from(nearbyFaces);
  }, []);

  const updateMeshVisualization = useCallback((meshState: MeshSelectionState) => {
    const { mesh, selectedFaces, geometry, originalColors } = meshState;
    
    // Create or update color attribute
    let colorAttribute = geometry.getAttribute('color') as THREE.BufferAttribute;
    const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;
    const indices = geometry.getIndex();

    if (!positionAttribute || !indices) return;

    if (!colorAttribute) {
      const colors = new Float32Array(positionAttribute.count * 3);
      colorAttribute = new THREE.BufferAttribute(colors, 3);
      geometry.setAttribute('color', colorAttribute);
    }

    // Reset colors
    if (originalColors.length > 0) {
      colorAttribute.array.set(originalColors);
    } else {
      for (let i = 0; i < colorAttribute.count; i++) {
        colorAttribute.setXYZ(i, 1, 1, 1);
      }
    }

    // Highlight selected faces
    selectedFaces.forEach((faceIndex) => {
      const v0 = indices.getX(faceIndex * 3);
      const v1 = indices.getX(faceIndex * 3 + 1);
      const v2 = indices.getX(faceIndex * 3 + 2);

      // Highlight vertices in yellow
      colorAttribute.setXYZ(v0, 1, 1, 0);
      colorAttribute.setXYZ(v1, 1, 1, 0);
      colorAttribute.setXYZ(v2, 1, 1, 0);
    });

    colorAttribute.needsUpdate = true;

    // Enable vertex colors in material
    if (mesh.material instanceof THREE.MeshStandardMaterial) {
      mesh.material.vertexColors = true;
      mesh.material.needsUpdate = true;
    }
  }, []);

  const updateMaskCanvas = useCallback((meshState: MeshSelectionState) => {
    if (!maskCanvas) return;

    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    const { selectedFaces, geometry, uvAttribute } = meshState;
    const indices = geometry.getIndex();
    if (!indices) return;

    ctx.fillStyle = '#ffffff'; // White for selected areas

    selectedFaces.forEach((faceIndex) => {
      const i0 = indices.getX(faceIndex * 3);
      const i1 = indices.getX(faceIndex * 3 + 1);
      const i2 = indices.getX(faceIndex * 3 + 2);

      const uv0 = new THREE.Vector2().fromBufferAttribute(uvAttribute, i0);
      const uv1 = new THREE.Vector2().fromBufferAttribute(uvAttribute, i1);
      const uv2 = new THREE.Vector2().fromBufferAttribute(uvAttribute, i2);

      // Convert UV to pixel coordinates
      const x0 = uv0.x * textureWidth;
      const y0 = (1 - uv0.y) * textureHeight;
      const x1 = uv1.x * textureWidth;
      const y1 = (1 - uv1.y) * textureHeight;
      const x2 = uv2.x * textureWidth;
      const y2 = (1 - uv2.y) * textureHeight;

      // Draw triangle
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.closePath();
      ctx.fill();
    });
  }, [maskCanvas, textureWidth, textureHeight]);

  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    if (!groupRef.current) return;
    
    isDraggingRef.current = true;
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    performSelection();
  }, [performSelection]);

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (!isDraggingRef.current || !groupRef.current) return;
    
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    performSelection();
  }, [performSelection]);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const performSelection = useCallback(() => {
    if (!raycasterRef.current || !camera || !groupRef.current) return;

    raycasterRef.current.setFromCamera(mouseRef.current, camera);
    const intersects = raycasterRef.current.intersectObjects(groupRef.current.children, true);

    if (intersects.length === 0) return;

    const intersection = intersects[0];
    if (!(intersection.object instanceof THREE.Mesh)) return;

    const mesh = intersection.object;
    const meshState = selectedMeshes.get(mesh);
    if (!meshState) return;

    const { geometry, uvAttribute } = meshState;
    const faceIndex = intersection.faceIndex;
    if (faceIndex === undefined) return;

    // Get face vertices
    const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;
    const indices = geometry.getIndex();
    
    if (!indices || !positionAttribute) return;

    const faceVertexIndices = [
      indices.getX(faceIndex * 3),
      indices.getX(faceIndex * 3 + 1),
      indices.getX(faceIndex * 3 + 2),
    ];

    // Find nearby faces within brush radius
    const nearbyFaces = findNearbyFaces(
      mesh,
      intersection.point,
      brushSize,
      faceIndex,
      positionAttribute,
      indices
    );

    // Update selection
    nearbyFaces.forEach((faceIdx) => {
      if (isErasing) {
        meshState.selectedFaces.delete(faceIdx);
      } else {
        meshState.selectedFaces.add(faceIdx);
      }
    });

    // Visual feedback: highlight selected faces
    updateMeshVisualization(meshState);

    // Update mask canvas
    updateMaskCanvas(meshState);
  }, [selectedMeshes, brushSize, isErasing, camera, findNearbyFaces, updateMeshVisualization, updateMaskCanvas]);

  const exportMask = useCallback(() => {
    if (!maskCanvas) return;

    const allSelectedFaces: number[] = [];
    let minU = Infinity;
    let minV = Infinity;
    let maxU = -Infinity;
    let maxV = -Infinity;

    selectedMeshes.forEach((meshState) => {
      const { selectedFaces, uvAttribute, geometry } = meshState;
      const indices = geometry.getIndex();
      if (!indices) return;

      selectedFaces.forEach((faceIndex) => {
        allSelectedFaces.push(faceIndex);

        const i0 = indices.getX(faceIndex * 3);
        const i1 = indices.getX(faceIndex * 3 + 1);
        const i2 = indices.getX(faceIndex * 3 + 2);

        const uv0 = new THREE.Vector2().fromBufferAttribute(uvAttribute, i0);
        const uv1 = new THREE.Vector2().fromBufferAttribute(uvAttribute, i1);
        const uv2 = new THREE.Vector2().fromBufferAttribute(uvAttribute, i2);

        minU = Math.min(minU, uv0.x, uv1.x, uv2.x);
        minV = Math.min(minV, uv0.y, uv1.y, uv2.y);
        maxU = Math.max(maxU, uv0.x, uv1.x, uv2.x);
        maxV = Math.max(maxV, uv0.y, uv1.y, uv2.y);
      });
    });

    const maskDataUrl = maskCanvas.toDataURL('image/png');

    const metadata: SelectionMetadata = {
      uvBBox: {
        min: { u: minU, v: minV },
        max: { u: maxU, v: maxV },
      },
      selectedFaceIndices: allSelectedFaces,
      textureWidth,
      textureHeight,
    };

    onSelectionComplete?.(maskDataUrl, metadata);
  }, [maskCanvas, selectedMeshes, textureWidth, textureHeight, onSelectionComplete]);

  return (
    <div className={`relative ${className}`}>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute inset-0 z-10 cursor-crosshair"
        style={{ pointerEvents: isSelecting || isErasing ? 'auto' : 'none' }}
      />
      
      <group ref={groupRef}>
        <primitive object={gltfScene} />
      </group>

      <Card className="absolute top-4 left-4 z-20 p-4 bg-white/90 backdrop-blur-sm">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={isSelecting ? 'default' : 'outline'}
              onClick={() => {
                setIsSelecting(!isSelecting);
                setIsErasing(false);
              }}
            >
              <Brush className="w-4 h-4 mr-2" />
              Select
            </Button>
            <Button
              size="sm"
              variant={isErasing ? 'default' : 'outline'}
              onClick={() => {
                setIsErasing(!isErasing);
                setIsSelecting(false);
              }}
            >
              <Eraser className="w-4 h-4 mr-2" />
              Erase
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm">Brush Size:</label>
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.05"
              value={brushSize}
              onChange={(e) => setBrushSize(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-gray-500">{brushSize.toFixed(2)}</span>
          </div>

          <Button
            size="sm"
            onClick={exportMask}
            disabled={selectedMeshes.size === 0}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Mask
          </Button>
        </div>
      </Card>
    </div>
  );
}
