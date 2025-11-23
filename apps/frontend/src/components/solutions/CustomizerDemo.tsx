'use client';

import React, { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';

interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  x: number;
  y: number;
  content?: string;
  color?: string;
  fontSize?: number;
  rotation?: number;
}

interface CustomizerDemoProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
  onSave?: (elements: CanvasElement[]) => void;
  onExport?: (format: string) => void;
}

function CustomizerDemo({
  width = 800,
  height = 800,
  backgroundColor = '#FFFFFF',
  onSave,
  onExport,
}: CustomizerDemoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<string>('select');
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [selectedColor, setSelectedColor] = useState('#A855F7');
  const [fontSize, setFontSize] = useState(48);
  const [showLayers, setShowLayers] = useState(true);
  const [canvasZoom, setCanvasZoom] = useState(1);

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
    { id: 'triangle', name: 'Triangle', icon: Triangle },
    { id: 'star', name: 'Étoile', icon: Star },
    { id: 'heart', name: 'Coeur', icon: Heart },
  ];

  const colors = [
    '#A855F7', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#EC4899', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
  ];

  const cliparts = ['🎨', '⭐', '💎', '🔥', '🚀', '💪', '👑', '🎯'];

  // Add text element
  const addText = () => {
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

    setElements([...elements, newElement]);
    setTextInput('');
    drawCanvas([...elements, newElement]);
  };

  // Add shape
  const addShape = (shapeType: string) => {
    const newElement: CanvasElement = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      x: width / 2,
      y: height / 2,
      content: shapeType,
      color: selectedColor,
      rotation: 0,
    };

    setElements([...elements, newElement]);
    drawCanvas([...elements, newElement]);
  };

  // Add clipart
  const addClipart = (emoji: string) => {
    const newElement: CanvasElement = {
      id: `clipart-${Date.now()}`,
      type: 'text',
      x: width / 2,
      y: height / 2,
      content: emoji,
      fontSize: 80,
      rotation: 0,
    };

    setElements([...elements, newElement]);
    drawCanvas([...elements, newElement]);
  };

  // Delete element
  const deleteElement = (id: string) => {
    const filtered = elements.filter((el) => el.id !== id);
    setElements(filtered);
    setSelectedElement(null);
    drawCanvas(filtered);
  };

  // Duplicate element
  const duplicateElement = (id: string) => {
    const element = elements.find((el) => el.id === id);
    if (!element) return;

    const newElement = {
      ...element,
      id: `${element.type}-${Date.now()}`,
      x: element.x + 20,
      y: element.y + 20,
    };

    setElements([...elements, newElement]);
    drawCanvas([...elements, newElement]);
  };

  // Draw canvas
  const drawCanvas = useCallback(
    (elementsToRender: CanvasElement[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    if (showLayers) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }
    }

    ctx.save();
    ctx.scale(canvasZoom, canvasZoom);

    // Draw elements
    elementsToRender.forEach((element) => {
      ctx.save();
      ctx.translate(element.x, element.y);
      if (element.rotation) {
        ctx.rotate((element.rotation * Math.PI) / 180);
      }

      if (element.type === 'text') {
        ctx.font = `${element.fontSize || 48}px Arial`;
        ctx.fillStyle = element.color || '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(element.content || '', 0, 0);
      } else if (element.type === 'shape' && element.content) {
        ctx.fillStyle = element.color || '#000000';
        
        switch (element.content) {
          case 'rectangle':
            ctx.fillRect(-50, -50, 100, 100);
            break;
          case 'circle':
            ctx.beginPath();
            ctx.arc(0, 0, 50, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'triangle':
            ctx.beginPath();
            ctx.moveTo(0, -50);
            ctx.lineTo(50, 50);
            ctx.lineTo(-50, 50);
            ctx.closePath();
            ctx.fill();
            break;
          case 'star':
            // Star shape (simplified)
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
              const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
              const x = Math.cos(angle) * 50;
              const y = Math.sin(angle) * 50;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            break;
        }
      }

      // Highlight if selected
      if (element.id === selectedElement) {
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        ctx.strokeRect(-60, -60, 120, 120);
      }

      ctx.restore();
    });

    ctx.restore();
    },
    [backgroundColor, height, width, showLayers, selectedElement, canvasZoom]
  );

  // Redraw on changes
  useEffect(() => {
    drawCanvas(elements);
  }, [elements, drawCanvas]);

  // Export canvas
  const exportCanvas = (format: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (format === 'png') {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `luneo-design-${Date.now()}.png`;
        a.click();
      });
    }

    if (onExport) {
      onExport(format);
    }
  };

  return (
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
          </div>

          {/* Canvas Area */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative bg-white rounded-lg border-2 border-purple-500/30 overflow-hidden">
              <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="w-full h-auto cursor-crosshair"
                onClick={() => {
                  if (activeTool === 'text' && textInput) {
                    addText();
                  }
                }}
              />

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
                className="border-pink-500/50 hover:bg-pink-500/10"
              >
                <Download className="mr-2 w-4 h-4" />
                PDF
              </Button>
              <Button
                onClick={() => exportCanvas('share')}
                variant="outline"
                className="border-blue-500/50 hover:bg-blue-500/10"
              >
                <Share2 className="mr-2 w-4 h-4" />
                Share
              </Button>
              <Button
                variant="outline"
                className="border-green-500/50 hover:bg-green-500/10"
              >
                <Eye className="mr-2 w-4 h-4" />
                Preview
              </Button>
              <Button
                onClick={() => onSave?.(elements)}
                className="border-none bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
              >
                <CheckCircle className="mr-2 w-4 h-4" />
                Enregistrer
              </Button>
            </div>
          </div>

          {/* Properties Panel */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">
              Propriétés
            </h3>

            {/* Text Tool */}
            {activeTool === 'text' && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs text-gray-400 block mb-2">Texte:</label>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Entrez votre texte..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-2">Police:</label>
                  <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
                    <option>Arial</option>
                    <option>Helvetica</option>
                    <option>Georgia</option>
                    <option>Courier New</option>
                    <option>Times New Roman</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-2">
                    Taille: {fontSize}px
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="120"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-2">Couleur:</label>
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`aspect-square rounded-lg border-2 transition-all ${
                          selectedColor === color
                            ? 'border-blue-500 ring-2 ring-blue-500/50 scale-110'
                            : 'border-gray-700 hover:border-blue-500/50'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>

                <Button
                  onClick={addText}
                  disabled={!textInput.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Type className="mr-2 w-4 h-4" />
                  Ajouter Texte
                </Button>
              </motion.div>
            )}

            {/* Shape Tool */}
            {activeTool === 'shape' && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs text-gray-400 block mb-3">
                    Sélectionnez une forme:
                  </label>
                  <div className="space-y-2">
                    {shapes.map((shape) => (
                      <button
                        key={shape.id}
                        onClick={() => addShape(shape.id)}
                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-green-500/50 transition-all flex items-center gap-3"
                      >
                        <shape.icon className="w-5 h-5 text-green-400" />
                        <span className="text-white text-sm">{shape.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <label className="text-xs text-gray-400 block mb-2">
                    Couleur de remplissage:
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`aspect-square rounded-lg border-2 ${
                          selectedColor === color ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-gray-700'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Clipart Tool */}
            {activeTool === 'clipart' && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <label className="text-xs text-gray-400 block mb-3">
                  Sélectionnez un clipart:
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {cliparts.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => addClipart(emoji)}
                      className="aspect-square text-4xl flex items-center justify-center bg-gray-800 border border-gray-700 rounded-lg hover:border-orange-500/50 hover:bg-gray-700 transition-all"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <p className="text-xs text-orange-400 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Bibliothèque de 10,000+ cliparts professionnels disponible en version Pro
                    </span>
                  </p>
                </div>
              </motion.div>
            )}

            {/* Image Tool */}
            {activeTool === 'image' && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div
                  className="border-2 border-dashed border-purple-500/30 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500/60 hover:bg-purple-500/5 transition-all"
                >
                  <Upload className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-white mb-1">
                    Upload Image
                  </p>
                  <p className="text-xs text-gray-400">
                    PNG, JPG, SVG (max 10MB)
                  </p>
                </div>

                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-xs text-purple-400">
                    Les images sont automatiquement optimisées à 300 DPI pour impression
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Layers Panel */}
          <div className="lg:col-span-4 border-t border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                Layers ({elements.length})
              </h3>
              <Button
                onClick={() => setShowLayers(!showLayers)}
                size="sm"
                variant="outline"
                className="border-gray-700"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>

            {elements.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Aucun élément sur le canvas</p>
                <p className="text-xs mt-1">Utilisez les outils pour commencer</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {elements.map((element, index) => (
                  <div
                    key={element.id}
                    onClick={() => setSelectedElement(element.id)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${
                      selectedElement === element.id
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {element.type === 'text' ? (
                        <Type className="w-4 h-4 text-purple-400" />
                      ) : element.type === 'image' ? (
                        <ImageIcon className="w-4 h-4 text-purple-400" />
                      ) : (
                        <Square className="w-4 h-4 text-purple-400" />
                      )}
                      <div>
                        <p className="text-sm text-white font-medium">
                          {element.type === 'text'
                            ? element.content
                            : `${element.type} ${index + 1}`}
                        </p>
                        <p className="text-xs text-gray-400">
                          Layer {elements.length - index}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateElement(element.id);
                        }}
                        className="p-1.5 hover:bg-gray-700 rounded"
                        title="Dupliquer"
                      >
                        <Copy className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteElement(element.id);
                        }}
                        className="p-1.5 hover:bg-red-500/20 rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tech Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gray-900/50 border-purple-500/20 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Konva.js</h4>
              <p className="text-xs text-gray-400">Canvas Engine</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            HTML5 Canvas professionnel avec multi-layers et transformations
          </p>
        </Card>

        <Card className="bg-gray-900/50 border-pink-500/20 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Print Ready</h4>
              <p className="text-xs text-gray-400">300 DPI</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Export PNG/PDF optimisé pour impression professionnelle
          </p>
        </Card>

        <Card className="bg-gray-900/50 border-blue-500/20 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Layers</h4>
              <p className="text-xs text-gray-400">Photoshop-style</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Gestion avancée layers avec groupes, lock, visibilité
          </p>
        </Card>
      </div>

      {/* Code Example */}
      <Card className="bg-gray-900/50 border-purple-500/20 p-6">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Utilisation:
        </h4>
        <div className="bg-black/50 rounded-lg p-4 font-mono text-xs text-gray-300 overflow-x-auto">
          <pre>{`// Embed customizer
<CustomizerDemo
  width={800}
  height={800}
  backgroundColor="#FFFFFF"
  onSave={(elements) => {
    // Save design
    logger.debug('Design saved', { elementsCount: elements?.length || 0 });
  }}
  onExport={(format) => {
    // Export (png, pdf, svg)
    logger.info('Export design', { format });
  }}
/>`}</pre>
        </div>
      </Card>
    </div>
  );
}

// Optimisation avec React.memo pour éviter les re-renders inutiles
export default memo(CustomizerDemo);
