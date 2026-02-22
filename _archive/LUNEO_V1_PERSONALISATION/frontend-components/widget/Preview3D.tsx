/**
 * ★★★ COMPOSANT - PREVIEW 3D ★★★
 * Viewer 3D photoréaliste pour produits personnalisés
 * - Three.js avec @react-three/fiber
 * - Rotation automatique et manuelle
 * - Éclairage studio
 * - Ombres et reflets
 * - HDRI environment
 */

'use client';

import { Suspense, useRef, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  useGLTF,
  PerspectiveCamera,
  Environment,
  ContactShadows,
  Grid,
  Loader,
} from '@react-three/drei';
import * as THREE from 'three';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Maximize2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { memo } from 'react';

// ========================================
// TYPES
// ========================================

interface Preview3DProps {
  modelUrl: string;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  cameraPosition?: [number, number, number];
  showControls?: boolean;
  showGrid?: boolean;
  className?: string;
  onModelLoad?: () => void;
  onModelError?: (error: Error) => void;
}

// ========================================
// COMPOSANT PRINCIPAL
// ========================================

function Preview3DContent({
  modelUrl,
  autoRotate = true,
  autoRotateSpeed = 2,
  cameraPosition = [0, 0, 5],
  showControls = true,
  showGrid = false,
  className = '',
  onModelLoad,
  onModelError,
}: Preview3DProps) {
  const [isAutoRotating, setIsAutoRotating] = useState(autoRotate);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls> | null>(null);

  const handleModelLoad = useCallback(() => {
    setIsLoading(false);
    onModelLoad?.();
  }, [onModelLoad]);

  const handleModelError = useCallback(
    (err: Error) => {
      setIsLoading(false);
      setError(err);
      onModelError?.(err);
    },
    [onModelError]
  );

  const toggleAutoRotate = useCallback(() => {
    setIsAutoRotating(!isAutoRotating);
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !isAutoRotating;
    }
  }, [isAutoRotating]);

  const resetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, []);

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-[500px]">
          <div className="text-center">
            <p className="text-red-500 mb-2">Erreur de chargement du modèle</p>
            <p className="text-sm text-gray-500">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-lg ${className}`}>
      <Canvas
        camera={{ position: cameraPosition, fov: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        shadows
        dpr={[1, 2]} // Device pixel ratio
      >
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={cameraPosition} />

          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <spotLight
            position={[10, 10, 10]}
            angle={0.15}
            penumbra={1}
            intensity={1}
            castShadow
          />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          <directionalLight position={[0, 5, 0]} intensity={0.3} />

          {/* Model */}
          <Model3D url={modelUrl} onLoad={handleModelLoad} onError={handleModelError} />

          {/* Shadows */}
          <ContactShadows
            position={[0, -2, 0]}
            opacity={0.5}
            scale={10}
            blur={2}
            far={4}
            resolution={512}
          />

          {/* Environment */}
          <Environment preset="studio" />

          {/* Grid (optional) */}
          {showGrid && <Grid args={[10, 10]} cellColor="#6f6f6f" sectionColor="#9d4b4b" />}

          {/* Controls */}
          {showControls && (
            <OrbitControls
              ref={controlsRef}
              autoRotate={isAutoRotating}
              autoRotateSpeed={autoRotateSpeed}
              enablePan={false}
              minDistance={3}
              maxDistance={8}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 1.5}
              enableDamping
              dampingFactor={0.05}
            />
          )}
        </Suspense>
      </Canvas>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="text-center">
            <Loader />
            <p className="mt-4 text-sm text-gray-600">Chargement du modèle 3D...</p>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      {showControls && !isLoading && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-lg text-sm shadow-md">
            <p className="text-gray-700">
              🖱️ Glissez pour faire tourner | 🔍 Molette pour zoomer
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAutoRotate}
              className="bg-white/90 backdrop-blur"
            >
              {isAutoRotating ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetCamera}
              className="bg-white/90 backdrop-blur"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================
// COMPOSANT 3D MODEL
// ========================================

function Model3D({
  url,
  onLoad,
  onError,
}: {
  url: string;
  onLoad: () => void;
  onError: (error: Error) => void;
}) {
  const { scene } = useGLTF(url, true); // true = use draco loader if available

  // Animation loop for subtle movement
  useFrame((state) => {
    // Subtle floating animation
    scene.rotation.y += 0.001;
  });

  // Call onLoad when model is ready
  useMemo(() => {
    if (scene) {
      onLoad();
    }
  }, [scene, onLoad]);

  return (
    <primitive
      object={scene}
      scale={1}
      position={[0, 0, 0]}
      onError={onError}
    />
  );
}

// ========================================
// EXPORT
// ========================================

const Preview3DComponent = memo(Preview3DContent);

export function Preview3D(props: Preview3DProps) {
  return (
    <ErrorBoundary>
      <Preview3DComponent {...props} />
    </ErrorBoundary>
  );
}

export default Preview3D;
