/**
 * @luneo/virtual-try-on - React Component professionnel
 * Composant React prêt à l'emploi pour Virtual Try-On
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VirtualTryOn } from '../core/VirtualTryOn';
import type { 
  VirtualTryOnConfig, 
  VirtualTryOnState, 
  PerformanceMetrics,
  ProductCategory 
} from '../core/types';

/**
 * Props du composant
 */
export interface VirtualTryOnComponentProps {
  /** Catégorie de produit */
  category: ProductCategory;
  
  /** URL du modèle 3D */
  model3dUrl: string;
  
  /** Largeur du container */
  width?: number | string;
  
  /** Hauteur du container */
  height?: number | string;
  
  /** Mode debug */
  debug?: boolean;
  
  /** Callback quand prêt */
  onReady?: () => void;
  
  /** Callback sur erreur */
  onError?: (error: Error) => void;
  
  /** Callback sur changement de FPS */
  onFPSChange?: (fps: number) => void;
  
  /** Afficher les contrôles */
  showControls?: boolean;
  
  /** Afficher les métriques */
  showMetrics?: boolean;
  
  /** className personnalisée */
  className?: string;
}

/**
 * Composant React Virtual Try-On
 * 
 * @example
 * ```tsx
 * <VirtualTryOnComponent
 *   category="glasses"
 *   model3dUrl="/models/sunglasses.glb"
 *   width="100%"
 *   height="600px"
 *   showControls={true}
 *   showMetrics={true}
 *   onReady={() => console.log('Ready!')}
 * />
 * ```
 */
export function VirtualTryOnComponent({
  category,
  model3dUrl,
  width = '100%',
  height = '600px',
  debug = false,
  onReady,
  onError,
  onFPSChange,
  showControls = true,
  showMetrics = false,
  className = '',
}: VirtualTryOnComponentProps) {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const tryOnRef = useRef<VirtualTryOn | null>(null);
  
  // État
  const [state, setState] = useState<VirtualTryOnState>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  /**
   * Initialisation
   */
  const isPaused = state === 'paused';
  const isInteractive = state === 'running' || isPaused;

  useEffect(() => {
    if (!containerRef.current) return;
    
    const init = async () => {
      try {
        setState('initializing');
        
        const tryOn = new VirtualTryOn({
          container: containerRef.current!,
          category,
          model3dUrl,
          debug,
        });
        
        // Setup event listeners
        tryOn.on('camera:ready', () => {
          setCameraReady(true);
        });
        
        tryOn.on('face:detected', () => {
          setFaceDetected(true);
        });
        
        tryOn.on('face:lost', () => {
          setFaceDetected(false);
        });
        
        tryOn.on('performance:fps', (fps) => {
          if (onFPSChange) {
            onFPSChange(fps);
          }
          
          if (showMetrics) {
            const currentMetrics = tryOn.getPerformanceMetrics();
            setMetrics(currentMetrics);
          }
        });
        
        tryOn.on('error', (err) => {
          setError(err);
          if (onError) {
            onError(err);
          }
        });
        
        // Initialize
        await tryOn.init();
        
        // Start
        await tryOn.start();
        
        tryOnRef.current = tryOn;
        setState('running');
        
        if (onReady) {
          onReady();
        }
        
      } catch (err) {
        const error = err as Error;
        setError(error);
        setState('error');
        
        if (onError) {
          onError(error);
        }
      }
    };
    
    init();
    
    // Cleanup
    return () => {
      if (tryOnRef.current) {
        tryOnRef.current.stop();
      }
    };
  }, [category, model3dUrl, debug]);

  /**
   * Handlers
   */
  const handlePause = useCallback(() => {
    if (tryOnRef.current && state === 'running') {
      tryOnRef.current.pause();
      setState('paused');
    }
  }, [state]);

  const handleResume = useCallback(() => {
    if (tryOnRef.current && state === 'paused') {
      tryOnRef.current.resume();
      setState('running');
    }
  }, [state]);

  const handleScreenshot = useCallback(async () => {
    if (tryOnRef.current && state === 'running') {
      try {
        const result = await tryOnRef.current.takeScreenshot({
          format: 'png',
          quality: 1.0,
        });
        
        // Download
        const link = document.createElement('a');
        link.href = result.dataUrl;
        link.download = `virtual-try-on-${Date.now()}.png`;
        link.click();
        
      } catch (err) {
        console.error('Screenshot failed:', err);
      }
    }
  }, [state]);

  /**
   * Render
   */
  return (
    <div 
      className={`virtual-try-on-wrapper ${className}`}
      style={{ 
        position: 'relative',
        width,
        height,
      }}
    >
      {/* Container pour la caméra + overlay */}
      <div 
        ref={containerRef}
        className="virtual-try-on-container"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#000',
        }}
      />
      
      {/* Loading overlay */}
      {state === 'initializing' && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          zIndex: 10,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: 48, 
              height: 48, 
              border: '4px solid rgba(255,255,255,0.2)',
              borderTop: '4px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }} />
            <p>Initialisation de la caméra...</p>
            {cameraReady && <p style={{ fontSize: 14, opacity: 0.8 }}>Chargement du modèle 3D...</p>}
          </div>
        </div>
      )}
      
      {/* Error overlay */}
      {state === 'error' && error && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(220, 38, 38, 0.9)',
          color: 'white',
          padding: 24,
          zIndex: 10,
        }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <h3 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>
              Erreur
            </h3>
            <p style={{ marginBottom: 16 }}>{error.message}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                backgroundColor: 'white',
                color: '#DC2626',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Réessayer
            </button>
          </div>
        </div>
      )}
      
      {/* Status indicator */}
      {state === 'running' && (
        <div style={{
          position: 'absolute',
          top: 16,
          left: 16,
          display: 'flex',
          gap: 8,
          zIndex: 5,
        }}>
          {/* Camera indicator */}
          <div style={{
            padding: '6px 12px',
            backgroundColor: cameraReady ? 'rgba(34, 197, 94, 0.9)' : 'rgba(156, 163, 175, 0.9)',
            color: 'white',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'white',
            }} />
            Caméra
          </div>
          
          {/* Face detected indicator */}
          <div style={{
            padding: '6px 12px',
            backgroundColor: faceDetected ? 'rgba(34, 197, 94, 0.9)' : 'rgba(156, 163, 175, 0.9)',
            color: 'white',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'white',
            }} />
            {category === 'watch' ? 'Main' : 'Visage'}
          </div>
        </div>
      )}
      
      {/* Controls */}
      {showControls && isInteractive && (
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 12,
          zIndex: 5,
        }}>
          {/* Pause/Resume */}
          <button
            onClick={isPaused ? handleResume : handlePause}
            style={{
              padding: '12px 24px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            {isPaused ? '▶ Reprendre' : '⏸ Pause'}
          </button>
          
          {/* Screenshot */}
          <button
            onClick={handleScreenshot}
            style={{
              padding: '12px 24px',
              backgroundColor: 'rgba(59, 130, 246, 0.9)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            📸 Screenshot
          </button>
        </div>
      )}
      
      {/* Performance metrics */}
      {showMetrics && metrics && state === 'running' && (
        <div style={{
          position: 'absolute',
          top: 16,
          right: 16,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: 12,
          borderRadius: 8,
          fontSize: 12,
          fontFamily: 'monospace',
          zIndex: 5,
        }}>
          <div>FPS: {metrics.averageFPS}</div>
          <div>Frame: {metrics.averageFrameTime.toFixed(1)}ms</div>
          <div>Memory: {metrics.memoryUsage}MB</div>
        </div>
      )}
      
      {/* CSS animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

