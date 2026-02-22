'use client';

import React, { Suspense, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { useProgress, Html } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import { SceneManager, ModelLoader, CameraController } from '../viewer';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface Configurator3DCanvasProps {
  className?: string;
  onSceneReady?: () => void;
}

function LoadingOverlay() {
  const { progress, active } = useProgress();
  const setLoadingProgress = useConfigurator3DStore((s) => s.setLoadingProgress);

  React.useEffect(() => {
    setLoadingProgress(active ? progress : 100);
  }, [active, progress, setLoadingProgress]);

  if (!active) return null;

  return (
    <Html fullscreen>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex h-full w-full flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm"
      >
        <div className="w-48 space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-center text-sm text-muted-foreground">
            Loading model... {Math.round(progress)}%
          </p>
        </div>
      </motion.div>
    </Html>
  );
}

function CanvasContent({ onSceneReady }: { onSceneReady?: () => void }) {
  const configuration = useConfigurator3DStore((s) => s.configuration);
  const modelUrl = configuration?.modelUrl;

  return (
    <>
      <SceneManager />
      <LoadingOverlay />
      {modelUrl ? (
        <Suspense fallback={null}>
          <ModelLoader modelUrl={modelUrl} />
        </Suspense>
      ) : (
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      )}
      <CameraController onCreated={onSceneReady} />
    </>
  );
}

/**
 * Configurator3DCanvas - Three.js canvas with model, controls, and loading
 */
export function Configurator3DCanvas({
  className,
  onSceneReady,
}: Configurator3DCanvasProps) {
  const configuration = useConfigurator3DStore((s) => s.configuration);

  const handleCreated = useCallback(() => {
    onSceneReady?.();
  }, [onSceneReady]);

  const shadowsEnabled = configuration?.sceneSettings?.shadows?.enabled ?? true;
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1;

  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      <Canvas
        dpr={dpr}
        shadows={shadowsEnabled}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        camera={{
          fov: configuration?.cameraSettings?.fov ?? 45,
          near: configuration?.cameraSettings?.near ?? 0.1,
          far: configuration?.cameraSettings?.far ?? 1000,
        }}
      >
        <CanvasContent onSceneReady={handleCreated} />
      </Canvas>
    </div>
  );
}
