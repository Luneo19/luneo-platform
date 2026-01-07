/**
 * Client Component pour Editor
 * Version professionnelle simplifiée
 */

'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { EditorHeader } from './components/EditorHeader';
import { EditorToolbar } from './components/EditorToolbar';
import { EditorCanvas } from './components/EditorCanvas';
import { LayersPanel } from './components/LayersPanel';
import { ExportModal } from './components/modals/ExportModal';
import { useEditor } from './hooks/useEditor';
import { Slider } from '@/components/ui/slider';

export function EditorPageClient() {
  const { toast } = useToast();
  const [showExportModal, setShowExportModal] = useState(false);

  const {
    selectedTool,
    setSelectedTool,
    layers,
    setLayers,
    selectedLayer,
    setSelectedLayer,
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
    handleAddLayer,
    handleDeleteLayer,
    handleUndo,
    handleRedo,
    handleSave,
    handleExport,
  } = useEditor();

  const handleExportClick = () => {
    setShowExportModal(true);
  };

  const handleExportConfirm = async (format: string) => {
    setShowExportModal(false);
    await handleExport(format);
  };

  const handleToggleVisibility = (layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l))
    );
  };

  const handleToggleLock = (layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, locked: !l.locked } : l))
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <EditorHeader
        onSave={handleSave}
        onExport={handleExportClick}
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
          onAddText={() => handleAddLayer('text')}
          onAddImage={() => handleAddLayer('image')}
          onAddShape={() => handleAddLayer('shape')}
        />
        <EditorCanvas
          layers={layers}
          selectedLayer={selectedLayer}
          zoom={zoom}
          showGrid={showGrid}
          showGuides={showGuides}
          onSelectLayer={setSelectedLayer}
        />
        <LayersPanel
          layers={layers}
          selectedLayer={selectedLayer}
          onSelectLayer={setSelectedLayer}
          onToggleVisibility={handleToggleVisibility}
          onToggleLock={handleToggleLock}
          onDeleteLayer={handleDeleteLayer}
        />
      </div>
      <div className="p-2 bg-gray-800 border-t border-gray-700 flex items-center gap-4">
        <span className="text-sm text-gray-400">Zoom:</span>
        <Slider
          value={[zoom]}
          onValueChange={([value]) => setZoom(value)}
          min={25}
          max={200}
          step={5}
          className="w-32"
        />
        <span className="text-sm text-white w-12">{zoom}%</span>
      </div>
      <ExportModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportConfirm}
      />
    </div>
  );
}


