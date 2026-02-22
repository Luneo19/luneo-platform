/**
 * ARViewer – Platform-aware AR/3D viewer
 * Integrates PlatformRouter: WebXR, Quick Look (iOS), Scene Viewer (Android), 3D fallback.
 * Also supports try-on mode (products + trackerType) via AREngine.
 */

'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Script from 'next/script';
import { getPlatformConfig, type ARLaunchMethod, type ARPlatform } from '@/lib/ar/platforms/PlatformRouter';
import { launch as launchQuickLook } from '@/lib/ar/platforms/ARQuickLookProvider';
import { launch as launchSceneViewer } from '@/lib/ar/platforms/SceneViewerProvider';
import { logger } from '@/lib/logger';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Loader2, Smartphone, X } from 'lucide-react';
import { ARPreview } from '@/components/ar/ARPreview';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AREngine, type ARProduct, type TrackerType } from '@/lib/ar/AREngine';
import { useI18n } from '@/i18n/useI18n';

export type ARViewerMode = 'webxr' | 'quick-look' | 'scene-viewer' | 'fallback' | 'try-on';

export interface ARViewerProps {
  /** 3D model URL (GLB/GLTF) for placement AR or fallback viewer */
  modelUrl?: string;
  /** USDZ URL for iOS AR Quick Look */
  usdzUrl?: string;
  /** Callback when AR session starts */
  onSessionStart?: () => void;
  /** Callback when AR session ends */
  onSessionEnd?: () => void;
  /** Callback when user takes a screenshot */
  onScreenshot?: (dataUrl: string) => void;
  /** Callback for add-to-cart (e.g. from overlay) */
  onAddToCart?: () => void;
  /** Try-on mode: products to overlay */
  products?: ARProduct[];
  /** Try-on mode: tracker type */
  trackerType?: TrackerType;
  className?: string;
}

export function ARViewer({
  modelUrl,
  usdzUrl,
  onSessionStart,
  onSessionEnd,
  onScreenshot,
  onAddToCart,
  products,
  trackerType = 'face',
  className,
}: ARViewerProps) {
  const [platformConfig, setPlatformConfig] = useState<{ platform: ARPlatform; method: ARLaunchMethod } | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isTryOn = useMemo(() => Boolean(products?.length && trackerType), [products, trackerType]);
  const hasModel = Boolean(modelUrl || usdzUrl);

  useEffect(() => {
    if (!hasModel && !isTryOn) return;
    let cancelled = false;
    setStatus('loading');
    getPlatformConfig()
      .then((config) => {
        if (!cancelled) {
          setPlatformConfig({ platform: config.platform, method: config.method });
          setStatus('ready');
        }
      })
      .catch((e) => {
        if (!cancelled) {
          logger.error('ARViewer: platform config failed', { error: e });
          setError(getErrorDisplayMessage(e));
          setStatus('error');
        }
      });
    return () => { cancelled = true; };
  }, [hasModel, isTryOn]);

  const handleLaunchAR = useCallback(() => {
    if (platformConfig?.platform === 'ios' && usdzUrl) {
      launchQuickLook(usdzUrl);
      onSessionStart?.();
      return;
    }
    if (platformConfig?.platform === 'android' && modelUrl) {
      launchSceneViewer(modelUrl, { fallbackUrl: typeof window !== 'undefined' ? window.location.href : '' });
      onSessionStart?.();
      return;
    }
    if (platformConfig?.method === 'webxr' && modelUrl && typeof window !== 'undefined') {
      window.location.href = `/ar/viewer?model=${encodeURIComponent(modelUrl)}`;
      onSessionStart?.();
      return;
    }
    onSessionStart?.();
  }, [platformConfig, modelUrl, usdzUrl, onSessionStart]);

  if (isTryOn) {
    return (
      <ErrorBoundary componentName="ARViewer">
        <ARTryOnViewer products={products!} trackerType={trackerType!} className={className} onCapture={onScreenshot} />
      </ErrorBoundary>
    );
  }

  if (!hasModel) {
    return (
      <Card className={`flex items-center justify-center p-8 text-muted-foreground ${className ?? ''}`}>
        <p className="text-sm">No model URL provided.</p>
      </Card>
    );
  }

  if (status === 'loading' || status === 'error') {
    return (
      <Card className={`flex flex-col items-center justify-center p-8 min-h-[280px] ${className ?? ''}`}>
        {status === 'loading' && <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-2" aria-hidden />}
        {status === 'error' && <p className="text-sm text-destructive">{error}</p>}
      </Card>
    );
  }

  const isDesktop = platformConfig?.platform === 'desktop';

  return (
    <>
      <Script
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
        type="module"
        strategy="lazyOnload"
      />
      <div ref={containerRef} className={`relative rounded-lg overflow-hidden bg-black ${className ?? ''}`}>
        {isDesktop ? (
          <>
            <ARPreview modelUrl={modelUrl!} autoRotate onScreenshot={onScreenshot} />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <Button size="lg" onClick={handleLaunchAR} className="gap-2" aria-label="Show QR code to scan for AR">
                <Smartphone className="h-5 w-5" />
                Scan with your phone for AR
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* @ts-ignore model-viewer web component */}
            <model-viewer
              src={modelUrl ?? ''}
              alt="AR model"
              ar
              ar-modes="webxr scene-viewer quick-look"
              camera-controls
              auto-rotate
              shadow-intensity="1"
              style={{ width: '100%', height: '100%', minHeight: 320, display: 'block' }}
            >
              <Button
                slot="ar-button"
                onClick={handleLaunchAR}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground rounded-xl px-6 py-3 font-semibold gap-2"
                aria-label="View in your space"
              >
                <Smartphone className="h-5 w-5" />
                View in your space
              </Button>
            </model-viewer>
          </>
        )}
      </div>
    </>
  );
}

/** Try-on viewer (face/hand/body) using AREngine – kept for backward compatibility */
function ARTryOnViewer({
  products,
  trackerType,
  className,
  onCapture,
}: {
  products: ARProduct[];
  trackerType: TrackerType;
  className?: string;
  onCapture?: (dataUrl: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const arEngineRef = useRef<AREngine | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const { t } = useI18n();

  const initializeAR = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setStatus('loading');
    setErrorMessage('');
    try {
      const engine = new AREngine({
        videoElement: videoRef.current,
        canvasElement: canvasRef.current,
        trackerType,
        onTrackingUpdate: (data: { confidence: number }) => {
          setIsTracking(true);
          setConfidence(data.confidence);
        },
        onError: (err: Error) => {
          logger.error('[ARViewer] Error', err);
          setStatus('error');
          setErrorMessage(err.message);
        },
      });
      await engine.initialize();
      for (const product of products) await engine.loadProduct(product);
      engine.start();
      arEngineRef.current = engine;
      setStatus('ready');
    } catch (err) {
      logger.error('[ARViewer] Init failed', err as Error);
      setStatus('error');
      setErrorMessage(getErrorDisplayMessage(err));
    }
  }, [trackerType, products]);

  const stopAR = useCallback(() => {
    arEngineRef.current?.dispose();
    arEngineRef.current = null;
    setStatus('idle');
    setIsTracking(false);
  }, []);

  const handleCapture = useCallback(() => {
    try {
      const dataUrl = arEngineRef.current?.captureImage?.();
      if (dataUrl) onCapture?.(dataUrl);
    } catch (e) {
      logger.error('[ARViewer] Capture failed', e as Error);
    }
  }, [onCapture]);

  useEffect(() => () => { arEngineRef.current?.dispose(); }, []);

  return (
    <Card className={`relative overflow-hidden bg-black ${className ?? ''}`}>
      <div className="relative aspect-[4/3]">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
        {status === 'ready' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            <Button size="icon" variant="secondary" onClick={handleCapture} aria-label="Capture">
              <Camera className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="destructive" onClick={stopAR} aria-label="Stop AR">
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}
        {(status === 'error' || status === 'idle') && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Button onClick={status === 'idle' ? initializeAR : () => initializeAR()} variant="secondary">
              {status === 'idle' ? t('arStudio.startCamera') : t('common.retry')}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export default ARViewer;
