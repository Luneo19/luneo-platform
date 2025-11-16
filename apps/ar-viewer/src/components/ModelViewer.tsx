import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Eye, Download, Share2, RotateCcw, Maximize2, AlertTriangle } from 'lucide-react';
import { detectARCapability, type ARCapability } from '../lib/arCapabilities';

export interface ModelViewerProps {
  modelUrl: string;
  posterUrl?: string;
  alt?: string;
  arMode?: boolean;
  autoRotate?: boolean;
  cameraControls?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

export const ModelViewer: React.FC<ModelViewerProps> = ({
  modelUrl,
  posterUrl,
  alt = '3D Model',
  arMode = true,
  autoRotate = true,
  cameraControls = true,
  onLoad,
  onError
}) => {
type ModelViewerElement = HTMLElement & {
  enterFullscreen?: () => void;
  cameraOrbit?: string;
  toDataURL?: () => string | undefined;
};

const MODEL_VIEWER_SCRIPT_ID = 'google-model-viewer-script';

const loadModelViewerOnce = () => {
  if (typeof window === 'undefined') return;
  if (window.customElements?.get('model-viewer')) return;
  if (document.getElementById(MODEL_VIEWER_SCRIPT_ID)) return;
  const script = document.createElement('script');
  script.id = MODEL_VIEWER_SCRIPT_ID;
  script.type = 'module';
  script.async = true;
  script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
  document.head.appendChild(script);
};

const modelViewerRef = useRef<ModelViewerElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [arSupported, setArSupported] = useState<boolean | null>(null);
  const [arReason, setArReason] = useState<string | undefined>();

  useEffect(() => {
    loadModelViewerOnce();
  }, []);

  const attachModelViewerHandlers = useCallback(() => {
    const modelViewer = modelViewerRef.current;
    if (!modelViewer) return () => undefined;

    const handleLoad = () => {
      setIsLoaded(true);
      setIsError(false);
      onLoad?.();
    };

    const handleError = (event: Event) => {
      setIsError(true);
      const detail = (event as CustomEvent<string>).detail;
      const message = typeof detail === 'string' ? detail : 'Impossible de charger le modèle 3D';
      setErrorMessage(message);
      onError?.(message);
    };

    modelViewer.addEventListener('load', handleLoad);
    modelViewer.addEventListener('error', handleError as EventListener);

    return () => {
      modelViewer.removeEventListener('load', handleLoad);
      modelViewer.removeEventListener('error', handleError as EventListener);
    };
  }, [onLoad, onError]);

  useEffect(() => attachModelViewerHandlers(), [attachModelViewerHandlers]);

  useEffect(() => {
    let active = true;

    if (!arMode || typeof window === 'undefined') {
      setArSupported(null);
      setArReason(undefined);
      return;
    }

    detectARCapability()
      .then((capability: ARCapability) => {
        if (!active) return;
        setArSupported(capability.supported);
        setArReason(capability.reason);
      })
      .catch(() => {
        if (!active) return;
        setArSupported(false);
        setArReason('Détection AR impossible sur ce navigateur');
      });

    return () => {
      active = false;
    };
  }, [arMode]);

  const handleFullscreen = () => {
    if (modelViewerRef.current?.enterFullscreen) {
      modelViewerRef.current.enterFullscreen();
    }
  };

  const handleResetCamera = () => {
    if (modelViewerRef.current) {
      modelViewerRef.current.cameraOrbit = '0deg 75deg 105%';
    }
  };

  const handleDownload = () => {
    const dataUrl = modelViewerRef.current?.toDataURL?.();
    if (!dataUrl) {
      setErrorMessage('Export indisponible pour ce navigateur');
      setIsError(true);
      return;
    }
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `model-${Date.now()}.png`;
    link.click();
  };

  const handleShare = async () => {
    if (!navigator.share) {
      setErrorMessage('Partage natif indisponible sur cet appareil');
      setIsError(true);
      return;
    }
    await navigator.share({
      title: alt,
      url: modelUrl,
      text: 'Découvrez ce modèle 3D créé avec Luneo',
    });
  };

  const handleRetry = () => {
    setIsError(false);
    setErrorMessage('');
    modelViewerRef.current?.dispatchEvent(new Event('load'));
  };

  return (
    <div className="luneo-model-viewer">
      <div className="relative w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
        {/* Model Viewer */}
        <model-viewer
          ref={modelViewerRef}
          src={modelUrl}
          poster={posterUrl}
          alt={alt}
          auto-rotate={autoRotate}
          camera-controls={cameraControls}
          ar={arMode && arSupported !== false}
          ar-modes="webxr scene-viewer quick-look"
          shadow-intensity="1"
          environment-image="neutral"
          exposure="1"
          tone-mapping="neutral"
          className="w-full h-full"
          style={{
            '--poster-color': 'transparent',
            '--progress-bar-color': '#3B82F6',
            '--progress-mask': '#ffffff'
          } as React.CSSProperties}
        >
          {/* Loading Slot */}
          <div slot="poster" className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Chargement du modèle 3D...</p>
            </div>
          </div>

          {/* Error Slot */}
          {isError && (
            <div slot="poster" className="absolute inset-0 flex items-center justify-center bg-red-50">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-red-600 font-medium">Erreur de chargement</p>
                <p className="text-sm text-red-500 mt-1">{errorMessage}</p>
              </div>
            </div>
          )}
        </model-viewer>

        {/* Controls Overlay */}
        {isLoaded && !isError && (
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            {/* AR Button */}
            {arMode && (
              <button
                disabled={arSupported === false}
                className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-colors duration-200"
                title={
                  arSupported === false
                    ? arReason || 'AR indisponible'
                    : 'Voir en réalité augmentée'
                }
              >
                <Eye className="w-5 h-5" />
              </button>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={handleFullscreen}
              className="p-3 bg-white/90 hover:bg-white text-gray-700 rounded-lg shadow-lg transition-colors duration-200"
              title="Plein écran"
            >
              <Maximize2 className="w-5 h-5" />
            </button>

            {/* Reset Camera Button */}
            <button
              onClick={handleResetCamera}
              className="p-3 bg-white/90 hover:bg-white text-gray-700 rounded-lg shadow-lg transition-colors duration-200"
              title="Réinitialiser la vue"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Bottom Controls */}
        {isLoaded && !isError && (
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                onClick={handleDownload}
                aria-label="Télécharger un aperçu"
                className="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-lg shadow-lg transition-colors duration-200"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleShare}
                aria-label="Partager le modèle"
                className="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-lg shadow-lg transition-colors duration-200"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Model Info */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
              <p className="text-xs text-gray-600">
                {autoRotate ? 'Rotation automatique' : 'Contrôles caméra'}
              </p>
            </div>
          </div>
        )}

        {/* AR Instructions */}
        {arMode && isLoaded && arSupported !== false && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
            <div className="bg-black/80 text-white rounded-lg px-4 py-2 text-sm">
              <p className="text-center">
                👆 Appuyez sur l'icône AR pour voir en réalité augmentée
              </p>
            </div>
          </div>
        )}

        {arMode && arSupported === false && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="rounded-xl bg-amber-100/90 text-amber-900 p-4 shadow-lg border border-amber-200 text-sm">
              <p className="font-semibold">AR non disponible sur cet appareil.</p>
              <p className="mt-1">
                {arReason || "Activez WebXR ou ouvrez depuis un appareil compatible (Safari iOS pour Quick Look, Android Scene Viewer)."}
              </p>
            </div>
          </div>
        )}

        {isError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
              <h3 className="text-lg font-semibold text-gray-900">Échec de chargement</h3>
              <p className="text-sm text-gray-600">{errorMessage}</p>
              <button
                onClick={handleRetry}
                className="mt-2 w-full rounded-xl bg-blue-600 text-white py-2 font-semibold hover:bg-blue-500 transition"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .luneo-model-viewer {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        model-viewer {
          --poster-color: transparent;
          --progress-bar-color: #3B82F6;
          --progress-mask: #ffffff;
        }
      `}</style>
    </div>
  );
};