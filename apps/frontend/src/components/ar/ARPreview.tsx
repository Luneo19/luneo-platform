'use client';

import React, { Suspense, useCallback, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Camera, Maximize2, Loader2 } from 'lucide-react';

export interface ARPreviewProps {
  modelUrl: string;
  autoRotate?: boolean;
  onScreenshot?: (dataUrl: string) => void;
  className?: string;
}

function Model({ url, onLoaded }: { url: string; onLoaded?: () => void }) {
  const gltf = useGLTF(url, true);
  const gltfAny = gltf as unknown as Record<string, unknown>;

  React.useEffect(() => {
    if (gltfAny.error) {
      logger.error('ARPreview: model load error', { url, error: gltfAny.error });
      return;
    }
    if (gltf.scene) onLoaded?.();
  }, [url, gltfAny.error, gltf.scene, onLoaded]);

  if (gltfAny.error) return null;
  if (!gltf.scene) return null;

  return <primitive object={gltf.scene} scale={1} />;
}

function Scene({ modelUrl, autoRotate, onLoaded }: { modelUrl: string; autoRotate?: boolean; onLoaded?: () => void }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 4]} intensity={1.2} castShadow />
      <Suspense fallback={null}>
        <Model url={modelUrl} onLoaded={onLoaded} />
        <Environment preset="studio" />
      </Suspense>
      <OrbitControls autoRotate={!!autoRotate} enableDamping dampingFactor={0.05} />
    </>
  );
}

export function ARPreview({ modelUrl, autoRotate = true, onScreenshot, className }: ARPreviewProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScreenshot = useCallback(() => {
    if (!onScreenshot) return;
    const canvas = containerRef.current?.querySelector('canvas');
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      onScreenshot(dataUrl);
    } catch (e) {
      logger.error('ARPreview: screenshot failed', { error: e });
    }
  }, [onScreenshot]);

  const handleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (el?.requestFullscreen) el.requestFullscreen();
  }, []);

  if (!modelUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-900/50 rounded-lg ${className ?? ''}`} style={{ minHeight: 280 }}>
        <p className="text-gray-500 text-sm">No model URL</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative w-full h-full min-h-[280px] rounded-lg overflow-hidden bg-gray-900 ${className ?? ''}`}>
      <Canvas
        gl={{ preserveDrawingBuffer: true, alpha: true }}
        camera={{ position: [0, 0, 3], fov: 50 }}
        onError={() => setError(true)}
      >
        <Scene modelUrl={modelUrl} autoRotate={autoRotate} onLoaded={() => setLoaded(true)} />
      </Canvas>
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80" aria-busy="true">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
          <p className="text-sm text-gray-400">Failed to load model</p>
        </div>
      )}
      <div className="absolute bottom-2 right-2 flex gap-2">
        {onScreenshot && (
          <Button size="icon" variant="secondary" className="h-8 w-8 bg-black/50" onClick={handleScreenshot} aria-label="Take screenshot">
            <Camera className="h-4 w-4" />
          </Button>
        )}
        <Button size="icon" variant="secondary" className="h-8 w-8 bg-black/50" aria-label="Full screen" onClick={handleFullscreen}>
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
