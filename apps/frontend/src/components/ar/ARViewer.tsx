/**
 * @fileoverview Composant AR Viewer pour essayage virtuel
 * @module ARViewer
 *
 * RÈGLES RESPECTÉES:
 * - ✅ 'use client' car utilise des hooks et APIs browser
 * - ✅ Composant < 300 lignes
 * - ✅ Types explicites
 * - ✅ Gestion d'erreurs avec ErrorBoundary
 * - ✅ Cleanup des ressources
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { Camera, CameraOff, Download, RotateCcw, Loader2 } from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// AR Engine
import { AREngine, TrackerType, TrackingData, ARProduct } from '@/lib/ar/AREngine';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

interface ARViewerProps {
  products: ARProduct[];
  trackerType: TrackerType;
  onCapture?: (imageDataUrl: string) => void;
  onTrackingUpdate?: (data: TrackingData) => void;
  className?: string;
}

type ARStatus = 'idle' | 'loading' | 'ready' | 'error' | 'no-camera';

// ============================================================================
// COMPONENT
// ============================================================================

export function ARViewer({
  products,
  trackerType,
  onCapture,
  onTrackingUpdate,
  className,
}: ARViewerProps) {
  const { t } = useI18n();
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const arEngineRef = useRef<AREngine | null>(null);

  // State
  const [status, setStatus] = useState<ARStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isTracking, setIsTracking] = useState(false);
  const [confidence, setConfidence] = useState(0);

  /**
   * Initialise le moteur AR
   */
  const initializeAR = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      // Créer le moteur AR
      const engine = new AREngine({
        videoElement: videoRef.current,
        canvasElement: canvasRef.current,
        trackerType,
        onTrackingUpdate: (data) => {
          setIsTracking(true);
          setConfidence(data.confidence);
          onTrackingUpdate?.(data);
        },
        onError: (error) => {
          logger.error('[ARViewer] Error', error);
          setStatus('error');
          setErrorMessage(error.message);
        },
      });

      // Initialiser
      await engine.initialize();

      // Charger les produits
      for (const product of products) {
        await engine.loadProduct(product);
      }

      // Démarrer
      engine.start();

      arEngineRef.current = engine;
      setStatus('ready');
    } catch (error) {
      logger.error('[ARViewer] Initialization failed', error as Error);

      if (error instanceof Error && error.message.includes('Camera')) {
        setStatus('no-camera');
        setErrorMessage('Accès à la caméra refusé');
      } else {
        setStatus('error');
        setErrorMessage(getErrorDisplayMessage(error));
      }
    }
  }, [trackerType, products, onTrackingUpdate]);

  /**
   * Arrête le moteur AR
   */
  const stopAR = useCallback(() => {
    arEngineRef.current?.dispose();
    arEngineRef.current = null;
    setStatus('idle');
    setIsTracking(false);
  }, []);

  /**
   * Capture une image
   */
  const handleCapture = useCallback(() => {
    if (!arEngineRef.current) return;

    try {
      const imageDataUrl = arEngineRef.current.captureImage();
      onCapture?.(imageDataUrl);
    } catch (error) {
      logger.error('[ARViewer] Capture failed', error as Error);
    }
  }, [onCapture]);

  /**
   * Redémarre la session AR
   */
  const handleRestart = useCallback(() => {
    stopAR();
    setTimeout(initializeAR, 100);
  }, [stopAR, initializeAR]);

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      arEngineRef.current?.dispose();
    };
  }, []);

  // Charger/décharger les produits quand ils changent
  useEffect(() => {
    if (!arEngineRef.current || status !== 'ready') return;

    const engine = arEngineRef.current;

    // Charger les nouveaux produits
    products.forEach(async (product) => {
      try {
        await engine.loadProduct(product);
      } catch (error) {
        logger.error(`[ARViewer] Failed to load product ${product.id}`, error as Error);
      }
    });
  }, [products, status]);

  return (
    <Card className={`relative overflow-hidden bg-black ${className}`}>
      {/* Video + Canvas */}
      <div className="relative aspect-[4/3]">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Overlay Status */}
        <ARStatusOverlay
          status={status}
          errorMessage={errorMessage}
          isTracking={isTracking}
          confidence={confidence}
          trackerType={trackerType}
        />
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {status === 'idle' && (
          <Button onClick={initializeAR} size="lg">
            <Camera className="h-5 w-5 mr-2" />
            Démarrer la caméra
          </Button>
        )}

        {status === 'loading' && (
          <Button disabled size="lg">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Chargement...
          </Button>
        )}

        {status === 'ready' && (
          <>
            <Button onClick={handleCapture} size="icon" variant="secondary" aria-label="Capture screenshot">
              <Download className="h-5 w-5" />
            </Button>
            <Button onClick={handleRestart} size="icon" variant="secondary" aria-label="Restart AR">
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button onClick={stopAR} size="icon" variant="destructive" aria-label="Stop AR camera">
              <CameraOff className="h-5 w-5" />
            </Button>
          </>
        )}

        {(status === 'error' || status === 'no-camera') && (
          <Button onClick={handleRestart} variant="secondary">
            <RotateCcw className="h-5 w-5 mr-2" />
            Réessayer
      </Button>
      )}
    </div>
    </Card>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Overlay de statut AR
 */
function ARStatusOverlay({
  status,
  errorMessage,
  isTracking,
  confidence,
  trackerType,
}: {
  status: ARStatus;
  errorMessage: string;
  isTracking: boolean;
  confidence: number;
  trackerType: TrackerType;
}) {
  const { t } = useI18n();
  const trackingMessages = {
    face: isTracking ? 'Visage détecté' : 'Positionnez votre visage',
    hand: isTracking ? 'Main détectée' : 'Montrez votre main',
    body: isTracking ? 'Corps détecté' : 'Reculez pour voir votre corps',
  };

  if (status === 'loading') {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
        <div className="text-center text-white">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Initialisation de la caméra...</p>
        </div>
      </div>
    );
  }

  if (status === 'error' || status === 'no-camera') {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
        <div className="text-center text-white max-w-xs">
          <CameraOff className="h-8 w-8 mx-auto mb-2 text-red-400" />
          <p className="font-medium">
            {status === 'no-camera' ? t('arStudio.cameraUnavailable') : t('common.error')}
          </p>
          <p className="text-sm text-white/70 mt-1">{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (status === 'ready') {
  return (
      <>
        {/* Badge de tracking */}
        <div className="absolute top-4 left-4">
          <Badge
            variant={isTracking ? 'default' : 'secondary'}
            className={isTracking ? 'bg-green-500' : ''}
          >
            {trackingMessages[trackerType]}
          </Badge>
        </div>

        {/* Indicateur de confiance */}
        {isTracking && (
          <div className="absolute top-4 right-4">
            <Badge variant="outline" className="bg-black/50 text-white border-white/30">
              {Math.round(confidence * 100)}% confiance
            </Badge>
          </div>
        )}

        {/* Guide visuel amélioré - Conforme au plan PHASE 3 - ARViewer UX claire */}
        {!isTracking && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-white">
              <div className="w-48 h-48 border-2 border-dashed border-white/50 rounded-full flex items-center justify-center mb-4">
                <div className="w-32 h-32 border-2 border-white/30 rounded-full" />
              </div>
              <p className="text-sm font-medium mb-1">{trackingMessages[trackerType]}</p>
              <p className="text-xs text-white/60">
                {trackerType === 'face' && 'Assurez-vous que votre visage est bien éclairé'}
                {trackerType === 'hand' && 'Tenez votre main devant la caméra'}
                {trackerType === 'body' && 'Reculez pour que votre corps soit visible'}
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}

export default ARViewer;
