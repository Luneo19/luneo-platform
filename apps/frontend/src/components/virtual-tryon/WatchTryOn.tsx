'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { TryOnEngine, TryOnEngineConfig } from '@/lib/virtual-tryon/TryOnEngine';
import { WatchRenderer } from '@/lib/virtual-tryon/renderers/WatchRenderer';
import { logger } from '@/lib/logger';

interface WatchTryOnProps {
  modelUrl?: string;
  lodLevels?: { high?: string; medium?: string; low?: string };
  scaleFactor?: number;
  defaultPosition?: { x: number; y: number; z: number };
  defaultRotation?: { x: number; y: number; z: number };
  enableOcclusion?: boolean;
  enableShadows?: boolean;
  onScreenshot?: (dataUrl: string) => void;
  onTrackingChange?: (isTracking: boolean) => void;
  onFPSChange?: (fps: number) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export default function WatchTryOn({
  modelUrl,
  lodLevels,
  scaleFactor = 1,
  defaultPosition,
  defaultRotation,
  enableOcclusion = true,
  enableShadows = true,
  onScreenshot,
  onTrackingChange,
  onFPSChange,
  onError,
  className,
}: WatchTryOnProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<TryOnEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [fps, setFps] = useState(0);

  const initEngine = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const config: TryOnEngineConfig = {
        category: 'watch',
        videoElement: videoRef.current,
        canvasElement: canvasRef.current,
        modelUrl,
        lodLevels,
        scaleFactor,
        defaultPosition,
        defaultRotation,
        enableOcclusion,
        enableShadows,
        enableFPSOptimizer: true,
      };

      const engine = new TryOnEngine(config, {
        onTracking: (tracking) => {
          setIsTracking(tracking);
          onTrackingChange?.(tracking);
        },
        onFPSChange: (newFps) => {
          setFps(newFps);
          onFPSChange?.(newFps);
        },
        onError: (err) => {
          logger.error('WatchTryOn engine error', { error: err.message });
          onError?.(err);
        },
      });

      await engine.initialize();

      // Load watch 3D model
      if (modelUrl) {
        const renderer = new WatchRenderer({
          modelUrl,
          lodLevels,
          scaleFactor,
          defaultPosition,
          defaultRotation,
          enableOcclusion,
          enableShadows,
        });
        await renderer.loadModel();
        engine.setRenderer(renderer);
      }

      engine.start();
      engineRef.current = engine;
      setIsInitialized(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to init WatchTryOn');
      logger.error('WatchTryOn init failed', { error: error.message });
      onError?.(error);
    }
  }, [modelUrl, lodLevels, scaleFactor, defaultPosition, defaultRotation, enableOcclusion, enableShadows, onTrackingChange, onFPSChange, onError]);

  useEffect(() => {
    initEngine();
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, [initEngine]);

  const captureScreenshot = useCallback(() => {
    const dataUrl = engineRef.current?.captureScreenshot();
    if (dataUrl) {
      onScreenshot?.(dataUrl);
    }
  }, [onScreenshot]);

  return (
    <div className={`relative ${className || ''}`}>
      {/* Video feed (behind 3D overlay) */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover mirror"
        autoPlay
        playsInline
        muted
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Three.js 3D overlay canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      />

      {/* HUD */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        {isInitialized && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            isTracking
              ? 'bg-green-500/80 text-white'
              : 'bg-yellow-500/80 text-white'
          }`}>
            {isTracking ? 'Main détectée' : 'Montrez votre poignet'}
          </span>
        )}
        {fps > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-black/50 text-white font-mono">
            {fps} FPS
          </span>
        )}
      </div>

      {/* Capture button */}
      {isInitialized && onScreenshot && (
        <button
          onClick={captureScreenshot}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-white/90 border-4 border-gray-300 hover:border-primary transition-colors shadow-lg"
          aria-label="Capturer une photo"
        >
          <div className="w-10 h-10 mx-auto rounded-full bg-white border-2 border-gray-200" />
        </button>
      )}
    </div>
  );
}
