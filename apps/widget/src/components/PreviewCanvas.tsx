import React, { useState, useRef, useEffect } from 'react';
import { Download, Share, Heart, RefreshCw, Eye, Box, Camera } from 'lucide-react';

interface PreviewCanvasProps {
  imageUrl?: string;
  isGenerating: boolean;
  onRegenerate?: () => void;
  onDownload?: (format: string) => void;
  onShare?: () => void;
  onLike?: () => void;
  isLiked?: boolean;
  formats?: string[];
  showAR?: boolean;
  onARPreview?: () => void;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  imageUrl,
  isGenerating,
  onRegenerate,
  onDownload,
  onShare,
  onLike,
  isLiked = false,
  formats = ['PNG', 'JPG', 'PDF'],
  showAR = true,
  onARPreview
}) => {
  const [selectedFormat, setSelectedFormat] = useState(formats[0]);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (imageUrl && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
      };
      
      img.src = imageUrl;
    }
  }, [imageUrl]);

  const handleDownload = () => {
    if (onDownload) {
      onDownload(selectedFormat);
    }
    setShowDownloadMenu(false);
  };

  return (
    <div className="luneo-preview-canvas">
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden">
        {/* Main Preview Area */}
        <div className="aspect-square relative">
          {isGenerating ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                  <RefreshCw className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <p className="text-gray-600 font-medium">Génération en cours...</p>
                <p className="text-sm text-gray-500 mt-1">L'IA crée votre design</p>
              </div>
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="Generated design"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Aucun design généré</p>
                <p className="text-sm">Décrivez votre idée pour commencer</p>
              </div>
            </div>
          )}

          {/* Overlay Actions */}
          {imageUrl && !isGenerating && (
            <div className="absolute top-3 right-3 flex space-x-2">
              {showAR && onARPreview && (
                <button
                  onClick={onARPreview}
                  className="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-lg shadow-sm transition-colors duration-200"
                  title="Prévisualisation AR"
                >
                  <Box className="w-4 h-4" />
                </button>
              )}
              
              <button
                onClick={onLike}
                className={`p-2 rounded-lg shadow-sm transition-colors duration-200 ${
                  isLiked 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-white/90 hover:bg-white text-gray-700'
                }`}
                title={isLiked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            </div>
          )}

          {/* Regenerate Button */}
          {imageUrl && onRegenerate && (
            <div className="absolute bottom-3 left-3">
              <button
                onClick={onRegenerate}
                className="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-lg shadow-sm transition-colors duration-200"
                title="Régénérer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Action Bar */}
        {imageUrl && !isGenerating && (
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Download Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </button>
                  
                  {showDownloadMenu && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="p-2">
                        {formats.map((format) => (
                          <button
                            key={format}
                            onClick={() => setSelectedFormat(format)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-200 ${
                              selectedFormat === format
                                ? 'bg-blue-100 text-blue-700'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            {format}
                          </button>
                        ))}
                        <div className="border-t border-gray-200 mt-2 pt-2">
                          <button
                            onClick={handleDownload}
                            className="w-full text-left px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                          >
                            Télécharger {selectedFormat}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Share Button */}
                {onShare && (
                  <button
                    onClick={onShare}
                    className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Partager
                  </button>
                )}
              </div>

              {/* Quality Indicator */}
              <div className="flex items-center text-sm text-gray-500">
                <Eye className="w-4 h-4 mr-1" />
                <span>HD Quality</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .luneo-preview-canvas {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
      `}</style>
    </div>
  );
};