import React, { useRef, useEffect, useState } from 'react';
import { Eye, Download, Share, RotateCcw, Maximize2 } from 'lucide-react';

interface ModelViewerProps {
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
  const modelViewerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const modelViewer = modelViewerRef.current;
    if (!modelViewer) return;

    const handleLoad = () => {
      setIsLoaded(true);
      setIsError(false);
      onLoad?.();
    };

    const handleError = (event: any) => {
      setIsError(true);
      setErrorMessage(event.detail || 'Failed to load 3D model');
      onError?.(event.detail || 'Failed to load 3D model');
    };

    modelViewer.addEventListener('load', handleLoad);
    modelViewer.addEventListener('error', handleError);

    return () => {
      modelViewer.removeEventListener('load', handleLoad);
      modelViewer.removeEventListener('error', handleError);
    };
  }, [onLoad, onError]);

  const handleFullscreen = () => {
    if (modelViewerRef.current) {
      modelViewerRef.current.enterFullscreen();
    }
  };

  const handleResetCamera = () => {
    if (modelViewerRef.current) {
      modelViewerRef.current.cameraOrbit = '0deg 75deg 105%';
    }
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
          ar={arMode}
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
                className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-colors duration-200"
                title="Voir en réalité augmentée"
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
              <button className="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-lg shadow-lg transition-colors duration-200">
                <Download className="w-4 h-4" />
              </button>
              <button className="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-lg shadow-lg transition-colors duration-200">
                <Share className="w-4 h-4" />
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
        {arMode && isLoaded && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
            <div className="bg-black/80 text-white rounded-lg px-4 py-2 text-sm">
              <p className="text-center">
                👆 Appuyez sur l'icône AR pour voir en réalité augmentée
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Load Model Viewer Script */}
      <script
        type="module"
        src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
        async
      />

      <style jsx>{`
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