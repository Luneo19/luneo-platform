/**
 * Barre d'outils de l'éditeur
 */

'use client';

import { MousePointer2, Type, Image as ImageIcon, Square, Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { EditorTool } from '../types';

interface EditorToolbarProps {
  selectedTool: EditorTool;
  onSelectTool: (tool: EditorTool) => void;
  onAddText: () => void;
  onAddImage: () => void;
  onAddShape: () => void;
}

export function EditorToolbar({
  selectedTool,
  onSelectTool,
  onAddText,
  onAddImage,
  onAddShape,
}: EditorToolbarProps) {
  const tools = [
    { id: 'select' as EditorTool, icon: MousePointer2, label: 'Sélection' },
    { id: 'text' as EditorTool, icon: Type, label: 'Texte' },
    { id: 'image' as EditorTool, icon: ImageIcon, label: 'Image' },
    { id: 'shape' as EditorTool, icon: Square, label: 'Forme' },
    { id: 'hand' as EditorTool, icon: Hand, label: 'Main' },
  ];

  return (
    <div className="flex flex-col gap-2 p-4 bg-white border-r border-gray-200">
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <Button
            key={tool.id}
            variant="ghost"
            size="sm"
            onClick={() => {
              onSelectTool(tool.id);
              if (tool.id === 'text') onAddText();
              else if (tool.id === 'image') onAddImage();
              else if (tool.id === 'shape') onAddShape();
            }}
            className={cn(
              'w-12 h-12 justify-center text-gray-700',
              selectedTool === tool.id && 'bg-gray-100 text-gray-900'
            )}
            title={tool.label}
          >
            <Icon className="w-5 h-5" />
          </Button>
        );
      })}
    </div>
  );
}



