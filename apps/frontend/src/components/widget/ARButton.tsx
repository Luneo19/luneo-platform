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

      const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
      if (!xr) {
        setSupportStatus('not-supported');
        setErrorMessage('WebXR non disponible');
        return;
      }

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
    // Fallback: Use <model-viewer> for non-WebXR browsers (iOS Safari, desktop, etc.)
    const usdzUrl = modelUrl.replace(/\.glb$/i, '.usdz');
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

    return (
      <div className={`space-y-2 ${className}`}>
        {/* model-viewer fallback for 3D preview + AR Quick Look on iOS */}
        {modelUrl && (
          <div className="rounded-lg overflow-hidden border bg-gray-50">
            {/* @ts-ignore - model-viewer is a web component */}
            <model-viewer
              src={modelUrl}
              ios-src={usdzUrl}
              alt="Aperçu 3D du produit"
              ar
              ar-modes="webxr scene-viewer quick-look"
              camera-controls
              auto-rotate
              shadow-intensity="1"
              style={{ width: '100%', height: '300px', display: 'block' }}
            >
              <button
                slot="ar-button"
                style={{
                  backgroundColor: '#000',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  border: 'none',
                  position: 'absolute',
                  bottom: '16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                <Smartphone className="w-4 h-4 inline mr-1" />
                {isIOS ? 'Voir en AR (Quick Look)' : 'Voir en 3D'}
              </button>
            </model-viewer>
          </div>
        )}
        <p className="text-xs text-muted-foreground text-center">
          {isIOS
            ? 'Appuyez sur le bouton pour voir en AR avec Quick Look'
            : 'Aperçu 3D interactif - rotation et zoom disponibles'}
        </p>
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
