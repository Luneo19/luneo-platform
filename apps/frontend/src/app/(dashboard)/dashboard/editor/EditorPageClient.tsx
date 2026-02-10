/**
 * Visual editor page client (Canva-like): header, tools, canvas, properties, layers, templates, AI
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { EditorHeader } from './components/EditorHeader';
import { EditorToolbar } from './components/EditorToolbar';
import { EditorCanvas } from './components/EditorCanvas';
import { LayersPanel } from './components/LayersPanel';
import { PropertiesPanel } from './components/PropertiesPanel';
import { AIGenerateModal } from './components/modals/AIGenerateModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { LayoutGrid } from 'lucide-react';
import { useEditor } from './hooks/useEditor';
import { EDITOR_TEMPLATES } from './constants/templates';
import type { ExportFormat } from './types';

export function EditorPageClient() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const {
    stageRef,
    fileName,
    setFileName,
    selectedTool,
    setSelectedTool,
    objects,
    setObjects,
    selectedId,
    setSelectedId,
    history,
    historyIndex,
    zoom,
    setZoom,
    showGrid,
    setShowGrid,
    showGuides,
    setShowGuides,
    showRulers,
    setShowRulers,
    updateObject,
    addText,
    addShape,
    addImage,
    deleteObject,
    reorderObject,
    applyTemplate,
    handleUndo,
    handleRedo,
    handleExport,
    handleSaveToLibrary,
    toggleVisibility,
    toggleLock,
  } = useEditor();

  const selectedObject = objects.find((o) => o.id === selectedId) ?? null;

  const handleExportFormat = useCallback(
    (format: ExportFormat) => {
      handleExport(format);
    },
    [handleExport]
  );

  const handleSave = useCallback(() => {
    handleSaveToLibrary();
  }, [handleSaveToLibrary]);

  const handleAddImageClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      addImage(url);
      e.target.value = '';
    },
    [addImage]
  );

  const handleAIGenerated = useCallback(
    (imageUrl: string) => {
      addImage(imageUrl);
    },
    [addImage]
  );

  const handleDrawMode = useCallback(() => {
    addText();
  }, [addText]);

  return (
    <ErrorBoundary level="page" componentName="EditorPageClient">
      <div className="flex flex-col h-screen bg-zinc-950">
        <EditorHeader
          fileName={fileName}
          onFileNameChange={setFileName}
          onSave={handleSave}
          onExport={handleExportFormat}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
          showGuides={showGuides}
          onToggleGuides={() => setShowGuides(!showGuides)}
          showRulers={showRulers}
          onToggleRulers={() => setShowRulers(!showRulers)}
        />

        <div className="flex flex-1 overflow-hidden">
          <EditorToolbar
            selectedTool={selectedTool}
            onSelectTool={setSelectedTool}
            onAddText={addText}
            onAddShape={addShape}
            onAddImageClick={handleAddImageClick}
            onGenerateAIClick={() => setShowAIModal(true)}
            onDrawMode={handleDrawMode}
          />

          <EditorCanvas
            objects={objects}
            selectedId={selectedId}
            zoom={zoom}
            showGrid={showGrid}
            showGuides={showGuides}
            onSelect={setSelectedId}
            onObjectChange={updateObject}
            stageRef={stageRef}
          />

          <div className="flex flex-col shrink-0 w-[300px] min-h-0 border-l border-zinc-700">
            <LayersPanel
              objects={objects}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onToggleVisibility={toggleVisibility}
              onToggleLock={toggleLock}
              onDelete={deleteObject}
              onReorder={reorderObject}
            />
            <PropertiesPanel selected={selectedObject} onChange={updateObject} />
          </div>
        </div>

        <div className="flex items-center gap-4 px-4 py-2 bg-zinc-900 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Zoom</span>
            <Slider
              value={[zoom]}
              onValueChange={([v]) => setZoom(v)}
              min={25}
              max={200}
              step={5}
              className="w-28"
            />
            <span className="text-xs text-zinc-400 w-10">{zoom}%</span>
          </div>
          <DropdownMenu open={showTemplates} onOpenChange={setShowTemplates}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-zinc-600 text-zinc-300 h-8">
                <LayoutGrid className="w-4 h-4 mr-2" />
                Templates
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-zinc-800 border-zinc-700 max-h-80">
              <div className="px-2 py-1.5 text-xs font-medium text-zinc-500">Jewelry</div>
              {EDITOR_TEMPLATES.filter((t) => t.sector === 'jewelry').map((t) => (
                <DropdownMenuItem
                  key={t.id}
                  onClick={() => { applyTemplate(t); setShowTemplates(false); }}
                  className="text-zinc-200 focus:bg-zinc-700"
                >
                  {t.name}
                </DropdownMenuItem>
              ))}
              <div className="px-2 py-1.5 text-xs font-medium text-zinc-500 mt-1">Watches</div>
              {EDITOR_TEMPLATES.filter((t) => t.sector === 'watches').map((t) => (
                <DropdownMenuItem
                  key={t.id}
                  onClick={() => { applyTemplate(t); setShowTemplates(false); }}
                  className="text-zinc-200 focus:bg-zinc-700"
                >
                  {t.name}
                </DropdownMenuItem>
              ))}
              <div className="px-2 py-1.5 text-xs font-medium text-zinc-500 mt-1">Glasses</div>
              {EDITOR_TEMPLATES.filter((t) => t.sector === 'glasses').map((t) => (
                <DropdownMenuItem
                  key={t.id}
                  onClick={() => { applyTemplate(t); setShowTemplates(false); }}
                  className="text-zinc-200 focus:bg-zinc-700"
                >
                  {t.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <AIGenerateModal
          open={showAIModal}
          onClose={() => setShowAIModal(false)}
          onGenerated={handleAIGenerated}
        />
      </div>
    </ErrorBoundary>
  );
}
