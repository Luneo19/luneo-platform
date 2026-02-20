'use client';

import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { TryOnEngine, TryOnEngineConfig, TryOnCategory } from '@/lib/virtual-tryon/TryOnEngine';
import { WatchRenderer } from '@/lib/virtual-tryon/renderers/WatchRenderer';
import { RingRenderer } from '@/lib/virtual-tryon/renderers/RingRenderer';
import { EarringRenderer } from '@/lib/virtual-tryon/renderers/EarringRenderer';
import { NecklaceRenderer } from '@/lib/virtual-tryon/renderers/NecklaceRenderer';
import { EyewearRenderer } from '@/lib/virtual-tryon/renderers/EyewearRenderer';
import type { BaseProductRenderer, RendererConfig } from '@/lib/virtual-tryon/renderers/BaseProductRenderer';
import { DeviceCompatibility, CompatibilityReport } from '@/lib/virtual-tryon/DeviceCompatibility';
import { CalibrationSystem } from '@/lib/virtual-tryon/CalibrationSystem';
import { ARQuickLookFallback } from '@/lib/virtual-tryon/ARQuickLookFallback';
import type { QualityLevel } from '@/lib/virtual-tryon/FPSOptimizer';
import { logger } from '@/lib/logger';
import Image from 'next/image';

export interface TryOnViewProps {
  category: TryOnCategory;
  modelUrl?: string;
  modelUSDZUrl?: string;
  lodLevels?: { high?: string; medium?: string; low?: string };
  scaleFactor?: number;
  defaultPosition?: { x: number; y: number; z: number };
  defaultRotation?: { x: number; y: number; z: number };
  enableOcclusion?: boolean;
  enableShadows?: boolean;
  productName?: string;
  fallbackImage?: string;
  // Callbacks
  onScreenshot?: (dataUrl: string) => void;
  onTrackingChange?: (isTracking: boolean) => void;
  onFPSChange?: (fps: number) => void;
  onQualityChange?: (quality: QualityLevel) => void;
  onPerformanceMetric?: (metric: {
    fps: number;
    detectionLatencyMs: number;
    renderLatencyMs: number;
  }) => void;
  onError?: (error: Error) => void;
  className?: string;
}

const CATEGORY_LABELS: Record<TryOnCategory, { tracking: string; waiting: string }> = {
  watch: { tracking: 'Poignet detecte', waiting: 'Montrez votre poignet' },
  ring: { tracking: 'Main detectee', waiting: 'Montrez votre main' },
  bracelet: { tracking: 'Poignet detecte', waiting: 'Montrez votre poignet' },
  earring: { tracking: 'Visage detecte', waiting: 'Regardez la camera' },
  necklace: { tracking: 'Visage detecte', waiting: 'Regardez la camera' },
  eyewear: { tracking: 'Visage detecte', waiting: 'Regardez la camera' },
};

function createRendererForCategory(
  category: TryOnCategory,
  config: RendererConfig,
): BaseProductRenderer {
  switch (category) {
    case 'watch':
    case 'bracelet':
      return new WatchRenderer(config);
    case 'ring':
      return new RingRenderer(config);
    case 'earring':
      return new EarringRenderer(config);
    case 'necklace':
      return new NecklaceRenderer(config);
    case 'eyewear':
      return new EyewearRenderer(config);
  }
}

/**
 * TryOnView - Unified Virtual Try-On component.
 *
 * Handles:
 * - Device compatibility detection
 * - Calibration wizard (if needed)
 * - Correct renderer selection based on category
 * - Video feed + Three.js overlay
 * - HUD (tracking status, FPS, quality)
 * - Screenshot capture
 * - Fallback to iOS AR Quick Look / 2D mode
 */
export default function TryOnView({
  category,
  modelUrl,
  modelUSDZUrl,
  lodLevels,
  scaleFactor = 1,
  defaultPosition,
  defaultRotation,
  enableOcclusion = true,
  enableShadows = true,
  productName,
  fallbackImage,
  onScreenshot,
  onTrackingChange,
  onFPSChange,
  onQualityChange,
  onPerformanceMetric,
  onError,
  className,
}: TryOnViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<TryOnEngine | null>(null);

  // Stable callback refs (prevent startEngine recreation on callback identity change)
  const onTrackingChangeRef = useRef(onTrackingChange);
  const onFPSChangeRef = useRef(onFPSChange);
  const onQualityChangeRef = useRef(onQualityChange);
  const onPerformanceMetricRef = useRef(onPerformanceMetric);
  const onErrorRef = useRef(onError);
  useEffect(() => { onTrackingChangeRef.current = onTrackingChange; }, [onTrackingChange]);
  useEffect(() => { onFPSChangeRef.current = onFPSChange; }, [onFPSChange]);
  useEffect(() => { onQualityChangeRef.current = onQualityChange; }, [onQualityChange]);
  useEffect(() => { onPerformanceMetricRef.current = onPerformanceMetric; }, [onPerformanceMetric]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const [status, setStatus] = useState<'checking' | 'calibrating' | 'ready' | 'running' | 'error' | 'ar_fallback'>('checking');
  const [compatibility, setCompatibility] = useState<CompatibilityReport | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [fps, setFps] = useState(0);
  const [quality, setQuality] = useState<QualityLevel>('high');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<string[]>([]);

  const labels = CATEGORY_LABELS[category];

  // Check device compatibility on mount
  useEffect(() => {
    let mounted = true;
    DeviceCompatibility.check().then((report) => {
      if (!mounted) return;
      setCompatibility(report);

      if (!report.isCompatible) {
        setStatus('error');
        setErrorMessage('Votre appareil n\'est pas compatible avec le Try-On virtuel');
        return;
      }

      // iOS with USDZ -> offer native AR
      if (report.isIOS && modelUSDZUrl) {
        setStatus('ar_fallback');
        return;
      }

      // Check if calibration is needed
      if (CalibrationSystem.needsCalibration()) {
        setStatus('calibrating');
      } else {
        setStatus('ready');
      }
    });

    return () => {
      mounted = false;
    };
  }, [modelUSDZUrl]);

  // Track initialization to prevent double-start
  const isInitializingRef = useRef(false);

  // Initialize engine - does NOT depend on status to avoid recreation loop
  const startEngine = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    // SAFETY: Destroy any existing engine before creating a new one (prevents WebGL context leak)
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }

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
          onTrackingChangeRef.current?.(tracking);
        },
        onFPSChange: (newFps) => {
          setFps(newFps);
          onFPSChangeRef.current?.(newFps);
        },
        onQualityChange: (q) => {
          setQuality(q);
          onQualityChangeRef.current?.(q);
        },
        onPerformanceMetric: onPerformanceMetricRef.current,
        onError: (err) => {
          logger.error('TryOnView engine error', { error: err.message });
          setErrorMessage(err.message);
          onErrorRef.current?.(err);
        },
      });

      await engine.initialize();

      // Load 3D model
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

        const renderer = createRendererForCategory(category, rendererConfig);
        await renderer.loadModel();
        engine.setRenderer(renderer);
      }

      engine.start();
      engineRef.current = engine;
      setStatus('running');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize');
      setErrorMessage(error.message);
      setStatus('error');
      onError?.(error);
    } finally {
      isInitializingRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, modelUrl, lodLevels, scaleFactor, defaultPosition, defaultRotation, enableOcclusion, enableShadows]);

  // Auto-start when ready (status change triggers, startEngine is stable)
  useEffect(() => {
    if (status === 'ready') {
      startEngine();
    }
  }, [status, startEngine]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  const captureScreenshot = useCallback(() => {
    const dataUrl = engineRef.current?.captureScreenshot();
    if (dataUrl) {
      setScreenshots((prev) => [...prev, dataUrl]);
      onScreenshot?.(dataUrl);
    }
  }, [onScreenshot]);

  const skipCalibration = useCallback(() => {
    setStatus('ready');
  }, []);

  const launchAR = useCallback(() => {
    ARQuickLookFallback.launch({
      modelUSDZUrl,
      modelGLBUrl: modelUrl,
      productName,
    });
  }, [modelUSDZUrl, modelUrl, productName]);

  const qualityLabel = useMemo(() => {
    switch (quality) {
      case 'high': return 'HD';
      case 'medium': return 'SD';
      case 'low': return 'Low';
      case '2d_fallback': return '2D';
    }
  }, [quality]);

  // ========================================
  // Render states
  // ========================================

  if (status === 'checking') {
    return (
      <div className={`flex items-center justify-center bg-gray-900 text-white ${className || ''}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm opacity-80">Verification de la compatibilite...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={`flex items-center justify-center bg-gray-900 text-white ${className || ''}`}>
        <div className="text-center max-w-sm p-6">
          <div className="text-4xl mb-3">&#x26A0;</div>
          <p className="text-sm opacity-80 mb-4">{errorMessage || 'Erreur inconnue'}</p>
          {fallbackImage && (
            <Image src={fallbackImage || ''} alt={productName ?? ''} className="w-48 mx-auto rounded-lg" width={200} height={200} unoptimized />
          )}
        </div>
      </div>
    );
  }

  if (status === 'ar_fallback') {
    return (
      <div className={`flex items-center justify-center bg-gray-900 text-white ${className || ''}`}>
        <div className="text-center p-6">
          <div className="text-4xl mb-3">&#x1F4F1;</div>
          <h3 className="text-lg font-semibold mb-2">Experience AR disponible</h3>
          <p className="text-sm opacity-80 mb-4">
            Essayez {productName || 'ce produit'} en realite augmentee
          </p>
          <button
            onClick={launchAR}
            className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Ouvrir en AR
          </button>
          <button
            onClick={() => setStatus('ready')}
            className="block mx-auto mt-3 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Utiliser le mode camera
          </button>
        </div>
      </div>
    );
  }

  if (status === 'calibrating') {
    return (
      <div className={`flex items-center justify-center bg-gray-900 text-white ${className || ''}`}>
        <div className="text-center p-6 max-w-sm">
          <h3 className="text-lg font-semibold mb-2">Calibration</h3>
          <p className="text-sm opacity-80 mb-4">
            Pour une meilleure precision, nous recommandons une calibration rapide.
          </p>
          <button
            onClick={skipCalibration}
            className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Commencer sans calibration
          </button>
        </div>
      </div>
    );
  }

  // Running / Ready state
  return (
    <div className={`relative bg-black ${className || ''}`}>
      {/* Video feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        playsInline
        muted
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Three.js overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      />

      {/* HUD - Top bar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            isTracking
              ? 'bg-green-500/80 text-white'
              : 'bg-yellow-500/80 text-white'
          }`}>
            {isTracking ? labels.tracking : labels.waiting}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {quality && (
            <span className="text-xs px-2 py-1 rounded-full bg-blue-500/70 text-white">
              {qualityLabel}
            </span>
          )}
          {fps > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-black/50 text-white font-mono">
              {fps} FPS
            </span>
          )}
        </div>
      </div>

      {/* Screenshot count */}
      {screenshots.length > 0 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2">
          <span className="text-xs px-2 py-1 rounded-full bg-purple-500/70 text-white">
            {screenshots.length} capture{screenshots.length > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Capture button */}
      {onScreenshot && (
        <button
          onClick={captureScreenshot}
          disabled={!isTracking}
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 shadow-lg transition-all ${
            isTracking
              ? 'bg-white/90 border-white hover:scale-110 cursor-pointer'
              : 'bg-white/30 border-white/30 cursor-not-allowed'
          }`}
          aria-label="Capturer une photo"
        >
          <div className={`w-12 h-12 mx-auto rounded-full border-2 ${
            isTracking ? 'bg-white border-gray-200' : 'bg-white/20 border-white/20'
          }`} />
        </button>
      )}
    </div>
  );
}
