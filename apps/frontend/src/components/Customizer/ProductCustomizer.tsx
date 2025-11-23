'use client';

/**
 * PRODUCT CUSTOMIZER - Composant principal
 * Interface WYSIWYG comme Zakeke
 */

import React, { useRef, useEffect, useState, useCallback, memo, useMemo } from 'react';
import { CanvasEditor } from '@/lib/canvas-editor/CanvasEditor';
import { PrintReadyExporter } from '@/lib/canvas-editor/export/PrintReadyExporter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import {
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  Star,
  Undo2,
  Redo2,
  Download,
  Save,
  Trash2,
  Copy,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ProductCustomizerProps {
  productId: string;
  productImage: string;
  productName: string;
  width?: number;
  height?: number;
  onSave?: (designData: any) => void;
  onClose?: () => void;
  mode?: 'live' | 'demo';
}

function ProductCustomizerComponent({
  productId,
  productImage,
  productName,
  width = 800,
  height = 600,
  onSave,
  onClose,
  mode = 'live'
}: ProductCustomizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<CanvasEditor | null>(null);
  const [selectedTool, setSelectedTool] = useState<'select' | 'text' | 'image' | 'shape'>('select');
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  
  // Text properties
  const [textProps, setTextProps] = useState({
    fontSize: 30,
    fontFamily: 'Arial',
    fill: '#000000',
    fontStyle: 'normal' as 'normal' | 'bold' | 'italic',
  });
  
  // Initialize editor
  useEffect(() => {
    if (!containerRef.current || editor) {
      return;
    }

    const canvasEditor = new CanvasEditor({
      containerId: 'product-customizer-canvas',
      width,
      height,
      dpi: 300,
      colorMode: 'RGB',
      bleed: 3,
    });

    canvasEditor.onSelection((node) => {
      setSelectedNode(node);

      if (node && node.getClassName() === 'Text') {
        const textNode = node as any;
        setTextProps({
          fontSize: textNode.fontSize(),
          fontFamily: textNode.fontFamily(),
          fill: textNode.fill(),
          fontStyle: textNode.fontStyle(),
        });
      }
    });

    canvasEditor.onHistory((undo, redo) => {
      setCanUndo(undo);
      setCanRedo(redo);
    });

    setEditor(canvasEditor);

    return () => {
      canvasEditor.destroy();
    };
  }, [editor, height, width]);

  useEffect(() => {
    if (!editor) return;
    if (productImage) {
      editor.setBackgroundImage(productImage).catch((error) => {
        logger.error('Failed to set background image', {
          error,
          productId,
          productImage,
        });
      });
    } else {
      editor.fillWithPattern(width, height, '#F3F4F6');
    }
  }, [editor, productImage, width, height, productId]);
  
  // Tools handlers
  const handleAddText = useCallback(() => {
    if (!editor) return;
    editor.addText('Your Text', textProps);
    setSelectedTool('select');
  }, [editor, textProps]);
  
  const handleAddImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && editor) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          await editor.addImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
    setSelectedTool('select');
  }, [editor]);
  
  const handleAddShape = useCallback((type: 'rect' | 'circle' | 'star') => {
    if (!editor) return;
    editor.addShape(type);
    setSelectedTool('select');
  }, [editor]);
  
  // Update text properties
  useEffect(() => {
    if (editor && selectedNode && selectedNode.getClassName() === 'Text') {
      editor.updateSelected(textProps);
    }
  }, [textProps, editor, selectedNode]);
  
  // Save design
  const handleSave = async () => {
    if (!editor) return;
    
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    
    try {
      if (mode === 'demo') {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setSaveSuccess(true);
        onSave?.({ demo: true });
        setTimeout(() => {
          onClose?.();
        }, 1500);
        return;
      }

      // Export print-ready PNG
      const printReadyPNG = editor.exportPNG(300);
      
      // Export design JSON
      const designJSON = editor.exportJSON();
      
      // Export thumbnail
      const exporter = new PrintReadyExporter(editor['stage'], {
        dpi: 300,
        colorMode: 'RGB',
        bleed: 3,
        cropMarks: true,
        format: 'custom',
        customWidth: width,
        customHeight: height,
      });
      const thumbnail = exporter.exportThumbnail();
      
      // Save to API
      const response = await fetch('/api/designs/save-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          designData: designJSON,
          printReadyFile: printReadyPNG,
          thumbnailFile: thumbnail,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSaveSuccess(true);
        onSave?.(data.data);
        
        // Auto-close after 2s
        setTimeout(() => {
          onClose?.();
        }, 2000);
      } else {
        setSaveError(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error: any) {
      logger.error('Save error', {
        error,
        productId,
        mode,
        message: error.message,
      });
      setSaveError('Erreur de connexion');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Download files
  const handleDownload = () => {
    if (!editor) return;
    
    const printReady = editor.exportPNG(300);
    
    // Download PNG
    const link = document.createElement('a');
    link.download = `${productName}-custom-print-ready.png`;
    link.href = printReady;
    link.click();
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-7xl h-[90vh] flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Customize: {productName}
            </h2>
            <p className="text-sm text-gray-600">
              Créez votre design personnalisé
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Sauvegardé !</span>
              </div>
            )}
            
            {saveError && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{saveError}</span>
              </div>
            )}
            
            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
            
            {onClose && (
              <Button onClick={onClose} variant="ghost" size="sm">
                ✕
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Toolbar (Left) */}
          <div className="w-20 bg-gray-900 flex flex-col items-center py-4 space-y-2">
            <ToolButton
              icon={<Type />}
              label="Text"
              active={selectedTool === 'text'}
              onClick={handleAddText}
            />
            
            <ToolButton
              icon={<ImageIcon />}
              label="Image"
              active={selectedTool === 'image'}
              onClick={handleAddImage}
            />
            
            <ToolButton
              icon={<Square />}
              label="Rectangle"
              onClick={() => handleAddShape('rect')}
            />
            
            <ToolButton
              icon={<Circle />}
              label="Circle"
              onClick={() => handleAddShape('circle')}
            />
            
            <ToolButton
              icon={<Star />}
              label="Star"
              onClick={() => handleAddShape('star')}
            />
            
            <div className="flex-1" />
            
            <ToolButton
              icon={<Undo2 />}
              label="Undo"
              disabled={!canUndo}
              onClick={() => editor?.undo()}
            />
            
            <ToolButton
              icon={<Redo2 />}
              label="Redo"
              disabled={!canRedo}
              onClick={() => editor?.redo()}
            />
            
            <ToolButton
              icon={<Trash2 />}
              label="Delete"
              disabled={!selectedNode}
              onClick={() => editor?.deleteSelected()}
              variant="danger"
            />
          </div>
          
          {/* Canvas (Center) */}
          <div className="flex-1 bg-gray-100 flex items-center justify-center p-8 overflow-auto">
            <div
              id="product-customizer-canvas"
              ref={containerRef}
              className="bg-white shadow-2xl rounded-lg"
              style={{ width, height }}
            />
          </div>
          
          {/* Properties Panel (Right) */}
          <div className="w-80 bg-white border-l p-6 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-gray-900">Properties</h3>
            
            {selectedNode?.getClassName() === 'Text' && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-700">Font Size</Label>
                  <Input
                    type="number"
                    value={textProps.fontSize}
                    onChange={(e) => setTextProps({ ...textProps, fontSize: parseInt(e.target.value) || 30 })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-sm text-gray-700">Font Family</Label>
                  <select
                    value={textProps.fontFamily}
                    onChange={(e) => setTextProps({ ...textProps, fontFamily: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                </div>
                
                <div>
                  <Label className="text-sm text-gray-700">Color</Label>
                  <Input
                    type="color"
                    value={textProps.fill}
                    onChange={(e) => setTextProps({ ...textProps, fill: e.target.value })}
                    className="mt-1 h-10"
                  />
                </div>
                
                <div>
                  <Label className="text-sm text-gray-700">Style</Label>
                  <div className="flex gap-2 mt-1">
                    <Button
                      size="sm"
                      variant={textProps.fontStyle.includes('bold') ? 'default' : 'outline'}
                      onClick={() => setTextProps({
                        ...textProps,
                        fontStyle: textProps.fontStyle.includes('bold') ? 'normal' : 'bold'
                      })}
                    >
                      <strong>B</strong>
                    </Button>
                    <Button
                      size="sm"
                      variant={textProps.fontStyle.includes('italic') ? 'default' : 'outline'}
                      onClick={() => setTextProps({
                        ...textProps,
                        fontStyle: textProps.fontStyle.includes('italic') ? 'normal' : 'italic'
                      })}
                    >
                      <em>I</em>
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {selectedNode?.getClassName() === 'Image' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Image sélectionnée. Utilisez les poignées pour redimensionner.
                </p>
              </div>
            )}
            
            {selectedNode?.getClassName() === 'Rect' || 
             selectedNode?.getClassName() === 'Circle' || 
             selectedNode?.getClassName() === 'Star' && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-700">Fill Color</Label>
                  <Input
                    type="color"
                    value={selectedNode.fill()}
                    onChange={(e) => editor?.updateSelected({ fill: e.target.value })}
                    className="mt-1 h-10"
                  />
                </div>
                
                <div>
                  <Label className="text-sm text-gray-700">Stroke Color</Label>
                  <Input
                    type="color"
                    value={selectedNode.stroke()}
                    onChange={(e) => editor?.updateSelected({ stroke: e.target.value })}
                    className="mt-1 h-10"
                  />
                </div>
                
                <div>
                  <Label className="text-sm text-gray-700">Stroke Width</Label>
                  <Input
                    type="number"
                    value={selectedNode.strokeWidth()}
                    onChange={(e) => editor?.updateSelected({ strokeWidth: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
            
            {!selectedNode && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm">
                  Sélectionnez un élément pour voir ses propriétés
                </p>
              </div>
            )}
            
            {/* Layer Controls */}
            {selectedNode && (
              <div className="mt-8 pt-8 border-t">
                <Label className="text-sm text-gray-700 mb-3 block">Layer</Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => editor?.bringToFront()}
                    className="flex-1"
                  >
                    To Front
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => editor?.sendToBack()}
                    className="flex-1"
                  >
                    To Back
                  </Button>
                </div>
                
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => editor?.copy()}
                    className="flex-1"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => editor?.paste()}
                    className="flex-1"
                  >
                    Paste
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom Bar - Info */}
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Shortcuts:</span> Ctrl+Z (Undo) • Ctrl+Y (Redo) • Del (Delete) • Ctrl+C/V (Copy/Paste)
          </div>
          
          <div className="text-sm text-gray-600">
            Export: <span className="font-medium">300 DPI PNG</span> (print-ready)
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Tool Button Component
 */
interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

function ToolButton({ icon, label, active, disabled, onClick, variant = 'default' }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative group w-14 h-14 rounded-lg flex items-center justify-center
        transition-all duration-200
        ${active 
          ? 'bg-blue-600 text-white shadow-lg' 
          : variant === 'danger'
            ? 'text-red-400 hover:bg-red-600 hover:text-white'
            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={label}
    >
      {icon}
      
      {/* Tooltip */}
      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
        {label}
      </div>
    </button>
  );
}

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const ProductCustomizer = memo(ProductCustomizerComponent);