/**
 * Header de l'éditeur
 */

'use client';

import { Save, Download, Undo2, Redo2, Grid, Ruler, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface EditorHeaderProps {
  onSave: () => void;
  onExport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  showGrid: boolean;
  onToggleGrid: () => void;
  showGuides: boolean;
  onToggleGuides: () => void;
  showRulers: boolean;
  onToggleRulers: () => void;
}

export function EditorHeader({
  onSave,
  onExport,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  showGrid,
  onToggleGrid,
  showGuides,
  onToggleGuides,
  showRulers,
  onToggleRulers,
}: EditorHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-white">Éditeur de Design</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          className="text-gray-300"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          className="text-gray-300"
        >
          <Redo2 className="w-4 h-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleGrid}
          className={cn('text-gray-300', showGrid && 'bg-gray-700')}
        >
          <Grid className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleGuides}
          className={cn('text-gray-300', showGuides && 'bg-gray-700')}
        >
          <Eye className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleRulers}
          className={cn('text-gray-300', showRulers && 'bg-gray-700')}
        >
          <Ruler className="w-4 h-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          className="border-gray-600 text-gray-300"
        >
          <Save className="w-4 h-4 mr-2" />
          Enregistrer
        </Button>
        <Button
          size="sm"
          onClick={onExport}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
      </div>
    </div>
  );
}


