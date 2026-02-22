'use client';

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CanvasEditor as CanvasEditorEngine, EditorConfig } from '@/lib/canvas-editor/CanvasEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Type,
  Image,
  Square,
  Circle,
  Star,
  Hexagon,
  Undo2,
  Redo2,
  Trash2,
  Copy,
  ClipboardPaste,
  Download,
  ArrowUp,
  ArrowDown,
  Palette,
} from 'lucide-react';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

interface CanvasEditorProps {
  width?: number;
  height?: number;
  backgroundImage?: string;
  onSave?: (data: { json: string; png: string }) => void;
  onSelectionChange?: (selected: boolean) => void;
}

interface SelectedNodeProps {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  text?: string;
}

// ============================================================================
// TOOLBAR COMPONENT
// ============================================================================

interface ToolbarProps {
  onAddText: () => void;
  onAddImage: () => void;
  onAddShape: (type: 'rect' | 'circle' | 'star' | 'polygon') => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onExport: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
}

function EditorToolbar({
  onAddText,
  onAddImage,
  onAddShape,
  onUndo,
  onRedo,
  onDelete,
  onCopy,
  onPaste,
  onBringToFront,
  onSendToBack,
  onExport,
  canUndo,
  canRedo,
  hasSelection,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
      {/* Add Elements */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2 dark:border-gray-600">
        <Button variant="ghost" size="sm" onClick={onAddText} aria-label="Ajouter du texte">
          <Type className="h-4 w-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="sm" onClick={onAddImage} aria-label="Ajouter une image">
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image className="h-4 w-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onAddShape('rect')} aria-label="Ajouter un rectangle">
          <Square className="h-4 w-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onAddShape('circle')} aria-label="Ajouter un cercle">
          <Circle className="h-4 w-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onAddShape('star')} aria-label="Ajouter une étoile">
          <Star className="h-4 w-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onAddShape('polygon')} aria-label="Ajouter un polygone">
          <Hexagon className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      {/* History */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2 dark:border-gray-600">
        <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo} aria-label="Annuler (Ctrl+Z)">
          <Undo2 className="h-4 w-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="sm" onClick={onRedo} disabled={!canRedo} aria-label="Rétablir (Ctrl+Y)">
          <Redo2 className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      {/* Selection Actions */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2 dark:border-gray-600">
        <Button variant="ghost" size="sm" onClick={onCopy} disabled={!hasSelection} aria-label="Copier (Ctrl+C)">
          <Copy className="h-4 w-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="sm" onClick={onPaste} aria-label="Coller (Ctrl+V)">
          <ClipboardPaste className="h-4 w-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} disabled={!hasSelection} aria-label="Supprimer">
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      {/* Layer Order */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2 dark:border-gray-600">
        <Button variant="ghost" size="sm" onClick={onBringToFront} disabled={!hasSelection} aria-label="Mettre au premier plan">
          <ArrowUp className="h-4 w-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="sm" onClick={onSendToBack} disabled={!hasSelection} aria-label="Envoyer à l'arrière-plan">
          <ArrowDown className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      {/* Export */}
      <div className="ml-auto">
        <Button variant="default" size="sm" onClick={onExport}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// PROPERTIES PANEL
// ============================================================================

interface PropertiesPanelProps {
  selectedProps: SelectedNodeProps | null;
  onUpdateProps: (props: Partial<SelectedNodeProps>) => void;
}

function PropertiesPanel({ selectedProps, onUpdateProps }: PropertiesPanelProps) {
  if (!selectedProps) {
    return (
      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <p className="text-sm text-gray-500">Select an element to edit its properties</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
      <h3 className="text-sm font-medium">Properties</h3>

      {/* Text Properties */}
      {selectedProps.text !== undefined && (
        <div className="space-y-2">
          <label className="text-xs text-gray-500">Text</label>
          <Input
            value={selectedProps.text}
            onChange={(e) => onUpdateProps({ text: e.target.value })}
            placeholder="Enter text"
          />
        </div>
      )}

      {/* Font Size */}
      {selectedProps.fontSize !== undefined && (
        <div className="space-y-2">
          <label className="text-xs text-gray-500">Font Size: {selectedProps.fontSize}px</label>
          <Slider
            value={[selectedProps.fontSize]}
            onValueChange={(v) => onUpdateProps({ fontSize: v[0] })}
            min={8}
            max={120}
            step={1}
          />
        </div>
      )}

      {/* Fill Color */}
      {selectedProps.fill !== undefined && (
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs text-gray-500">
            <Palette className="h-3 w-3" /> Fill Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={selectedProps.fill}
              onChange={(e) => onUpdateProps({ fill: e.target.value })}
              className="h-8 w-8 cursor-pointer rounded border"
            />
            <Input
              value={selectedProps.fill}
              onChange={(e) => onUpdateProps({ fill: e.target.value })}
              className="flex-1"
              placeholder="#000000"
            />
          </div>
        </div>
      )}

      {/* Stroke Color */}
      {selectedProps.stroke !== undefined && (
        <div className="space-y-2">
          <label className="text-xs text-gray-500">Stroke Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={selectedProps.stroke}
              onChange={(e) => onUpdateProps({ stroke: e.target.value })}
              className="h-8 w-8 cursor-pointer rounded border"
            />
            <Input
              value={selectedProps.stroke}
              onChange={(e) => onUpdateProps({ stroke: e.target.value })}
              className="flex-1"
              placeholder="#000000"
            />
          </div>
        </div>
      )}

      {/* Stroke Width */}
      {selectedProps.strokeWidth !== undefined && (
        <div className="space-y-2">
          <label className="text-xs text-gray-500">Stroke Width: {selectedProps.strokeWidth}px</label>
          <Slider
            value={[selectedProps.strokeWidth]}
            onValueChange={(v) => onUpdateProps({ strokeWidth: v[0] })}
            min={0}
            max={20}
            step={1}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function CanvasEditorContent({
  width = 800,
  height = 600,
  backgroundImage,
  onSave,
  onSelectionChange,
}: CanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<CanvasEditorEngine | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [selectedProps, setSelectedProps] = useState<SelectedNodeProps | null>(null);

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current) return;

    const containerId = `canvas-editor-${Date.now()}`;
    containerRef.current.id = containerId;

    const config: EditorConfig = {
      width,
      height,
      dpi: 300,
      colorMode: 'RGB',
      bleed: 0,
      containerId,
    };

    try {
      const editor = new CanvasEditorEngine(config);
      editorRef.current = editor;

      // Set up callbacks
      editor.onSelection((node) => {
        setHasSelection(!!node);
        onSelectionChange?.(!!node);

        if (node) {
          const attrs = node.getAttrs();
          setSelectedProps({
            fill: attrs.fill,
            stroke: attrs.stroke,
            strokeWidth: attrs.strokeWidth,
            fontSize: attrs.fontSize,
            fontFamily: attrs.fontFamily,
            text: attrs.text,
          });
        } else {
          setSelectedProps(null);
        }
      });

      editor.onHistory((undo, redo) => {
        setCanUndo(undo);
        setCanRedo(redo);
      });

      // Load background if provided
      if (backgroundImage) {
        editor.setBackgroundImage(backgroundImage).catch((err) => {
          logger.error('Failed to load background image:', err);
          editor.fillWithPattern(width, height);
        });
      } else {
        editor.fillWithPattern(width, height);
      }

      logger.info('[CanvasEditor] Initialized');
    } catch (error) {
      logger.error('[CanvasEditor] Failed to initialize:', error);
    }

    return () => {
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, [width, height, backgroundImage, onSelectionChange]);

  // Handlers
  const handleAddText = useCallback(() => {
    editorRef.current?.addText('Your Text Here', {
      fontSize: 32,
      fill: '#333333',
    });
  }, []);

  const handleAddImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      editorRef.current?.addImage(dataUrl).catch((err) => {
        logger.error('Failed to add image:', err);
      });
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  }, []);

  const handleAddShape = useCallback((type: 'rect' | 'circle' | 'star' | 'polygon') => {
    editorRef.current?.addShape(type);
  }, []);

  const handleUndo = useCallback(() => {
    editorRef.current?.undo();
  }, []);

  const handleRedo = useCallback(() => {
    editorRef.current?.redo();
  }, []);

  const handleDelete = useCallback(() => {
    editorRef.current?.deleteSelected();
  }, []);

  const handleCopy = useCallback(() => {
    editorRef.current?.copy();
  }, []);

  const handlePaste = useCallback(() => {
    editorRef.current?.paste();
  }, []);

  const handleBringToFront = useCallback(() => {
    editorRef.current?.bringToFront();
  }, []);

  const handleSendToBack = useCallback(() => {
    editorRef.current?.sendToBack();
  }, []);

  const handleExport = useCallback(() => {
    if (!editorRef.current) return;

    const json = editorRef.current.exportJSON();
    const png = editorRef.current.exportPNG(300);

    if (onSave) {
      onSave({ json, png });
    } else {
      // Download PNG directly
      const link = document.createElement('a');
      link.download = `design-${Date.now()}.png`;
      link.href = png;
      link.click();
    }
  }, [onSave]);

  const handleUpdateProps = useCallback((props: Partial<SelectedNodeProps>) => {
    editorRef.current?.updateSelected(props);
    setSelectedProps((prev) => (prev ? { ...prev, ...props } : null));
  }, []);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Toolbar */}
      <EditorToolbar
        onAddText={handleAddText}
        onAddImage={handleAddImage}
        onAddShape={handleAddShape}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDelete={handleDelete}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
        onExport={handleExport}
        canUndo={canUndo}
        canRedo={canRedo}
        hasSelection={hasSelection}
      />

      {/* Main Content */}
      <div className="flex flex-1 gap-4">
        {/* Canvas Container */}
        <div className="flex-1 overflow-auto rounded-lg bg-gray-200 p-4 dark:bg-gray-900">
          <div
            ref={containerRef}
            className="mx-auto shadow-lg"
            style={{
              width,
              height,
              backgroundColor: '#ffffff',
            }}
          />
        </div>

        {/* Properties Panel */}
        <div className="w-64 shrink-0">
          <PropertiesPanel selectedProps={selectedProps} onUpdateProps={handleUpdateProps} />
        </div>
      </div>

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

const CanvasEditorContentMemo = memo(CanvasEditorContent);

export default function CanvasEditor(props: CanvasEditorProps) {
  return (
    <ErrorBoundary componentName="CanvasEditor">
      <CanvasEditorContentMemo {...props} />
    </ErrorBoundary>
  );
}
