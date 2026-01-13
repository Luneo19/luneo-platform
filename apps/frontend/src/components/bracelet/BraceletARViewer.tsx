'use client';

/**
 * BraceletARViewer Component
 * 
 * Visualisation AR du bracelet avec model-viewer
 * Support WebXR, Scene Viewer (Android), Quick Look (iOS)
 * 
 * @author Luneo Platform
 * @version 1.0.0
 */

import React, { useEffect, useRef, useState, memo, useCallback, useMemo } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface BraceletCustomization {
  text: string;
  font: string;
  fontSize: number;
  alignment: string;
  position: string;
  color: string;
  material: string;
}

interface BraceletARViewerProps {
  customization: BraceletCustomization;
  modelUrl: string;
  usdzUrl?: string;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src: string;
        'ios-src'?: string;
        alt: string;
        ar?: boolean;
        'ar-modes'?: string;
        'camera-controls'?: boolean;
        style?: React.CSSProperties;
        className?: string;
      };
    }
  }
}

function BraceletARViewerContent({ customization, modelUrl, usdzUrl }: BraceletARViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const modelViewerRef = useRef<any>(null);

  useEffect(() => {
    // Load model-viewer script if not already loaded
    if (typeof window !== 'undefined' && !document.querySelector('script[src*="model-viewer"]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
      script.onload = () => setIsLoading(false);
      script.onerror = () => {
        setError('Impossible de charger model-viewer');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    } else {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-red-400 text-center">{error}</p>
        <p className="text-slate-400 text-sm text-center">
          Veuillez utiliser un navigateur compatible avec WebXR ou AR Quick Look
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-950 rounded-lg overflow-hidden">
      {React.createElement('model-viewer', {
        ref: modelViewerRef,
        src: modelUrl,
        'ios-src': usdzUrl,
        alt: 'Bracelet personnalisé',
        ar: true,
        'ar-modes': 'webxr scene-viewer quick-look',
        'camera-controls': true,
        style: {
          width: '100%',
          height: '100%',
          backgroundColor: '#0f172a',
        },
        className: 'rounded-lg',
      } as any)}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-700">
        <p className="text-xs text-slate-300 text-center">
          Appuyez sur le bouton AR pour visualiser en réalité augmentée
        </p>
      </div>
    </div>
  );
}

const BraceletARViewerContentMemo = memo(BraceletARViewerContent);

export function BraceletARViewer(props: BraceletARViewerProps) {
  return (
    <ErrorBoundary componentName="BraceletARViewer">
      <BraceletARViewerContentMemo {...props} />
    </ErrorBoundary>
  );
}

