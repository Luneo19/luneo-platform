'use client';

import React, { Suspense, useRef, useState, useEffect, memo, useCallback } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stage, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Loader2 } from 'lucide-react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface ThreeViewerProps {
  modelUrl: string;
  width?: string | number;
  height?: string | number;
  className?: string;
}

/**
 * Composant pour afficher un modèle 3D avec Three.js
 */
function ThreeViewerContent({ 
  modelUrl, 
  width = '100%', 
  height = '500px',
  className = '' 
}: ThreeViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
  }, [modelUrl]);

  const handleModelError = useCallback((message: string) => {
    setError(message);
    setLoading(false);
  }, []);

  return (
    <div 
      className={`relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden ${className}`}
      style={{ width, height }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={<LoadingPlaceholder />}>
          <Stage
            intensity={0.5}
            environment="city"
            shadows={{ type: 'contact', opacity: 0.5, blur: 2 }}
            adjustCamera={1.2}
          >
            {/* Model will be loaded here */}
            <LoadedModel
              url={modelUrl}
              onLoad={() => setLoading(false)}
              onError={handleModelError}
            />
            <RotatingBox />
          </Stage>

          <Environment preset="sunset" />
          <OrbitControls 
            makeDefault
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 1.75}
            enableZoom={true}
            enablePan={true}
          />
        </Suspense>
      </Canvas>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-slate-300">Chargement du modèle 3D...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="text-center max-w-md p-6">
            <p className="text-red-400 mb-2">Erreur de chargement</p>
            <p className="text-sm text-slate-400">{error}</p>
          </div>
        </div>
      )}

      {/* Controls info */}
      <div className="absolute bottom-4 left-4 bg-slate-800/80 backdrop-blur-sm rounded-lg px-4 py-2">
        <p className="text-xs text-slate-300">
          🖱️ Clic gauche: Rotation • Molette: Zoom • Clic droit: Pan
        </p>
      </div>
    </div>
  );
}

const ThreeViewerContentMemo = memo(ThreeViewerContent);

export default function ThreeViewer(props: ThreeViewerProps) {
  return (
    <ErrorBoundary componentName="ThreeViewer">
      <ThreeViewerContentMemo {...props} />
    </ErrorBoundary>
  );
}

/**
 * Placeholder de chargement
 */
function LoadingPlaceholder() {
  return (
    <Html center>
      <div className="flex flex-col items-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm text-slate-300 mt-2">Chargement...</p>
      </div>
    </Html>
  );
}

/**
 * GLTF loader wrapper
 */
function LoadedModel({
  url,
  onLoad,
  onError,
}: {
  url: string;
  onLoad?: () => void;
  onError?: (message: string) => void;
}) {
  const gltf = useLoader(
    GLTFLoader,
    url,
    (loader) => {
      loader.manager.onError = () => {
        onError?.(`Impossible de charger le modèle 3D: ${url}`);
      };
    }
  );

  useEffect(() => {
    onLoad?.();
  }, [gltf, onLoad]);

  return <primitive object={gltf.scene.clone()} dispose={null} />;
}

/**
 * Box qui tourne (exemple de démonstration)
 */
function RotatingBox() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x += delta * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color="#3b82f6" 
        metalness={0.7}
        roughness={0.2}
      />
    </mesh>
  );
}

