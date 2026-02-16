'use client';

import { useEffect, useState } from 'react';
import { ApiService } from '../../services/api.service';
import { useDesignerStore } from '../../store/designerStore';
import type { WidgetConfig } from '../../types/designer.types';
import { ARViewer } from '../AR/ARViewer';
import { Canvas } from '../Canvas/Canvas';
import { GenerationPanel } from '../Generation/GenerationPanel';
import { LayersPanel } from '../Layers/LayersPanel';
import { ImageTool } from '../Tools/ImageTool/ImageTool';
import { ShapeTool } from '../Tools/ShapeTool/ShapeTool';
import { TextTool } from '../Tools/TextTool/TextTool';
import { DesignerToolbar } from './DesignerToolbar';

interface DesignerProps {
  config: WidgetConfig;
}

export function Designer({ config }: DesignerProps) {
  const { initDesign, isLoading, design, showLayers, addLayer, selectLayer } = useDesignerStore();
  const [showGenerationPanel, setShowGenerationPanel] = useState(false);
  const [showARViewer, setShowARViewer] = useState(false);
  const [currentGenerationId] = useState<string | null>(null);
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
    // Add the generated AI image as a new layer in the design
    if (imageUrl) {
      // Create a new image layer with the generated image
      const newLayerId = addLayer('image', {
        x: 50,
        y: 50,
        width: 200,
        height: 200,
        data: {
          src: imageUrl,
          url: imageUrl,
          originalSrc: imageUrl,
          alt: 'AI Generated Image',
          fit: 'contain' as const,
          width: 200,
          height: 200,
        },
      });
      
      // Select the new layer
      if (newLayerId) {
        selectLayer(newLayerId);
      }
    }
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
  interface TextCustomization {
    text: string;
    font: string;
    color: string;
  }
  const customizations = design?.layers.reduce((acc, layer) => {
    if (layer.type === 'text' && layer.data && 'content' in layer.data) {
      const d = layer.data as { content?: string; fontFamily?: string; color?: string };
      acc[layer.id] = {
        text: d.content ?? '',
        font: d.fontFamily ?? 'Arial',
        color: d.color ?? '#000000',
      };
    }
    return acc;
  }, {} as Record<string, TextCustomization>) || {};

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

