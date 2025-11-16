import React, { useMemo } from 'react';
import { Download, Share, RefreshCw, Box, Camera } from 'lucide-react';
import type { WidgetDesign } from '../types';
import { cn } from '../lib/utils';

interface PreviewCanvasProps {
  design: WidgetDesign | null;
  isGenerating: boolean;
  onRegenerate?: () => void;
  onDownload?: (format: string) => void;
  onShare?: () => void;
  onARPreview?: () => void;
  formats?: string[];
  className?: string;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  design,
  isGenerating,
  onRegenerate,
  onDownload,
  onShare,
  onARPreview,
  formats = ['PNG', 'JPG'],
  className,
}) => {
  const imageUrl = design?.imageUrl ?? design?.thumbnailUrl;
  const sanitizedFormats = useMemo(() => Array.from(new Set(formats)).filter(Boolean), [formats]);

  return (
    <div className={cn('luneo-preview-canvas', className)}>
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden border border-gray-100">
        <div className="aspect-square relative">
          {isGenerating ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm">
              <div className="text-center text-gray-600">
                <div className="relative mb-4 flex items-center justify-center">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  <RefreshCw className="absolute w-6 h-6 text-blue-600" />
                </div>
                <p className="font-medium">Génération en cours…</p>
                <p className="text-sm text-gray-500">L'IA prépare votre design</p>
              </div>
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={design?.title ?? 'Design généré'}
              className="w-full h-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Camera className="w-12 h-12 mx-auto mb-3 opacity-60" />
                <p className="font-medium">Aucun design pour le moment</p>
                <p className="text-sm">Décrivez votre idée pour lancer une génération</p>
              </div>
            </div>
          )}

          {imageUrl && !isGenerating && (
            <div className="absolute top-3 right-3 flex space-x-2">
              {onARPreview && (
                <button
                  type="button"
                  onClick={onARPreview}
                  className="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-lg shadow-sm transition-colors duration-200"
                  title="Prévisualisation AR"
                >
                  <Box className="w-4 h-4" />
                </button>
              )}

              {onShare && (
                <button
                  type="button"
                  onClick={onShare}
                  className="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-lg shadow-sm transition-colors duration-200"
                  title="Partager"
                >
                  <Share className="w-4 h-4" />
                </button>
              )}

              {onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-lg shadow-sm transition-colors duration-200"
                  title="Régénérer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {imageUrl && !isGenerating && onDownload && (
          <div className="flex items-center justify-between p-4 bg-white border-t border-gray-200">
            <div className="flex items-center space-x-3">
              {sanitizedFormats.map((format) => (
                <button
                  key={format}
                  type="button"
                  onClick={() => onDownload(format)}
                  className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors duration-200"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger {format}
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-500">
              {design?.metadata?.generationTime
                ? `${Math.round((design.metadata.generationTime as number) / 1000)}s`
                : 'Qualité HD'}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};