'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { TryOnEngine, TryOnEngineConfig, TryOnCategory } from '@/lib/virtual-tryon/TryOnEngine';
import { RingRenderer } from '@/lib/virtual-tryon/renderers/RingRenderer';
import { WatchRenderer } from '@/lib/virtual-tryon/renderers/WatchRenderer';
import { EarringRenderer } from '@/lib/virtual-tryon/renderers/EarringRenderer';
import { NecklaceRenderer } from '@/lib/virtual-tryon/renderers/NecklaceRenderer';
import type { BaseProductRenderer, RendererConfig } from '@/lib/virtual-tryon/renderers/BaseProductRenderer';
import { logger } from '@/lib/logger';

export type JewelryType = 'ring' | 'bracelet' | 'earring' | 'necklace';

interface JewelryTryOnProps {
  jewelryType: JewelryType;
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

const JEWELRY_TO_CATEGORY: Record<JewelryType, TryOnCategory> = {
  ring: 'ring',
  bracelet: 'watch', // Uses same hand/wrist tracking
  earring: 'earring',
  necklace: 'necklace',
};

const TRACKING_MESSAGES: Record<JewelryType, { tracking: string; waiting: string }> = {
  ring: { tracking: 'Main détectée', waiting: 'Montrez votre main' },
  bracelet: { tracking: 'Poignet détecté', waiting: 'Montrez votre poignet' },
  earring: { tracking: 'Visage détecté', waiting: 'Regardez la caméra' },
  necklace: { tracking: 'Visage détecté', waiting: 'Regardez la caméra' },
};

function createRenderer(
  jewelryType: JewelryType,
  config: RendererConfig,
): BaseProductRenderer {
  switch (jewelryType) {
    case 'ring':
      return new RingRenderer(config);
    case 'bracelet':
      return new WatchRenderer(config);
    case 'earring':
      return new EarringRenderer(config);
    case 'necklace':
      return new NecklaceRenderer(config);
  }
}

export default function JewelryTryOn({
  jewelryType,
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
}: JewelryTryOnProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<TryOnEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [fps, setFps] = useState(0);

  const category = JEWELRY_TO_CATEGORY[jewelryType];
  const messages = TRACKING_MESSAGES[jewelryType];

  const initEngine = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const config: TryOnEngineConfig = {
        category,
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
          logger.error('JewelryTryOn engine error', {
            type: jewelryType,
            error: err.message,
          });
          onError?.(err);
        },
      });

      await engine.initialize();

      // Load the appropriate 3D renderer
      if (modelUrl) {
        const rendererConfig: RendererConfig = {
          modelUrl,
          lodLevels,
          scaleFactor,
          defaultPosition,
          defaultRotation,
          enableOcclusion,
          enableShadows,
        };

        const renderer = createRenderer(jewelryType, rendererConfig);
        await renderer.loadModel();
        engine.setRenderer(renderer);
      }

      engine.start();
      engineRef.current = engine;
      setIsInitialized(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to init JewelryTryOn');
      logger.error('JewelryTryOn init failed', {
        type: jewelryType,
        error: error.message,
      });
      onError?.(error);
    }
  }, [category, jewelryType, modelUrl, lodLevels, scaleFactor, defaultPosition, defaultRotation, enableOcclusion, enableShadows, onTrackingChange, onFPSChange, onError]);

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
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        playsInline
        muted
        style={{ transform: 'scaleX(-1)' }}
      />

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
            {isTracking ? messages.tracking : messages.waiting}
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
