'use client';

import { useEffect, useState } from 'react';
import { Canvas } from '../Canvas/Canvas';
import { DesignerToolbar } from './DesignerToolbar';
import { LayersPanel } from '../Layers/LayersPanel';
import { TextTool } from '../Tools/TextTool/TextTool';
import { ImageTool } from '../Tools/ImageTool/ImageTool';
import { ShapeTool } from '../Tools/ShapeTool/ShapeTool';
import { GenerationPanel } from '../Generation/GenerationPanel';
import { ARViewer } from '../AR/ARViewer';
import { useDesignerStore } from '../../store/designerStore';
import { ApiService } from '../../services/api.service';
import type { WidgetConfig } from '../../types/designer.types';

interface DesignerProps {
  config: WidgetConfig;
}

export function Designer({ config }: DesignerProps) {
  const { initDesign, isLoading, design, showLayers } = useDesignerStore();
  const [showGenerationPanel, setShowGenerationPanel] = useState(false);
  const [showARViewer, setShowARViewer] = useState(false);
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);
  const [apiService] = useState(() => new ApiService(config.apiKey));
  
  useEffect(() => {
    if (config.productId && config.apiKey) {
      initDesign(config.productId, config.apiKey).catch((error) => {
        config.onError?.(error);
      });
    }
  }, [config.productId, config.apiKey]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }
  
  if (!design) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600">Aucun design chargé</p>
      </div>
    );
  }
  
  const handleGenerationComplete = (imageUrl: string) => {
    // TODO: Ajouter l'image générée comme layer dans le design
    console.log('Generation complete:', imageUrl);
    setShowGenerationPanel(false);
  };

  const handleARView = () => {
    if (currentGenerationId) {
      setShowARViewer(true);
    } else {
      // Si pas de génération, on peut quand même essayer de voir le produit en AR
      setShowARViewer(true);
    }
  };

  // Extraire les customizations depuis le design
  const customizations = design?.layers.reduce((acc, layer) => {
    if (layer.type === 'text' && layer.data) {
      acc[layer.id] = {
        text: (layer.data as any).content,
        font: (layer.data as any).fontFamily,
        color: (layer.data as any).color,
      };
    }
    return acc;
  }, {} as Record<string, any>) || {};

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <DesignerToolbar
        onGenerateClick={() => setShowGenerationPanel(!showGenerationPanel)}
        onARClick={handleARView}
        showGenerate={true}
        showAR={!!currentGenerationId}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          {showARViewer && currentGenerationId ? (
            <ARViewer
              apiService={apiService}
              generationId={currentGenerationId}
              onClose={() => setShowARViewer(false)}
            />
          ) : (
            <>
              <Canvas
                width={design.canvas.width}
                height={design.canvas.height}
                className="absolute inset-0"
              />
              <TextTool />
              <ImageTool />
              <ShapeTool />
            </>
          )}
        </div>
        {showGenerationPanel && !showARViewer && (
          <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto p-4">
            <GenerationPanel
              apiService={apiService}
              productId={config.productId}
              customizations={customizations}
              onGenerationComplete={handleGenerationComplete}
              onError={config.onError}
            />
          </div>
        )}
        {showLayers && !showGenerationPanel && !showARViewer && (
          <div className="w-64 border-l border-gray-200 bg-white overflow-y-auto">
            <LayersPanel />
          </div>
        )}
      </div>
    </div>
  );
}

