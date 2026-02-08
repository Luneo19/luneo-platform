/**
 * Hook personnalisé pour gérer l'éditeur
 */

import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { Layer, EditorTool, HistoryState, TextTool, ShapeTool, ImageTool } from '../types';

export function useEditor() {
  const { toast } = useToast();
  const [selectedTool, setSelectedTool] = useState<EditorTool>('select');
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [showRulers, setShowRulers] = useState(true);

  const [textTool, setTextTool] = useState<TextTool>({
    fontFamily: 'Arial',
    fontSize: 24,
    fontWeight: 'normal',
    color: '#000000',
    align: 'left',
  });

  const [shapeTool, setShapeTool] = useState<ShapeTool>({
    type: 'rect',
    fill: '#3B82F6',
    stroke: '#000000',
    strokeWidth: 0,
    borderRadius: 0,
  });

  const [imageTool, setImageTool] = useState<ImageTool>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    opacity: 100,
  });

  const saveHistory = useCallback((newLayers: Layer[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      layers: newLayers,
      timestamp: Date.now(),
    });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleAddLayer = useCallback((type: Layer['type']) => {
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `${type === 'text' ? 'Texte' : type === 'image' ? 'Image' : 'Forme'} ${layers.length + 1}`,
      type,
      visible: true,
      locked: false,
      opacity: 100,
      x: 100,
      y: 100,
      width: type === 'text' ? 200 : 150,
      height: type === 'text' ? 50 : 150,
      rotation: 0,
      zIndex: layers.length,
      data: {},
    };

    const newLayers = [...layers, newLayer];
    setLayers(newLayers);
    setSelectedLayer(newLayer.id);
    saveHistory(newLayers);
    toast({ title: 'Succès', description: 'Calque ajouté' });
  }, [layers, saveHistory, toast]);

  const handleDeleteLayer = useCallback((layerId: string) => {
    const newLayers = layers.filter((l) => l.id !== layerId);
    setLayers(newLayers);
    setSelectedLayer(null);
    saveHistory(newLayers);
    toast({ title: 'Succès', description: 'Calque supprimé' });
  }, [layers, saveHistory, toast]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setLayers(history[newIndex].layers);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setLayers(history[newIndex].layers);
    }
  }, [history, historyIndex]);

  const handleSave = useCallback(async () => {
    try {
      await api.post('/api/v1/editor/projects', { layers });
      toast({ title: 'Succès', description: 'Projet enregistré' });
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur lors de l'enregistrement";
      logger.error('Failed to save project', { error });
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
      return { success: false, error: message };
    }
  }, [layers, toast]);

  const handleExport = useCallback(async (format: string) => {
    try {
      const data = await api.post<Blob | { url?: string }>(
        '/api/v1/editor/export',
        { layers, format },
        { responseType: 'blob' }
      );
      if (data instanceof Blob) {
        const url = window.URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `design.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else if (data && typeof (data as { url?: string }).url === 'string') {
        const a = document.createElement('a');
        a.href = (data as { url: string }).url;
        a.download = `design.${format}`;
        a.click();
      } else {
        throw new Error('Export response missing url or blob');
      }
      toast({ title: 'Succès', description: 'Export réussi' });
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur lors de l'export";
      logger.error('Failed to export', { error });
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
      return { success: false, error: message };
    }
  }, [layers, toast]);

  return {
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
    textTool,
    setTextTool,
    shapeTool,
    setShapeTool,
    imageTool,
    setImageTool,
    handleAddLayer,
    handleDeleteLayer,
    handleUndo,
    handleRedo,
    handleSave,
    handleExport,
    saveHistory,
  };
}



