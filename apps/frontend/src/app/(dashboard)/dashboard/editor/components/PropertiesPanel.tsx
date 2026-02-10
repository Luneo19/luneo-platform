/**
 * Properties panel for the selected object
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Type } from 'lucide-react';
import type { CanvasObject } from '../types';

interface PropertiesPanelProps {
  selected: CanvasObject | null;
  onChange: (id: string, attrs: Partial<CanvasObject>) => void;
}

const FONT_FAMILIES = ['Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Helvetica'];

export function PropertiesPanel({ selected, onChange }: PropertiesPanelProps) {
  if (!selected) {
    return (
      <div className="w-64 flex flex-col border-l border-zinc-700 bg-zinc-900/80 p-4">
        <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2 mb-2">
          <Palette className="w-4 h-4" />
          Properties
        </h3>
        <p className="text-xs text-zinc-500">Select an object to edit its properties.</p>
      </div>
    );
  }

  const id = selected.id;

  return (
    <div className="w-64 flex flex-col border-l border-zinc-700 bg-zinc-900/80 overflow-y-auto">
      <div className="p-4 border-b border-zinc-700">
        <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Properties
        </h3>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-zinc-400">X</Label>
            <Input
              type="number"
              value={Math.round(selected.x)}
              onChange={(e) => onChange(id, { x: Number(e.target.value) })}
              className="h-8 bg-zinc-800 border-zinc-600 text-zinc-200 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs text-zinc-400">Y</Label>
            <Input
              type="number"
              value={Math.round(selected.y)}
              onChange={(e) => onChange(id, { y: Number(e.target.value) })}
              className="h-8 bg-zinc-800 border-zinc-600 text-zinc-200 text-xs"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-zinc-400">Width</Label>
            <Input
              type="number"
              value={Math.round(selected.width)}
              onChange={(e) => onChange(id, { width: Number(e.target.value) })}
              className="h-8 bg-zinc-800 border-zinc-600 text-zinc-200 text-xs"
              min={10}
            />
          </div>
          <div>
            <Label className="text-xs text-zinc-400">Height</Label>
            <Input
              type="number"
              value={Math.round(selected.height)}
              onChange={(e) => onChange(id, { height: Number(e.target.value) })}
              className="h-8 bg-zinc-800 border-zinc-600 text-zinc-200 text-xs"
              min={10}
            />
          </div>
        </div>
        <div>
          <Label className="text-xs text-zinc-400">Rotation (°)</Label>
          <Input
            type="number"
            value={selected.rotation}
            onChange={(e) => onChange(id, { rotation: Number(e.target.value) })}
            className="h-8 bg-zinc-800 border-zinc-600 text-zinc-200 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs text-zinc-400">Fill / Color</Label>
          <div className="flex gap-2 mt-1">
            <input
              type="color"
              value={selected.fill}
              onChange={(e) => onChange(id, { fill: e.target.value })}
              className="h-8 w-10 rounded border border-zinc-600 cursor-pointer bg-zinc-800"
            />
            <Input
              value={selected.fill}
              onChange={(e) => onChange(id, { fill: e.target.value })}
              className="h-8 flex-1 bg-zinc-800 border-zinc-600 text-zinc-200 text-xs font-mono"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs text-zinc-400">Opacity</Label>
          <Slider
            value={[selected.opacity * 100]}
            onValueChange={([v]) => onChange(id, { opacity: v / 100 })}
            min={0}
            max={100}
            step={5}
            className="mt-1"
          />
        </div>

        {selected.type === 'text' && (
          <>
            <div className="pt-2 border-t border-zinc-700">
              <h4 className="text-xs font-medium text-zinc-400 flex items-center gap-1 mb-2">
                <Type className="w-3 h-3" />
                Text
              </h4>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-zinc-400">Content</Label>
                  <Input
                    value={selected.text ?? ''}
                    onChange={(e) => onChange(id, { text: e.target.value })}
                    className="h-8 bg-zinc-800 border-zinc-600 text-zinc-200 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-400">Font</Label>
                  <Select
                    value={selected.fontFamily ?? 'Arial'}
                    onValueChange={(v) => onChange(id, { fontFamily: v })}
                  >
                    <SelectTrigger className="h-8 bg-zinc-800 border-zinc-600 text-zinc-200 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_FAMILIES.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-zinc-400">Size</Label>
                  <Input
                    type="number"
                    value={selected.fontSize ?? 24}
                    onChange={(e) => onChange(id, { fontSize: Number(e.target.value) })}
                    className="h-8 bg-zinc-800 border-zinc-600 text-zinc-200 text-xs mt-1"
                    min={8}
                    max={200}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs border-zinc-600"
                    onClick={() => onChange(id, { fontStyle: selected.fontStyle === 'bold' ? 'normal' : 'bold' })}
                  >
                    Bold
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs border-zinc-600"
                    onClick={() => onChange(id, { fontStyle: selected.fontStyle === 'italic' ? 'normal' : 'italic' })}
                  >
                    Italic
                  </Button>
                </div>
                <div>
                  <Label className="text-xs text-zinc-400">Align</Label>
                  <Select
                    value={selected.align ?? 'left'}
                    onValueChange={(v: 'left' | 'center' | 'right') => onChange(id, { align: v })}
                  >
                    <SelectTrigger className="h-8 bg-zinc-800 border-zinc-600 text-zinc-200 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
