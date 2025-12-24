/**
 * ★★★ COMPOSANT - BOUTON AR ★★★
 * Bouton pour lancer l'expérience AR
 * - Détection WebXR support
 * - Messages informatifs
 * - Redirection vers AR viewer
 * - Gestion erreurs
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smartphone, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { memo } from 'react';

// ========================================
// TYPES
// ========================================

interface ARButtonProps {
  modelUrl: string;
  productType: 'glasses' | 'jewelry' | 'watch' | 'ring' | 'earrings' | 'necklace';
  productId?: string;
  customizationId?: string;
  onLaunch?: () => void;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

type ARSupportStatus = 'checking' | 'supported' | 'not-supported' | 'error';

// ========================================
// COMPOSANT PRINCIPAL
// ========================================

function ARButtonContent({
  modelUrl,
  productType,
  productId,
  customizationId,
  onLaunch,
  className = '',
  variant = 'default',
  size = 'default',
}: ARButtonProps) {
  const router = useRouter();
  const [supportStatus, setSupportStatus] = useState<ARSupportStatus>('checking');
  const [isLaunching, setIsLaunching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ========================================
  // EFFECTS
  // ========================================

  useEffect(() => {
    checkARSupport();
  }, []);

  // ========================================
  // FUNCTIONS
  // ========================================

  const checkARSupport = useCallback(async () => {
    try {
      if (typeof window === 'undefined') {
        setSupportStatus('not-supported');
        return;
      }

      // Check if WebXR is available
      if (!('xr' in navigator)) {
        setSupportStatus('not-supported');
        setErrorMessage('WebXR n\'est pas disponible sur cet appareil');
        return;
      }

      const xr = (navigator as any).xr;

      // Check if AR is supported
      try {
        const supported = await xr.isSessionSupported('immersive-ar');
        setSupportStatus(supported ? 'supported' : 'not-supported');
        
        if (!supported) {
          setErrorMessage('La réalité augmentée n\'est pas supportée sur cet appareil');
        }
      } catch (error) {
        logger.error('Error checking AR support', { error });
        setSupportStatus('not-supported');
        setErrorMessage('Impossible de vérifier le support AR');
      }
    } catch (error) {
      logger.error('Error in AR support check', { error });
      setSupportStatus('error');
      setErrorMessage('Erreur lors de la vérification du support AR');
    }
  }, []);

  const launchAR = useCallback(async () => {
    if (supportStatus !== 'supported') {
      return;
    }

    setIsLaunching(true);
    onLaunch?.();

    try {
      // Build AR URL with parameters
      const params = new URLSearchParams({
        model: encodeURIComponent(modelUrl),
        type: productType,
      });

      if (productId) {
        params.append('productId', productId);
      }

      if (customizationId) {
        params.append('customizationId', customizationId);
      }

      const arUrl = `/ar/viewer?${params.toString()}`;

      // Navigate to AR viewer
      router.push(arUrl);
    } catch (error) {
      logger.error('Error launching AR', { error });
      setErrorMessage('Erreur lors du lancement de l\'AR');
      setIsLaunching(false);
    }
  }, [supportStatus, modelUrl, productType, productId, customizationId, router, onLaunch]);

  // ========================================
  // COMPUTED
  // ========================================

  const isDisabled = useMemo(() => {
    return supportStatus !== 'supported' || isLaunching;
  }, [supportStatus, isLaunching]);

  const buttonText = useMemo(() => {
    if (isLaunching) return 'Lancement...';
    if (supportStatus === 'checking') return 'Vérification...';
    return 'Essayer en réalité augmentée';
  }, [isLaunching, supportStatus]);

  // ========================================
  // RENDER
  // ========================================

  if (supportStatus === 'checking') {
    return (
      <Button disabled className={className} variant={variant} size={size}>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Vérification AR...
      </Button>
    );
  }

  if (supportStatus === 'not-supported' || supportStatus === 'error') {
    return (
      <div className={className}>
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="space-y-1">
              <p className="font-medium">AR non disponible</p>
              <p className="text-sm">
                {errorMessage ||
                  'Utilisez un appareil iOS (Safari) ou Android (Chrome) pour essayer en réalité augmentée'}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={className}>
      <Button
        onClick={launchAR}
        disabled={isDisabled}
        variant={variant}
        size={size}
        className="w-full"
      >
        {isLaunching ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Lancement...
          </>
        ) : (
          <>
            <Smartphone className="w-4 h-4 mr-2" />
            {buttonText}
          </>
        )}
      </Button>
    </div>
  );
}

// ========================================
// EXPORT
// ========================================

const ARButtonComponent = memo(ARButtonContent);

export function ARButton(props: ARButtonProps) {
  return (
    <ErrorBoundary>
      <ARButtonComponent {...props} />
    </ErrorBoundary>
  );
}

export default ARButton;
