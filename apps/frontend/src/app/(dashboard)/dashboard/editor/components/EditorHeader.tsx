/**
 * Editor header: logo, file name, save, export dropdown, undo/redo, view options
 */

'use client';

import { Save, Download, Undo2, Redo2, Grid, Ruler, Eye, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { ExportFormat } from '../types';

interface EditorHeaderProps {
  fileName: string;
  onFileNameChange: (name: string) => void;
  onSave: () => void;
  onExport: (format: ExportFormat) => void;
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

const EXPORT_OPTIONS: { format: ExportFormat; label: string }[] = [
  { format: 'png', label: 'PNG' },
  { format: 'jpg', label: 'JPG' },
  { format: 'svg', label: 'SVG' },
  { format: 'pdf', label: 'PDF' },
];

export function EditorHeader({
  fileName,
  onFileNameChange,
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
    <div className="flex items-center justify-between gap-4 px-4 py-3 bg-zinc-900 border-b border-zinc-700">
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-lg font-semibold text-white">Luneo</span>
          <span className="text-zinc-500 text-sm">Editor</span>
        </div>
        <Input
          value={fileName}
          onChange={(e) => onFileNameChange(e.target.value)}
          className="max-w-[220px] h-9 bg-zinc-800 border-zinc-600 text-zinc-200 placeholder:text-zinc-500 text-sm"
          placeholder="File name"
        />
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800"
          onClick={onUndo}
          disabled={!canUndo}
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800"
          onClick={onRedo}
          disabled={!canRedo}
        >
          <Redo2 className="w-4 h-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 bg-zinc-700 mx-1" />
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-9 w-9', showGrid ? 'text-blue-400 bg-zinc-800' : 'text-zinc-400 hover:text-white hover:bg-zinc-800')}
          onClick={onToggleGrid}
        >
          <Grid className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-9 w-9', showGuides ? 'text-blue-400 bg-zinc-800' : 'text-zinc-400 hover:text-white hover:bg-zinc-800')}
          onClick={onToggleGuides}
        >
          <Eye className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-9 w-9', showRulers ? 'text-blue-400 bg-zinc-800' : 'text-zinc-400 hover:text-white hover:bg-zinc-800')}
          onClick={onToggleRulers}
        >
          <Ruler className="w-4 h-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 bg-zinc-700 mx-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          className="h-9 border-zinc-600 text-zinc-200 hover:bg-zinc-800"
        >
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-9 bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Export
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
            {EXPORT_OPTIONS.map(({ format, label }) => (
              <DropdownMenuItem
                key={format}
                onClick={() => onExport(format)}
                className="text-zinc-200 focus:bg-zinc-700"
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
