'use client';

import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { useDesignerStore } from '../../store/designerStore';
import type { Layer, TextLayerData, ImageLayerData, ShapeLayerData } from '../../types/designer.types';

interface CanvasProps {
  width?: number;
  height?: number;
  className?: string;
}

export function Canvas({ width = 800, height = 600, className }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  
  const {
    design,
    selectedLayerId,
    activeTool,
    zoom,
    selectLayer,
    updateLayer,
  } = useDesignerStore();
  
  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    
    fabricRef.current = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: design?.canvas.backgroundColor || '#ffffff',
      selection: activeTool === 'select',
      preserveObjectStacking: true,
    });
    
    const canvas = fabricRef.current;
    
    // Event handlers
    canvas.on('selection:created', (e: fabric.IEvent) => {
      const id = (e.selected?.[0] as any)?.data?.layerId;
      if (id) selectLayer(id);
    });
    
    canvas.on('selection:cleared', () => {
      selectLayer(null);
    });
    
    canvas.on('object:modified', (e: fabric.IEvent) => {
      const obj = e.target;
      if (!obj || !(obj as any).data?.layerId) return;
      
      updateLayer((obj as any).data.layerId, {
        position: { x: obj.left || 0, y: obj.top || 0 },
        rotation: obj.angle || 0,
        scale: { x: obj.scaleX || 1, y: obj.scaleY || 1 },
      });
    });
    
    return () => {
      canvas.dispose();
    };
  }, []);
  
  // Sync layers with canvas
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !design) return;
    
    // Clear canvas
    canvas.clear();
    canvas.setBackgroundColor(design.canvas.backgroundColor, canvas.renderAll.bind(canvas));
    
    // Add layers
    design.layers.forEach((layer) => {
      if (!layer.visible) return;
      
      const obj = createFabricObject(layer);
      if (obj) {
        (obj as any).data = { layerId: layer.id };
        obj.selectable = !layer.locked;
        obj.evented = !layer.locked;
        canvas.add(obj);
      }
    });
    
    canvas.renderAll();
  }, [design?.layers, design?.canvas.backgroundColor]);
  
  // Handle zoom
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    canvas.setZoom(zoom);
    canvas.renderAll();
  }, [zoom]);
  
  // Handle selection
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    if (selectedLayerId) {
      const obj = canvas.getObjects().find((o: any) => o.data?.layerId === selectedLayerId);
      if (obj) {
        canvas.setActiveObject(obj);
      }
    } else {
      canvas.discardActiveObject();
    }
    canvas.renderAll();
  }, [selectedLayerId]);
  
  return (
    <div className={className}>
      <canvas ref={canvasRef} />
    </div>
  );
}

function createFabricObject(layer: Layer): fabric.Object | null {
  const { position, rotation, scale, opacity, data, type } = layer;
  
  const commonOptions = {
    left: position.x,
    top: position.y,
    angle: rotation,
    scaleX: scale.x,
    scaleY: scale.y,
    opacity,
  };
  
  switch (type) {
    case 'text': {
      const textData = data as TextLayerData;
      return new fabric.IText(textData.content, {
        ...commonOptions,
        fontFamily: textData.fontFamily,
        fontSize: textData.fontSize,
        fontWeight: textData.fontWeight,
        fontStyle: textData.fontStyle,
        fill: textData.color,
        textAlign: textData.textAlign,
        lineHeight: textData.lineHeight,
        charSpacing: textData.letterSpacing * 10,
      });
    }
    
    case 'image': {
      const imageData = data as ImageLayerData;
      // Fabric.js requires async image loading
      // This is a simplified sync version
      const img = new fabric.Image(new Image(), {
        ...commonOptions,
        width: imageData.width,
        height: imageData.height,
      });
      
      // Note: Image loading will be handled by Fabric.js automatically
      // For now, return placeholder
      return img;
      
      return img;
    }
    
    case 'shape': {
      const shapeData = data as ShapeLayerData;
      
      switch (shapeData.shapeType) {
        case 'rectangle':
          return new fabric.Rect({
            ...commonOptions,
            width: 100,
            height: 100,
            fill: shapeData.fill,
            stroke: shapeData.stroke,
            strokeWidth: shapeData.strokeWidth,
            rx: shapeData.cornerRadius || 0,
            ry: shapeData.cornerRadius || 0,
          });
        
        case 'circle':
          return new fabric.Circle({
            ...commonOptions,
            radius: 50,
            fill: shapeData.fill,
            stroke: shapeData.stroke,
            strokeWidth: shapeData.strokeWidth,
          });
        
        case 'triangle':
          return new fabric.Triangle({
            ...commonOptions,
            width: 100,
            height: 100,
            fill: shapeData.fill,
            stroke: shapeData.stroke,
            strokeWidth: shapeData.strokeWidth,
          });
        
        default:
          return null;
      }
    }
    
    default:
      return null;
  }
}

// Note: fabricRef is managed internally via useRef

