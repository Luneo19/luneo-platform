/**
 * Hook for the visual editor: objects, history, tools, export, save, AI
 */

import { useState, useCallback, useRef } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { useToast } from '@/hooks/use-toast';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type {
  CanvasObject,
  EditorTool,
  HistoryState,
  ShapeKind,
  ExportFormat,
  EditorTemplate,
} from '../types';

const defaultTextTool = {
  fontFamily: 'Arial',
  fontSize: 24,
  fontWeight: 'normal',
  color: '#000000',
  align: 'left' as const,
};

const defaultShapeTool = {
  type: 'rect' as ShapeKind,
  fill: '#3B82F6',
  stroke: '#1e40af',
  strokeWidth: 0,
  borderRadius: 0,
};

function createId() {
  return `obj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createObject(
  type: CanvasObject['type'],
  overrides: Partial<CanvasObject> & { shapeKind?: ShapeKind }
): CanvasObject {
  const base: CanvasObject = {
    id: createId(),
    type,
    x: 120,
    y: 120,
    width: type === 'text' ? 200 : 150,
    height: type === 'text' ? 40 : 150,
    rotation: 0,
    fill: type === 'text' ? '#000000' : defaultShapeTool.fill,
    opacity: 1,
    name: `${type} ${Date.now()}`,
    visible: true,
    locked: false,
    zIndex: 0,
  };
  if (type === 'text') {
    base.text = 'Text';
    base.fontSize = 24;
    base.fontFamily = 'Arial';
    base.align = 'left';
  }
  if (type === 'shape' && overrides.shapeKind) base.shapeKind = overrides.shapeKind;
  return { ...base, ...overrides };
}

export function useEditor() {
  const { t } = useI18n();
  const { toast } = useToast();
  const stageRef = useRef<{ toDataURL: (opts?: { mimeType?: string; quality?: number }) => string } | null>(null);

  const [fileName, setFileName] = useState('Untitled design');
  const [selectedTool, setSelectedTool] = useState<EditorTool>('select');
  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [showRulers, setShowRulers] = useState(false);
  const [textTool, setTextTool] = useState(defaultTextTool);
  const [shapeTool, setShapeTool] = useState(defaultShapeTool);
  const [drawColor, setDrawColor] = useState('#000000');
  const [drawStrokeWidth, setDrawStrokeWidth] = useState(4);

  const pushHistory = useCallback((newObjects: CanvasObject[]) => {
    setHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      next.push({ objects: newObjects, timestamp: Date.now() });
      return next.slice(-50);
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const updateObject = useCallback((id: string, attrs: Partial<CanvasObject>) => {
    setObjects((prev) => {
      const next = prev.map((o) => (o.id === id ? { ...o, ...attrs } : o));
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const addObject = useCallback((obj: CanvasObject) => {
    const withZ = { ...obj, zIndex: objects.length };
    setObjects((prev) => {
      const next = [...prev, withZ];
      pushHistory(next);
      return next;
    });
    setSelectedId(obj.id);
    toast({ title: t('editor.added'), description: t('editor.addedToCanvas', { type: obj.type }) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objects.length, pushHistory, toast]);

  const addText = useCallback(() => {
    addObject(
      createObject('text', {
        text: 'Text',
        fontSize: textTool.fontSize,
        fontFamily: textTool.fontFamily,
        fill: textTool.color,
        align: textTool.align as 'left' | 'center' | 'right',
      })
    );
  }, [addObject, textTool]);

  const addShape = useCallback((kind: ShapeKind) => {
    addObject(
      createObject('shape', {
        shapeKind: kind,
        fill: shapeTool.fill,
        stroke: shapeTool.stroke,
        strokeWidth: shapeTool.strokeWidth,
      })
    );
  }, [addObject, shapeTool]);

  const addImage = useCallback((src: string) => {
    addObject(
      createObject('image', { src, width: 200, height: 200 })
    );
  }, [addObject]);

  const addDrawLayer = useCallback((points: number[]) => {
    if (points.length < 4) return;
    addObject(
      createObject('draw', {
        points,
        fill: drawColor,
        strokeWidth: drawStrokeWidth,
        width: 0,
        height: 0,
      })
    );
  }, [addObject, drawColor, drawStrokeWidth]);

  const deleteObject = useCallback((id: string) => {
    setObjects((prev) => {
      const next = prev.filter((o) => o.id !== id);
      pushHistory(next);
      return next;
    });
    if (selectedId === id) setSelectedId(null);
    toast({ title: t('editor.deleted'), description: t('editor.objectRemoved') });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pushHistory, selectedId, toast]);

  const reorderObject = useCallback((id: string, direction: 'up' | 'down') => {
    setObjects((prev) => {
      const sorted = [...prev].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex((o) => o.id === id);
      if (idx < 0) return prev;
      const swapIdx = direction === 'up' ? idx + 1 : idx - 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
      const a = sorted[idx];
      const b = sorted[swapIdx];
      const next = prev.map((o) => {
        if (o.id === a.id) return { ...o, zIndex: b.zIndex };
        if (o.id === b.id) return { ...o, zIndex: a.zIndex };
        return o;
      });
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const setObjectsWithHistory = useCallback((next: CanvasObject[]) => {
    setObjects(next);
    pushHistory(next);
  }, [pushHistory]);

  const applyTemplate = useCallback((template: EditorTemplate) => {
    const withIds = template.objects.map((o, i) => ({
      ...o,
      id: createId(),
      zIndex: objects.length + i,
      x: o.x + 0,
      y: o.y + 0,
    })) as CanvasObject[];
    setObjects((prev) => {
      const next = [...prev, ...withIds];
      pushHistory(next);
      return next;
    });
    toast({ title: t('editor.templateApplied'), description: template.name });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objects.length, pushHistory, toast]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setObjects(history[newIndex].objects);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setObjects(history[newIndex].objects);
    }
  }, [history, historyIndex]);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      const stage = stageRef.current;
      if (!stage?.toDataURL) {
        toast({ title: t('common.error'), description: t('editor.canvasNotReady'), variant: 'destructive' });
        return;
      }
      try {
        if (format === 'png') {
          const dataUrl = stage.toDataURL({});
          downloadDataUrl(dataUrl, `${fileName}.png`);
        } else if (format === 'jpg') {
          const dataUrl = stage.toDataURL({ mimeType: 'image/jpeg', quality: 0.9 });
          downloadDataUrl(dataUrl, `${fileName}.jpg`);
        } else if (format === 'svg') {
          const width = (stage as { width?: () => number }).width?.() ?? 800;
          const height = (stage as { height?: () => number }).height?.() ?? 600;
          let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
          svgContent += `<rect width="${width}" height="${height}" fill="white"/>`;
          objects
            .filter((o) => o.visible !== false)
            .forEach((obj) => {
              const x = obj.x;
              const y = obj.y;
              const w = obj.width ?? 0;
              const h = obj.height ?? 0;
              const fill = obj.fill ?? '#000';
              const opacity = obj.opacity ?? 1;
              const rotation = obj.rotation ?? 0;
              const cx = x + w / 2;
              const cy = y + h / 2;
              if (obj.type === 'shape' && obj.shapeKind === 'rect') {
                svgContent += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" opacity="${opacity}" transform="rotate(${rotation} ${cx} ${cy})"/>`;
              } else if (obj.type === 'shape' && obj.shapeKind === 'circle') {
                const r = Math.min(w, h) / 2;
                svgContent += `<circle cx="${x + r}" cy="${y + r}" r="${r}" fill="${fill}" opacity="${opacity}" transform="rotate(${rotation} ${x + r} ${y + r})"/>`;
              } else if (obj.type === 'text') {
                const fontSize = obj.fontSize ?? 24;
                const fontFamily = obj.fontFamily ?? 'Arial';
                const text = (obj.text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                svgContent += `<text x="${x}" y="${y + fontSize}" font-family="${fontFamily}" font-size="${fontSize}" fill="${fill}" opacity="${opacity}" transform="rotate(${rotation} ${cx} ${cy})">${text}</text>`;
              }
            });
          svgContent += '</svg>';
          const blob = new Blob([svgContent], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${fileName}.svg`;
          a.click();
          URL.revokeObjectURL(url);
        } else if (format === 'pdf') {
          const dataUrl = (stage as { toDataURL: (opts?: { pixelRatio?: number }) => string }).toDataURL({ pixelRatio: 2 });
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(`
              <html><head><title>${fileName ?? 'design'}</title>
              <style>@media print { body { margin: 0; } img { max-width: 100%; height: auto; } }</style>
              </head><body>
              <img src="${dataUrl}" onload="window.print();window.close();" alt="Design" />
              </body></html>
            `);
            printWindow.document.close();
            toast({ title: t('editor.exported'), description: t('editor.pdfReadyToPrint') });
          } else {
            downloadDataUrl(dataUrl, `${fileName}.png`);
            toast({ title: t('common.error'), description: t('editor.pdfBlockedUsePng') });
          }
          return;
        }
        toast({ title: t('editor.exported'), description: t('editor.formatDownloaded', { format: format.toUpperCase() }) });
      } catch (e) {
        logger.error('Export failed', { error: e });
        toast({ title: t('editor.exportFailed'), variant: 'destructive' });
      }
    },
    [fileName, objects, toast, t]
  );

  const handleSaveToLibrary = useCallback(async () => {
    const stage = stageRef.current;
    if (!stage?.toDataURL) {
      toast({ title: t('common.error'), description: t('editor.canvasNotReady'), variant: 'destructive' });
      return { success: false };
    }
    try {
      const dataUrl = stage.toDataURL({ mimeType: 'image/png', quality: 0.9 });
      const res = await endpoints.designs.create({
        name: fileName,
        prompt: fileName,
        previewUrl: dataUrl,
        status: 'COMPLETED',
      } as { name: string; prompt: string; previewUrl: string; status: string });
      toast({ title: t('common.saved'), description: t('editor.designSavedToLibrary') });
      return { success: true, design: res };
    } catch (error: unknown) {
      const message = getErrorDisplayMessage(error);
      logger.error('Save to library failed', { error });
      toast({ title: t('common.error'), description: message, variant: 'destructive' });
      return { success: false };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileName, toast]);

  const toggleVisibility = useCallback((id: string) => {
    setObjects((prev) => prev.map((o) => (o.id === id ? { ...o, visible: !o.visible } : o)));
  }, []);

  const toggleLock = useCallback((id: string) => {
    setObjects((prev) => prev.map((o) => (o.id === id ? { ...o, locked: !o.locked } : o)));
  }, []);

  return {
    stageRef,
    fileName,
    setFileName,
    selectedTool,
    setSelectedTool,
    objects,
    setObjects,
    setObjectsWithHistory,
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
    textTool,
    setTextTool,
    shapeTool,
    setShapeTool,
    drawColor,
    setDrawColor,
    drawStrokeWidth,
    setDrawStrokeWidth,
    updateObject,
    addText,
    addShape,
    addImage,
    addDrawLayer,
    deleteObject,
    reorderObject,
    applyTemplate,
    handleUndo,
    handleRedo,
    handleExport,
    handleSaveToLibrary,
    toggleVisibility,
    toggleLock,
  };
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
