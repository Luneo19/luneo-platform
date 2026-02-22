'use client';

/**
 * Bracelet2DPreview Component
 * 
 * Aperçu 2D du bracelet avec canvas
 * Génère la texture de gravure pour export
 * Fallback si modèle 3D absent
 * 
 * Optimisations:
 * - useMemo pour éviter recalculs
 * - Error handling robuste
 * - Performance optimisée
 * 
 * @author Luneo Platform
 * @version 2.0.0
 */

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useMemo, useCallback, memo } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { generateBraceletTexture } from '@/lib/bracelet/texture-generator';
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

interface Bracelet2DPreviewProps {
  customization: BraceletCustomization;
  onTextureReady?: (dataUrl: string) => void;
}

export const Bracelet2DPreview = forwardRef<HTMLCanvasElement, Bracelet2DPreviewProps>(
  ({ customization, onTextureReady }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isRendering, setIsRendering] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement);

    // Memoize texture generation
    const textureDataUrl = useMemo(() => {
      try {
        return generateBraceletTexture({
          text: customization.text,
          font: customization.font,
          fontSize: customization.fontSize,
          alignment: customization.alignment as 'left' | 'center' | 'right',
          position: customization.position,
          color: customization.color,
          material: customization.material,
        });
      } catch (err) {
        logger.error('Error generating 2D texture', { error: err, customization });
        setError('Erreur lors de la génération de l\'aperçu');
        return '';
      }
    }, [customization]);

    // Render to canvas
    const renderCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      setIsRendering(true);
      setError(null);

      try {
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
          throw new Error('Canvas context not available');
        }

        const width = 1024;
        const height = 256;
        canvas.width = width;
        canvas.height = height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#1e293b');
        gradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Draw bracelet band
        const bandY = height * 0.25;
        const bandHeight = height * 0.5;
        
        // Band shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, bandY + bandHeight, width, 10);

        // Band main with gradient
        const bandGradient = ctx.createLinearGradient(0, bandY, 0, bandY + bandHeight);
        bandGradient.addColorStop(0, customization.color);
        bandGradient.addColorStop(1, adjustBrightness(customization.color, -20));
        ctx.fillStyle = bandGradient;
        ctx.fillRect(0, bandY, width, bandHeight);

        // Band highlight
        const highlightGradient = ctx.createLinearGradient(0, bandY, 0, bandY + bandHeight / 2);
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = highlightGradient;
        ctx.fillRect(0, bandY, width, bandHeight / 2);

        // Draw text
        ctx.fillStyle = '#222222';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${customization.fontSize}px ${customization.font}, sans-serif`;
        // textRenderingOptimization is not a valid CanvasRenderingContext2D property

        // Calculate text alignment
        let textX = width / 2;
        if (customization.alignment === 'left') {
          ctx.textAlign = 'left';
          textX = width * 0.1;
        } else if (customization.alignment === 'right') {
          ctx.textAlign = 'right';
          textX = width * 0.9;
        } else {
          ctx.textAlign = 'center';
        }

        // Text shadow for depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Draw text
        ctx.fillText(customization.text, textX, height / 2);

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Notify parent
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        onTextureReady?.(dataUrl);

        setIsRendering(false);
      } catch (err) {
        logger.error('Error rendering 2D preview', { error: err });
        setError('Erreur lors du rendu');
        setIsRendering(false);
      }
    }, [customization, onTextureReady]);

    useEffect(() => {
      renderCanvas();
    }, [renderCanvas]);

    // Helper function
    const adjustBrightness = (color: string, amount: number): string => {
      try {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      } catch {
        return color;
      }
    };

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-red-400 text-center">{error}</p>
          <button
            onClick={renderCanvas}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm"
          >
            Réessayer
          </button>
        </div>
      );
    }

    if (isRendering) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          <p className="text-sm text-slate-400">Génération de l'aperçu...</p>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full"
          style={{ imageRendering: 'crisp-edges' }}
        />
      </div>
    );
  }
);

Bracelet2DPreview.displayName = 'Bracelet2DPreview';

const Bracelet2DPreviewMemo = memo(Bracelet2DPreview);

export const Bracelet2DPreviewWithErrorBoundary = forwardRef<HTMLCanvasElement, Bracelet2DPreviewProps>(
  (props, ref) => {
    return (
      <ErrorBoundary componentName="Bracelet2DPreview">
        <Bracelet2DPreviewMemo {...props} ref={ref} />
      </ErrorBoundary>
    );
  }
);

Bracelet2DPreviewWithErrorBoundary.displayName = 'Bracelet2DPreviewWithErrorBoundary';

