'use client';

/**
 * Bracelet3DViewer Component
 * 
 * Affiche le bracelet en 3D avec react-three-fiber
 * Applique la texture dynamique de gravure sur le modèle
 * 
 * Optimisations:
 * - Memoization pour éviter re-renders inutiles
 * - Error boundaries pour gestion d'erreurs
 * - Performance optimisée avec useMemo/useCallback
 * - Lazy loading du modèle
 * 
 * @author Luneo Platform
 * @version 2.0.0
 */

import React, { useRef, useEffect, Suspense, useState, useMemo, useCallback, memo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Loader2, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

interface BraceletCustomization {
  text: string;
  font: string;
  fontSize: number;
  alignment: string;
  position: string;
  color: string;
  material: string;
}

interface Bracelet3DViewerProps {
  customization: BraceletCustomization;
  onTextureReady?: (dataUrl: string) => void;
}

// Component to apply dynamic texture to bracelet mesh
const BraceletMesh = memo(({ 
  modelPath, 
  dynamicTexture, 
  customization 
}: { 
  modelPath: string;
  dynamicTexture: string | null;
  customization: BraceletCustomization;
}) => {
  const { scene, error: loadError } = useGLTF(modelPath, true);
  const meshRef = useRef<THREE.Group>(null);
  const textureRef = useRef<THREE.Texture | null>(null);

  // Memoize material properties
  const materialProps = useMemo(() => {
    const metalness = customization.material === 'steel' ? 0.8 : 
                     customization.material === 'gold' ? 0.9 : 0.2;
    const roughness = customization.material === 'leather' ? 0.8 : 0.3;
    return { metalness, roughness, color: customization.color };
  }, [customization.material, customization.color]);

  useEffect(() => {
    if (loadError) {
      logger.error('Error loading GLB model', { error: loadError, modelPath });
      return;
    }

    if (!scene) return;

    // Traverse scene to find bracelet mesh
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Apply dynamic texture if available
        if (dynamicTexture && child.material) {
          try {
            const loader = new THREE.TextureLoader();
            loader.load(
              dynamicTexture,
              (texture) => {
                // Cleanup previous texture
                if (textureRef.current) {
                  textureRef.current.dispose();
                }

                texture.flipY = false;
                texture.encoding = THREE.sRGBEncoding;
                texture.needsUpdate = true;
                textureRef.current = texture;

                // Apply texture to material
                if (child.material instanceof THREE.MeshStandardMaterial) {
                  child.material.map = texture;
                  child.material.needsUpdate = true;
                } else if (Array.isArray(child.material)) {
                  child.material.forEach((mat) => {
                    if (mat instanceof THREE.MeshStandardMaterial) {
                      mat.map = texture;
                      mat.needsUpdate = true;
                    }
                  });
                }
              },
              undefined,
              (error) => {
                logger.error('Error loading texture', { error, dynamicTexture });
              }
            );
          } catch (error) {
            logger.error('Error applying texture', { error });
          }
        }

        // Update material properties
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.color.set(materialProps.color);
          child.material.metalness = materialProps.metalness;
          child.material.roughness = materialProps.roughness;
          child.material.needsUpdate = true;
        } else if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.color.set(materialProps.color);
              mat.metalness = materialProps.metalness;
              mat.roughness = materialProps.roughness;
              mat.needsUpdate = true;
            }
          });
        }
      }
    });

    // Cleanup function
    return () => {
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
    };
  }, [scene, dynamicTexture, materialProps, loadError, modelPath]);

  if (loadError) {
    return (
      <Html center>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
          <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-300">Erreur de chargement du modèle</p>
        </div>
      </Html>
    );
  }

  return <primitive ref={meshRef} object={scene} />;
});

BraceletMesh.displayName = 'BraceletMesh';

// Auto-rotate animation
function AutoRotate() {
  const { camera } = useThree();
  
  useFrame(() => {
    camera.position.x = Math.sin(Date.now() * 0.0005) * 3;
    camera.position.z = Math.cos(Date.now() * 0.0005) * 3;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// Generate texture from customization (memoized for performance)
const generateTexture = (customization: BraceletCustomization): string => {
  try {
    const canvas = document.createElement('canvas');
    const width = 1024;
    const height = 256;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      logger.warn('Canvas 2D context not available');
      return '';
    }

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw bracelet band background with gradient for depth
    const gradient = ctx.createLinearGradient(0, height * 0.25, 0, height * 0.75);
    gradient.addColorStop(0, customization.color);
    gradient.addColorStop(0.5, customization.color);
    gradient.addColorStop(1, adjustBrightness(customization.color, -20));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height * 0.25, width, height * 0.5);

    // Add highlight for 3D effect
    const highlightGradient = ctx.createLinearGradient(0, height * 0.25, 0, height * 0.5);
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGradient;
    ctx.fillRect(0, height * 0.25, width, height * 0.25);

    // Set text style with better rendering
    ctx.fillStyle = '#222222';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${customization.fontSize}px ${customization.font}, sans-serif`;
    ctx.textRenderingOptimization = 'optimizeQuality';

    // Calculate text alignment
    let textX = width / 2;
    if (customization.alignment === 'left') {
      ctx.textAlign = 'left';
      textX = width * 0.1;
    } else if (customization.alignment === 'right') {
      ctx.textAlign = 'right';
      textX = width * 0.9;
    } else {
      ctx.textAlign = 'center';
    }

    // Add text shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    // Draw text
    ctx.fillText(customization.text, textX, height / 2);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    return canvas.toDataURL('image/png', 1.0);
  } catch (error) {
    logger.error('Error generating texture', { error, customization });
    return '';
  }
};

// Helper to adjust color brightness
const adjustBrightness = (color: string, amount: number): string => {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export const Bracelet3DViewer = memo(({ customization, onTextureReady }: Bracelet3DViewerProps) => {
  const [textureUrl, setTextureUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize texture generation to avoid unnecessary recalculations
  const texture = useMemo(() => {
    try {
      return generateTexture(customization);
    } catch (err) {
      logger.error('Error generating texture', { error: err, customization });
      setError('Erreur lors de la génération de la texture');
      return '';
    }
  }, [customization]);

  useEffect(() => {
    if (texture) {
      setTextureUrl(texture);
      onTextureReady?.(texture);
      setIsLoading(false);
      setError(null);
    }
  }, [texture, onTextureReady]);

  // Error boundary fallback
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-red-400 text-center">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setIsLoading(true);
            const newTexture = generateTexture(customization);
            setTextureUrl(newTexture);
            setIsLoading(false);
          }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
        <p className="text-sm text-slate-400">Chargement du modèle 3D...</p>
      </div>
    );
  }

  return (
    <Canvas
      shadows
      gl={{ 
        antialias: true, 
        alpha: true,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      }}
      className="w-full h-full"
      dpr={[1, 2]} // Limit pixel ratio for performance
      performance={{ min: 0.5 }} // Adaptive quality
    >
      <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={50} />
      
      {/* Optimized Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <pointLight position={[-5, -5, -5]} intensity={0.5} />

      {/* Environment with fallback */}
      <Suspense fallback={null}>
        <Environment preset="studio" />
      </Suspense>

      {/* Bracelet Model with error handling */}
      <Suspense 
        fallback={
          <Html center>
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          </Html>
        }
      >
        <BraceletMesh
          modelPath="/models/bracelets/bracelet.glb"
          dynamicTexture={textureUrl}
          customization={customization}
        />
      </Suspense>

      {/* Controls with smooth damping */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={5}
        autoRotate={false}
        autoRotateSpeed={0.5}
        dampingFactor={0.05}
        enableDamping={true}
      />
    </Canvas>
  );
});

Bracelet3DViewer.displayName = 'Bracelet3DViewer';

// Preload model
useGLTF.preload('/models/bracelets/bracelet.glb');

