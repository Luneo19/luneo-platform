/**
 * ★★★ PAGE - AR VIEWER ★★★
 * Page complète pour l'expérience AR
 * - WebXR integration
 * - Face/Hand tracking
 * - 3D model placement
 * - Screenshot & share
 */

'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { trpc } from '@/lib/trpc/client';
import {
    AlertCircle,
    Camera,
    Loader2,
    Share2,
    Smartphone,
    X
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { memo, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// ========================================
// COMPOSANT PRINCIPAL
// ========================================

function ARViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isARSessionActive, setIsARSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const modelUrl = searchParams.get('model');
  const productType = searchParams.get('type') || 'jewelry';
  const productId = searchParams.get('productId');
  const customizationId = searchParams.get('customizationId');

  // Mutations
  const createSession = trpc.ar.createSession.useMutation();
  const trackInteraction = trpc.ar.trackInteraction.useMutation();

  // ========================================
  // EFFECTS
  // ========================================

  useEffect(() => {
    if (!modelUrl) {
      setError('URL du modèle manquante');
      setIsInitializing(false);
      return;
    }

    initializeAR();
  }, [modelUrl]);

  // ========================================
  // FUNCTIONS
  // ========================================

  const initializeAR = useCallback(async () => {
    try {
      setIsInitializing(true);

      // Crée session AR
      const session = await createSession.mutateAsync({
        productId: productId || '',
        customizationId: customizationId || undefined,
        modelUrl: modelUrl!,
        productType: productType as any,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          isMobile: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent),
        },
      });

      setSessionId(session.sessionId);

      // Track session start
      await trackInteraction.mutateAsync({
        sessionId: session.sessionId,
        type: 'session_start',
      });

      // Initialize WebXR
      await startWebXRSession();

      setIsInitializing(false);
    } catch (error: any) {
      logger.error('Error initializing AR', { error });
      setError(error.message || 'Erreur lors de l\'initialisation AR');
      setIsInitializing(false);
    }
  }, [modelUrl, productId, customizationId, productType, createSession, trackInteraction]);

  const startWebXRSession = useCallback(async () => {
    if (!canvasRef.current) {
      throw new Error('Canvas not available');
    }

    if (!('xr' in navigator)) {
      throw new Error('WebXR non supporté sur cet appareil');
    }

    const xr = (navigator as any).xr;

    // Check AR support
    const supported = await xr.isSessionSupported('immersive-ar');
    if (!supported) {
      throw new Error('AR non supportée sur cet appareil');
    }

    // Initialize Three.js
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.xr.enabled = true;

    // Load 3D model
    const loader = new GLTFLoader();
    let model: THREE.Group | null = null;

    try {
      const gltf = await loader.loadAsync(modelUrl!);
      model = gltf.scene;
      model.scale.set(0.1, 0.1, 0.1);
      scene.add(model);

      // Track model loaded
      await trackInteraction.mutateAsync({
        sessionId: sessionId!,
        type: 'model_loaded',
        metadata: { modelUrl: modelUrl! },
      });
    } catch (error: any) {
      logger.error('Error loading 3D model', { error, modelUrl });
      await trackInteraction.mutateAsync({
        sessionId: sessionId!,
        type: 'model_error',
        metadata: { error: error.message },
      });
      throw error;
    }

    // Request AR session
    const session = await xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
    });

    // Setup hit testing for placement
    const hitTestSource = await session.requestReferenceSpace('viewer').then((space: XRReferenceSpace) =>
      session.requestHitTestSource({ space })
    );

    const hitTestSourceRequested = false;
    let modelPlaced = false;

    // Animation loop
    const animate = () => {
      if (!session || !renderer) return;

      renderer.setAnimationLoop(() => {
        if (session && hitTestSource && !modelPlaced) {
          const frame = renderer.xr.getFrame();
          const hitTestResults = frame.getHitTestResults(hitTestSource);

          if (hitTestResults.length > 0 && model) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(renderer.xr.getReferenceSpace());

            if (pose) {
              model.position.setFromMatrixPosition(pose.transform.matrix);
              modelPlaced = true;

              // Track placement success
              trackInteraction.mutateAsync({
                sessionId: sessionId!,
                type: 'placement_success',
                metadata: { position: model.position.toArray() },
              }).catch(() => {});

              hitTestSource.cancel();
            }
          }
        }

        renderer.render(scene, camera);
      });
    };

    // Start rendering
    renderer.xr.setSession(session);
    animate();

    setIsARSessionActive(true);

    // Handle session end
    session.addEventListener('end', () => {
      renderer.setAnimationLoop(null);
      setIsARSessionActive(false);
    });

    logger.info('AR session started', { sessionId });
  }, [sessionId, modelUrl, trackInteraction]);

  const handleClose = useCallback(async () => {
    if (sessionId) {
      await trackInteraction.mutateAsync({
        sessionId,
        type: 'session_end',
      });
    }

    router.back();
  }, [sessionId, router, trackInteraction]);

  const handleScreenshot = useCallback(async () => {
    if (!canvasRef.current || !sessionId) return;

    try {
      // Take screenshot from canvas
      const dataUrl = canvasRef.current.toDataURL('image/png');

      // Track screenshot
      await trackInteraction.mutateAsync({
        sessionId,
        type: 'screenshot',
        metadata: { timestamp: new Date().toISOString() },
      });

      // Share or download screenshot
      if (navigator.share) {
        // Use Web Share API if available
        const blob = await fetch(dataUrl).then((r) => r.blob());
        const file = new File([blob], `ar-screenshot-${Date.now()}.png`, { type: 'image/png' });
        
        try {
          await navigator.share({
            title: 'AR Screenshot',
            files: [file],
          });
        } catch (shareError) {
          // User cancelled or share failed, fallback to download
          downloadScreenshot(dataUrl);
        }
      } else {
        // Fallback: download
        downloadScreenshot(dataUrl);
      }

      logger.info('Screenshot taken', { sessionId });
    } catch (error) {
      logger.error('Error taking screenshot', { error });
    }
  }, [sessionId, trackInteraction]);

  const downloadScreenshot = useCallback((dataUrl: string) => {
    const link = document.createElement('a');
    link.download = `ar-screenshot-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, []);

  // ========================================
  // RENDER
  // ========================================

  if (!modelUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card>
          <CardContent className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">URL du modèle manquante</p>
              <Button onClick={() => router.back()}>Retour</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card>
          <CardContent className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2">{error}</p>
              <Button onClick={() => router.back()}>Retour</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />

      {/* Loading overlay */}
      {isInitializing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center text-white">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p className="text-lg">Initialisation de l'AR...</p>
            <p className="text-sm text-gray-400 mt-2">
              Assurez-vous que votre appareil supporte WebXR
            </p>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      {!isInitializing && isARSessionActive && (
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClose}
            className="bg-black/50 backdrop-blur"
          >
            <X className="w-4 h-4 mr-2" />
            Fermer
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleScreenshot}
              className="bg-black/50 backdrop-blur text-white border-white/20"
            >
              <Camera className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-black/50 backdrop-blur text-white border-white/20"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!isInitializing && isARSessionActive && (
        <div className="absolute bottom-4 left-4 right-4">
          <Alert className="bg-black/50 backdrop-blur border-white/20 text-white">
            <Smartphone className="w-4 h-4" />
            <AlertDescription>
              <p className="text-sm">
                Pointez votre appareil vers une surface plane pour placer le produit
              </p>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}

// ========================================
// EXPORT
// ========================================

const ARViewer = memo(ARViewerContent);

export default function Page() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        }
      >
        <ARViewer />
      </Suspense>
    </ErrorBoundary>
  );
}
