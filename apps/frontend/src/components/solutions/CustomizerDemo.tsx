'use client';

import React, { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import {
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  Star,
  Palette,
  Layers,
  Download,
  Share2,
  Eye,
  Upload,
  Trash2,
  Copy,
  ZoomIn,
  ZoomOut,
  Move,
  Sparkles,
  Settings,
  Heart,
  Triangle,
  CheckCircle,
  RotateCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { Stage, Layer, Text, Rect, Circle as KonvaCircle, Star as KonvaStar, Group, Transformer } from 'react-konva';
import Konva from 'konva';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { exportKonvaStage, duplicateCanvasElement, calculateBounds, disposeKonvaStage, downloadBlob, type CanvasElement } from '@/lib/utils/canvas-operations';

interface CustomizerDemoProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
  onSave?: (elements: CanvasElement[]) => void;
  onExport?: (format: string) => void;
}

// Shape Component
function ShapeElement({
  element,
  isSelected,
  onSelect,
  onChange,
}: {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<CanvasElement>) => void;
}) {
  const shapeRef = useRef<Konva.Shape>(null);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onChange({
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    onChange({
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: node.rotation(),
    });
  };

  const commonProps = {
    x: element.x,
    y: element.y,
    width: element.width || 100,
    height: element.height || 100,
    fill: element.color || '#A855F7',
    draggable: true,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
    rotation: element.rotation || 0,
  };

  if (element.shapeType === 'rectangle') {
    return (
      <>
        <Rect ref={shapeRef as any} {...commonProps} />
        {isSelected && (
          <Transformer
            boundBoxFunc={(oldBox, newBox) => {
              if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                return oldBox;
              }
              return newBox;
            }}
            nodes={[shapeRef.current as any].filter(Boolean)}
          />
        )}
      </>
    );
  }

  if (element.shapeType === 'circle') {
    return (
      <>
        <KonvaCircle
          ref={shapeRef as any}
          {...commonProps}
          radius={element.width ? element.width / 2 : 50}
        />
        {isSelected && (
          <Transformer
            boundBoxFunc={(oldBox, newBox) => {
              if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                return oldBox;
              }
              return newBox;
            }}
            nodes={[shapeRef.current as any].filter(Boolean)}
          />
        )}
      </>
    );
  }

  if (element.shapeType === 'star') {
    return (
      <>
        <KonvaStar
          ref={shapeRef as any}
          {...commonProps}
          numPoints={5}
          innerRadius={element.width ? element.width / 4 : 25}
          outerRadius={element.width ? element.width / 2 : 50}
        />
        {isSelected && (
          <Transformer
            boundBoxFunc={(oldBox, newBox) => {
              if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                return oldBox;
              }
              return newBox;
            }}
            nodes={[shapeRef.current as any].filter(Boolean)}
          />
        )}
      </>
    );
  }

  return null;
}

// Text Element Component
function TextElement({
  element,
  isSelected,
  onSelect,
  onChange,
}: {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<CanvasElement>) => void;
}) {
  const textRef = useRef<Konva.Text>(null);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onChange({
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const handleTransformEnd = () => {
    const node = textRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    node.scaleX(1);
    node.scaleY(1);

    onChange({
      x: node.x(),
      y: node.y(),
      fontSize: Math.max(12, element.fontSize! * scaleX),
      rotation: node.rotation(),
    });
  };

  return (
    <>
      <Text
        ref={textRef}
        text={element.content || ''}
        x={element.x}
        y={element.y}
        fontSize={element.fontSize || 48}
        fill={element.color || '#000000'}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        rotation={element.rotation || 0}
        fontFamily="Arial"
        align="center"
        verticalAlign="middle"
      />
      {isSelected && (
        <Transformer
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
          nodes={[textRef.current as any].filter(Boolean)}
        />
      )}
    </>
  );
}

function CustomizerDemo({
  width = 800,
  height = 800,
  backgroundColor = '#FFFFFF',
  onSave,
  onExport,
}: CustomizerDemoProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const [activeTool, setActiveTool] = useState<string>('select');
  // Initialize with example data (t-shirt design)
  const [elements, setElements] = useState<CanvasElement[]>(() => [
    {
      id: 'demo-text-1',
      type: 'text',
      x: width / 2 - 100,
      y: height / 2 - 50,
      content: 'LUNEO',
      color: '#A855F7',
      fontSize: 64,
      rotation: 0,
    },
    {
      id: 'demo-shape-1',
      type: 'shape',
      x: width / 2 - 75,
      y: height / 2 + 30,
      width: 150,
      height: 150,
      shapeType: 'star',
      color: '#F59E0B',
      rotation: 0,
    },
  ]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [selectedColor, setSelectedColor] = useState('#A855F7');
  const [fontSize, setFontSize] = useState(48);
  const [showLayers, setShowLayers] = useState(true);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);

  const tools = [
    { id: 'select', name: 'Sélection', icon: Move, color: 'gray' },
    { id: 'text', name: 'Texte', icon: Type, color: 'blue' },
    { id: 'image', name: 'Image', icon: ImageIcon, color: 'purple' },
    { id: 'shape', name: 'Forme', icon: Square, color: 'green' },
    { id: 'clipart', name: 'Clipart', icon: Star, color: 'orange' },
  ];

  const shapes = [
    { id: 'rectangle', name: 'Rectangle', icon: Square },
    { id: 'circle', name: 'Cercle', icon: Circle },
    { id: 'star', name: 'Étoile', icon: Star },
  ];

  const colors = [
    '#A855F7', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#EC4899', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
  ];

  const cliparts = ['🎨', '⭐', '💎', '🔥', '🚀', '💪', '👑', '🎯'];

  // Add text element
  const addText = useCallback(() => {
    if (!textInput.trim()) return;

    const newElement: CanvasElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      x: width / 2,
      y: height / 2,
      content: textInput,
      color: selectedColor,
      fontSize: fontSize,
      rotation: 0,
    };

    setElements((prev) => [...prev, newElement]);
    setTextInput('');
    setSelectedElementId(newElement.id);
  }, [textInput, selectedColor, fontSize, width, height]);

  // Add shape
  const addShape = useCallback((shapeType: string) => {
    const newElement: CanvasElement = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      x: width / 2,
      y: height / 2,
      shapeType: shapeType,
      color: selectedColor,
      width: 100,
      height: 100,
      rotation: 0,
    };

    setElements((prev) => [...prev, newElement]);
    setSelectedElementId(newElement.id);
  }, [selectedColor, width, height]);

  // Add clipart (as text emoji)
  const addClipart = useCallback((emoji: string) => {
    const newElement: CanvasElement = {
      id: `clipart-${Date.now()}`,
      type: 'text',
      x: width / 2,
      y: height / 2,
      content: emoji,
      fontSize: 80,
      rotation: 0,
    };

    setElements((prev) => [...prev, newElement]);
    setSelectedElementId(newElement.id);
  }, [width, height]);

  // Delete element
  const deleteElement = useCallback((id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    setSelectedElementId(null);
  }, []);

  // Duplicate element (utilise utilitaire canvas-operations)
  const duplicateElement = useCallback((id: string) => {
    const element = elements.find((el) => el.id === id);
    if (!element) return;

    // Use utility function for duplication
    const elementWithDefaults: CanvasElement = {
      ...element,
      width: element.width ?? 100,
      height: element.height ?? 100,
      rotation: element.rotation ?? 0,
    };
    const newElement = duplicateCanvasElement(elementWithDefaults);
    setElements((prev) => [...prev, newElement]);
    setSelectedElementId(newElement.id);
  }, [elements]);

  // Update element
  const updateElement = useCallback((id: string, attrs: Partial<CanvasElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...attrs } : el))
    );
  }, []);

  // Handle stage click
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedElementId(null);
    }
  }, []);

  // Export canvas
  const exportCanvas = useCallback(async (format: string) => {
    const stage = stageRef.current;
    if (!stage) return;

    if (format === 'png') {
      const dataURL = stage.toDataURL({ pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `luneo-design-${Date.now()}.png`;
      link.href = dataURL;
      link.click();
    } else if (format === 'pdf') {
      try {
        // Dynamic import for jsPDF
        const { default: jsPDF } = await import('jspdf');
        const dataURL = stage.toDataURL({ pixelRatio: 2 });
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: [297, 210], // A4 landscape
        });

        const imgWidth = 297;
        const imgHeight = (stage.height() * imgWidth) / stage.width();

        pdf.addImage(dataURL, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`luneo-design-${Date.now()}.pdf`);
        logger.info('PDF exported successfully');
      } catch (error) {
        logger.error('PDF export error', { error });
        alert('Erreur lors de l\'export PDF. Veuillez réessayer.');
      }
    }

    if (onExport) {
      onExport(format);
    }
  }, [onExport]);

  // Save
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(elements);
    }
    logger.info('Design saved', { elementsCount: elements.length });
  }, [elements, onSave]);

  const selectedElement = useMemo(
    () => elements.find((el) => el.id === selectedElementId) || null,
    [elements, selectedElementId]
  );

  return (
    <ErrorBoundary level="component" componentName="CustomizerDemo">
      <div className="space-y-6">
      <Card className="bg-gray-900/50 border-purple-500/20 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
          {/* Tools Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              Outils
            </h3>

            <div className="space-y-2">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                    activeTool === tool.id
                      ? `border-${tool.color === 'gray' ? 'blue' : tool.color}-500 bg-${tool.color === 'gray' ? 'blue' : tool.color}-500/10`
                      : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                  }`}
                >
                  <tool.icon className={`w-5 h-5 text-${tool.color === 'gray' ? 'blue' : tool.color}-400`} />
                  <span className="text-white font-medium text-sm">{tool.name}</span>
                </button>
              ))}
            </div>

            {/* Element Counter */}
            <Card className="bg-purple-500/10 border-purple-500/30 p-4">
              <p className="text-sm text-purple-400 font-medium">
                Éléments: <span className="text-white font-bold">{elements.length}</span>
              </p>
            </Card>

            {/* Quick Actions */}
            <div className="space-y-2 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowLayers(!showLayers)}
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white hover:bg-gray-700 transition-colors flex items-center justify-between"
              >
                <span>Grille</span>
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => setElements([])}
                className="w-full p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Tout Effacer
              </button>
            </div>

            {/* Text Input */}
            {activeTool === 'text' && (
              <div className="pt-4 border-t border-gray-700 space-y-3">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addText()}
                  placeholder="Tapez votre texte..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="12"
                    max="120"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-400 w-12">{fontSize}px</span>
                </div>
                <Button
                  onClick={addText}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="sm"
                >
                  Ajouter Texte
                </Button>
              </div>
            )}

            {/* Shape Selector */}
            {activeTool === 'shape' && (
              <div className="pt-4 border-t border-gray-700 space-y-2">
                {shapes.map((shape) => (
                  <button
                    key={shape.id}
                    onClick={() => addShape(shape.id)}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <shape.icon className="w-4 h-4" />
                    {shape.name}
                  </button>
                ))}
              </div>
            )}

            {/* Clipart Selector */}
            {activeTool === 'clipart' && (
              <div className="pt-4 border-t border-gray-700">
                <div className="grid grid-cols-4 gap-2">
                  {cliparts.map((emoji, i) => (
                    <button
                      key={i}
                      onClick={() => addClipart(emoji)}
                      className="p-3 bg-gray-800 border border-gray-700 rounded-lg text-2xl hover:bg-gray-700 transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Picker */}
            <div className="pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400 mb-2">Couleur:</p>
              <div className="grid grid-cols-5 gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded border-2 ${
                      selectedColor === color ? 'border-white scale-110' : 'border-gray-700'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full mt-2 h-8 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Canvas Area */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative bg-white rounded-lg border-2 border-purple-500/30 overflow-hidden">
              <Stage
                ref={stageRef}
                width={width}
                height={height}
                onClick={handleStageClick}
                onTap={(e) => handleStageClick(e as any)}
                scaleX={canvasZoom}
                scaleY={canvasZoom}
              >
                <Layer>
                  {/* Background */}
                  <Rect
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    fill={backgroundColor}
                  />

                  {/* Grid */}
                  {showLayers && (
                    <Group>
                      {Array.from({ length: Math.ceil(width / 20) }).map((_, i) => (
                        <Rect
                          key={`v-${i}`}
                          x={i * 20}
                          y={0}
                          width={1}
                          height={height}
                          fill="rgba(0, 0, 0, 0.05)"
                        />
                      ))}
                      {Array.from({ length: Math.ceil(height / 20) }).map((_, i) => (
                        <Rect
                          key={`h-${i}`}
                          x={0}
                          y={i * 20}
                          width={width}
                          height={1}
                          fill="rgba(0, 0, 0, 0.05)"
                        />
                      ))}
                    </Group>
                  )}

                  {/* Elements */}
                  {elements.map((element) => {
                    if (element.type === 'text') {
                      return (
                        <TextElement
                          key={element.id}
                          element={element}
                          isSelected={element.id === selectedElementId}
                          onSelect={() => setSelectedElementId(element.id)}
                          onChange={(attrs) => updateElement(element.id, attrs)}
                        />
                      );
                    } else if (element.type === 'shape') {
                      return (
                        <ShapeElement
                          key={element.id}
                          element={element}
                          isSelected={element.id === selectedElementId}
                          onSelect={() => setSelectedElementId(element.id)}
                          onChange={(attrs) => updateElement(element.id, attrs)}
                        />
                      );
                    }
                    return null;
                  })}
                </Layer>
              </Stage>

              {/* Canvas Overlay Controls */}
              <div className="absolute top-4 left-4 flex gap-2">
                <button
                  onClick={() => setCanvasZoom(Math.min(canvasZoom + 0.1, 2))}
                  className="w-8 h-8 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg flex items-center justify-center hover:bg-white transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  onClick={() => setCanvasZoom(Math.max(canvasZoom - 0.1, 0.5))}
                  className="w-8 h-8 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg flex items-center justify-center hover:bg-white transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4 text-gray-700" />
                </button>
              </div>

              {/* Canvas Info */}
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm border border-purple-500/30 px-3 py-2 rounded-lg">
                <p className="text-xs text-white font-medium">
                  {width}x{height}px · {elements.length} éléments
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <Button
                onClick={() => exportCanvas('png')}
                variant="outline"
                className="border-purple-500/50 hover:bg-purple-500/10"
              >
                <Download className="mr-2 w-4 h-4" />
                PNG
              </Button>
              <Button
                onClick={() => exportCanvas('pdf')}
                variant="outline"
                className="border-purple-500/50 hover:bg-purple-500/10"
              >
                <Download className="mr-2 w-4 h-4" />
                PDF
              </Button>
              <Button
                onClick={handleSave}
                variant="outline"
                className="border-green-500/50 hover:bg-green-500/10"
              >
                <Sparkles className="mr-2 w-4 h-4" />
                Sauver
              </Button>
              {selectedElement && (
                <>
                  <Button
                    onClick={() => duplicateElement(selectedElement.id)}
                    variant="outline"
                    className="border-blue-500/50 hover:bg-blue-500/10"
                  >
                    <Copy className="mr-2 w-4 h-4" />
                    Dupliquer
                  </Button>
                  <Button
                    onClick={() => deleteElement(selectedElement.id)}
                    variant="outline"
                    className="border-red-500/50 hover:bg-red-500/10"
                  >
                    <Trash2 className="mr-2 w-4 h-4" />
                    Supprimer
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Properties Panel */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-400" />
              Propriétés
            </h3>

            {selectedElement ? (
              <div className="space-y-4">
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-sm text-purple-400 font-medium mb-2">
                    Élément sélectionné
                  </p>
                  <p className="text-xs text-gray-400">
                    {selectedElement.type === 'text' ? 'Texte' : 'Forme'}
                  </p>
                </div>

                {selectedElement.type === 'text' && (
                  <>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Texte:</label>
                      <input
                        type="text"
                        value={selectedElement.content || ''}
                        onChange={(e) =>
                          updateElement(selectedElement.id, { content: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Taille:</label>
                      <input
                        type="range"
                        min="12"
                        max="120"
                        value={selectedElement.fontSize || 48}
                        onChange={(e) =>
                          updateElement(selectedElement.id, {
                            fontSize: Number(e.target.value),
                          })
                        }
                        className="w-full"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Couleur:</label>
                  <input
                    type="color"
                    value={selectedElement.color || selectedColor}
                    onChange={(e) =>
                      updateElement(selectedElement.id, { color: e.target.value })
                    }
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Rotation:</label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={selectedElement.rotation || 0}
                    onChange={(e) =>
                      updateElement(selectedElement.id, {
                        rotation: Number(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>
              </div>
            ) : (
              <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
                <Eye className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm text-gray-400">
                  Sélectionnez un élément pour modifier ses propriétés
                </p>
              </div>
            )}

            {/* Layers Panel */}
            <div className="pt-4 border-t border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-400" />
                  Layers ({elements.length})
                </h4>
                <button
                  onClick={() => setShowLayers(!showLayers)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  {showLayers ? 'Masquer' : 'Afficher'}
                </button>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {elements.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">
                    Aucun élément
                  </p>
                ) : (
                  elements
                    .slice()
                    .reverse()
                    .map((element, index) => (
                      <div
                        key={element.id}
                        onClick={() => setSelectedElementId(element.id)}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                          selectedElementId === element.id
                            ? 'bg-purple-500/20 border border-purple-500/50'
                            : 'bg-gray-800/50 border border-gray-700 hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white">
                            Layer {elements.length - index}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteElement(element.id);
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {element.type === 'text'
                            ? `Texte: ${element.content?.substring(0, 20)}`
                            : `Forme: ${element.shapeType}`}
                        </p>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gray-900/50 border-purple-500/20 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Konva.js</h4>
              <p className="text-xs text-gray-400">v10.0.8</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            HTML5 Canvas professionnel avec multi-layers et transformations
          </p>
        </Card>

        <Card className="bg-gray-900/50 border-blue-500/20 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Layers</h4>
              <p className="text-xs text-gray-400">Multi-layers</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Gestion avancée layers avec groupes, lock, visibilité
          </p>
        </Card>

        <Card className="bg-gray-900/50 border-green-500/20 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Export</h4>
              <p className="text-xs text-gray-400">PNG/PDF 300 DPI</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Export print-ready avec résolution haute qualité
          </p>
        </Card>
      </div>
    </div>
    </ErrorBoundary>
  );
}

export default memo(CustomizerDemo);
