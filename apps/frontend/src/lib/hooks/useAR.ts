/**
 * ★★★ HOOK - USE AR ★★★
 * Hook personnalisé pour gérer les sessions AR
 * - Détection support
 * - Création sessions
 * - Tracking interactions
 * - Analytics
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { logger } from '@/lib/logger';
import { detectWebXRSupport, detectDeviceInfo, generateARSessionId } from '@/lib/utils/ar';
import type { ARDeviceInfo } from '@/lib/utils/ar';

// ========================================
// TYPES
// ========================================

export interface UseAROptions {
  productId?: string;
  customizationId?: string;
  modelUrl?: string;
  productType?: 'glasses' | 'jewelry' | 'watch' | 'ring' | 'earrings' | 'necklace';
  autoCheckSupport?: boolean;
  onSessionStart?: (sessionId: string) => void;
  onSessionEnd?: () => void;
  onError?: (error: string) => void;
}

export interface ARSession {
  sessionId: string;
  productId: string;
  modelUrl: string;
  productType: string;
  startTime: Date;
  endTime?: Date;
  interactions: number;
}

// ========================================
// HOOK
// ========================================

export function useAR(options: UseAROptions = {}) {
  const {
    productId,
    customizationId,
    modelUrl,
    productType = 'jewelry',
    autoCheckSupport = true,
    onSessionStart,
    onSessionEnd,
    onError,
  } = options;

  const router = useRouter();

  const [deviceInfo, setDeviceInfo] = useState<ARDeviceInfo | null>(null);
  const [isARSupported, setIsARSupported] = useState<boolean | null>(null);
  const [isCheckingSupport, setIsCheckingSupport] = useState(false);
  const [currentSession, setCurrentSession] = useState<ARSession | null>(null);
  const [interactionCount, setInteractionCount] = useState(0);

  // Mutations
  const createSessionMutation = trpc.ar.createSession.useMutation();
  const trackInteractionMutation = trpc.ar.trackInteraction.useMutation();

  // ========================================
  // EFFECTS
  // ========================================

  useEffect(() => {
    if (autoCheckSupport) {
      checkSupport();
    }
  }, [autoCheckSupport]);

  // ========================================
  // FUNCTIONS
  // ========================================

  const checkSupport = useCallback(async () => {
    setIsCheckingSupport(true);

    try {
      const device = detectDeviceInfo();
      setDeviceInfo(device);

      const supported = await detectWebXRSupport();
      setIsARSupported(supported);

      logger.info('AR support checked', { supported, device });
    } catch (error) {
      logger.error('Error checking AR support', { error });
      setIsARSupported(false);
      onError?.('Erreur lors de la vérification du support AR');
    } finally {
      setIsCheckingSupport(false);
    }
  }, [onError]);

  const startSession = useCallback(async () => {
    if (!modelUrl || !productId) {
      onError?.('URL du modèle ou ID produit manquant');
      return;
    }

    try {
      const session = await createSessionMutation.mutateAsync({
        productId,
        customizationId,
        modelUrl,
        productType,
        deviceInfo: deviceInfo || undefined,
      });

      const arSession: ARSession = {
        sessionId: session.sessionId,
        productId: session.productId,
        modelUrl: session.modelUrl,
        productType: session.productType,
        startTime: new Date(),
        interactions: 0,
      };

      setCurrentSession(arSession);
      setInteractionCount(0);

      // Track session start
      await trackInteractionMutation.mutateAsync({
        sessionId: session.sessionId,
        type: 'session_start',
      });

      onSessionStart?.(session.sessionId);
      logger.info('AR session started', { sessionId: session.sessionId });
    } catch (error: unknown) {
      const errorMessage = getErrorDisplayMessage(error);
      onError?.(errorMessage);
      logger.error('Error starting AR session', { error });
    }
  }, [
    modelUrl,
    productId,
    customizationId,
    productType,
    deviceInfo,
    createSessionMutation,
    trackInteractionMutation,
    onSessionStart,
    onError,
  ]);

  const endSession = useCallback(async () => {
    if (!currentSession) return;

    try {
      const endTime = new Date();
      const updatedSession = {
        ...currentSession,
        endTime,
      };

      setCurrentSession(null);

      // Track session end
      await trackInteractionMutation.mutateAsync({
        sessionId: currentSession.sessionId,
        type: 'session_end',
        metadata: {
          duration: Math.round((endTime.getTime() - currentSession.startTime.getTime()) / 1000),
          interactions: interactionCount,
        },
      });

      onSessionEnd?.();
      logger.info('AR session ended', { sessionId: currentSession.sessionId });
    } catch (error) {
      logger.error('Error ending AR session', { error });
    }
  }, [currentSession, interactionCount, trackInteractionMutation, onSessionEnd]);

  const trackInteraction = useCallback(
    async (
      type:
        | 'model_loaded'
        | 'model_error'
        | 'placement_success'
        | 'placement_failed'
        | 'screenshot'
        | 'share',
      metadata?: Record<string, unknown>
    ) => {
      if (!currentSession) return;

      try {
        await trackInteractionMutation.mutateAsync({
          sessionId: currentSession.sessionId,
          type,
          metadata,
        });

        setInteractionCount((prev) => prev + 1);
        logger.info('AR interaction tracked', { type, sessionId: currentSession.sessionId });
      } catch (error) {
        logger.error('Error tracking AR interaction', { error });
      }
    },
    [currentSession, trackInteractionMutation]
  );

  const launchAR = useCallback(() => {
    if (!modelUrl || !productId) {
      onError?.('URL du modèle ou ID produit manquant');
      return;
    }

    // Build AR URL
    const params = new URLSearchParams({
      model: encodeURIComponent(modelUrl),
      type: productType,
      productId,
    });

    if (customizationId) {
      params.append('customizationId', customizationId);
    }

    const arUrl = `/ar/viewer?${params.toString()}`;
    router.push(arUrl);
  }, [modelUrl, productId, customizationId, productType, router, onError]);

  // ========================================
  // COMPUTED
  // ========================================

  const canLaunchAR = useMemo(() => {
    return isARSupported === true && !!modelUrl && !!productId;
  }, [isARSupported, modelUrl, productId]);

  const isSessionActive = useMemo(() => currentSession !== null, [currentSession]);

  // ========================================
  // RETURN
  // ========================================

  return {
    // State
    deviceInfo,
    isARSupported,
    isCheckingSupport,
    currentSession,
    interactionCount,
    canLaunchAR,
    isSessionActive,

    // Actions
    checkSupport,
    startSession,
    endSession,
    trackInteraction,
    launchAR,

    // Loading
    isCreatingSession: createSessionMutation.isPending,
    isTracking: trackInteractionMutation.isPending,
  };
}

