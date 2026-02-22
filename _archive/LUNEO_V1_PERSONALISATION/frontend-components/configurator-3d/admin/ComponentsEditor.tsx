'use client';

import React, { useState, useCallback } from 'react';
import {
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Box,
  Palette,
  Image as ImageIcon,
  Type,
  Layers,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type {
  Configurator3DComponent,
  ComponentType,
  SelectionMode,
} from '@/lib/configurator-3d/types/configurator.types';
import { configurator3dEndpoints } from '@/lib/api/configurator-3d.endpoints';

const COMPONENT_TYPES: { value: ComponentType; label: string; icon: React.ElementType }[] = [
  { value: 'MESH', label: 'Mesh', icon: Box },
  { value: 'MATERIAL', label: 'Material', icon: Palette },
  { value: 'TEXTURE', label: 'Texture', icon: ImageIcon },
  { value: 'COLOR', label: 'Color', icon: Palette },
  { value: 'DECAL', label: 'Decal', icon: ImageIcon },
  { value: 'ACCESSORY', label: 'Accessory', icon: Layers },
  { value: 'SIZE', label: 'Size', icon: Type },
  { value: 'ENGRAVING', label: 'Engraving', icon: Type },
];

const SELECTION_MODES: { value: SelectionMode; label: string }[] = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'MULTIPLE', label: 'Multiple' },
  { value: 'REQUIRED', label: 'Required' },
  { value: 'OPTIONAL', label: 'Optional' },
];

export interface ComponentsEditorProps {
  configId: string;
  components: Configurator3DComponent[];
  onComponentsChange: (components: Configurator3DComponent[]) => void;
  isLoading?: boolean;
  className?: string;
}

function getComponentIcon(type: ComponentType): React.ReactNode {
  const found = COMPONENT_TYPES.find((t) => t.value === type);
  const Icon = (found?.icon ?? Box) as React.ComponentType<{ className?: string }>;
  return <Icon className="h-4 w-4" />;
}

export function ComponentsEditor({
  configId,
  components,
  onComponentsChange,
  isLoading = false,
  className,
}: ComponentsEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const moveComponent = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= components.length) return;
      const reordered = [...components];
      [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
      const componentIds = reordered.map((c) => c.id);
      configurator3dEndpoints.components
        .reorder(configId, { componentIds })
        .then((res) => {
          const data = Array.isArray(res) ? res : (res as { data?: Configurator3DComponent[] })?.data;
          if (Array.isArray(data)) onComponentsChange(data);
        })
        .catch(() => {});
    },
    [configId, components, onComponentsChange]
  );

  const handleDelete = useCallback(
    (id: string) => {
      configurator3dEndpoints.components
        .delete(configId, id)
        .then(() => {
          onComponentsChange(components.filter((c) => c.id !== id));
          setDeleteConfirmId(null);
        })
        .catch(() => {});
    },
    [configId, components, onComponentsChange]
  );

  const handleUpdate = useCallback(
    (id: string, data: Partial<Configurator3DComponent>) => {
      configurator3dEndpoints.components
        .update(configId, id, data)
        .then((res) => {
          const updated = (typeof res === 'object' && res !== null && 'id' in res)
            ? (res as Configurator3DComponent)
            : (res as { data?: Configurator3DComponent })?.data ?? data;
          onComponentsChange(
            components.map((c) => (c.id === id ? { ...c, ...updated } : c))
          );
          setEditingId(null);
        })
        .catch(() => {});
    },
    [configId, components, onComponentsChange]
  );

  const handleCreate = useCallback(
    (data: { name: string; technicalId?: string; type: ComponentType; selectionMode: SelectionMode }) => {
      configurator3dEndpoints.components
        .create(configId, {
          name: data.name,
          technicalId: data.technicalId || data.name.toLowerCase().replace(/\s+/g, '_'),
          type: data.type,
          selectionMode: data.selectionMode,
          isVisible: true,
          isEnabled: true,
          sortOrder: components.length,
        })
        .then((res) => {
          const created = (typeof res === 'object' && res !== null && 'id' in res)
            ? (res as Configurator3DComponent)
            : (res as { data?: Configurator3DComponent })?.data;
          if (created) onComponentsChange([...components, created]);
          setAddOpen(false);
        })
        .catch(() => {});
    },
    [configId, components, onComponentsChange]
  );

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Components</CardTitle>
            <CardDescription>
              Manage configurator components and their order
            </CardDescription>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Component
              </Button>
            </DialogTrigger>
            <AddComponentDialog
              onAdd={handleCreate}
              onCancel={() => setAddOpen(false)}
            />
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : components.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Box className="mb-4 h-12 w-12 opacity-50" />
              <p className="font-medium">No components yet</p>
              <p className="text-sm">Add your first component to get started</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Component
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {components.map((comp, index) => (
                <ComponentRow
                  key={comp.id}
                  component={comp}
                  index={index}
                  total={components.length}
                  isEditing={editingId === comp.id}
                  onEdit={() => setEditingId(comp.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onSave={(data) => handleUpdate(comp.id, data)}
                  onMoveUp={() => moveComponent(index, 'up')}
                  onMoveDown={() => moveComponent(index, 'down')}
                  onDelete={() => setDeleteConfirmId(comp.id)}
                  getIcon={getComponentIcon}
                />
              ))}
            </ul>
          )}
        </ScrollArea>
      </CardContent>

      <Dialog open={!!deleteConfirmId} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete component?</DialogTitle>
            <DialogDescription>
              This will remove the component and all its options. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function AddComponentDialog({
  onAdd,
  onCancel,
}: {
  onAdd: (data: {
    name: string;
    technicalId?: string;
    type: ComponentType;
    selectionMode: SelectionMode;
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [technicalId, setTechnicalId] = useState('');
  const [type, setType] = useState<ComponentType>('MESH');
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('SINGLE');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      technicalId: technicalId.trim() || undefined,
      type,
      selectionMode,
    });
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add Component</DialogTitle>
        <DialogDescription>
          Create a new configurator component. You can add options later.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="add-name">Name</Label>
          <Input
            id="add-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Band Color"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="add-technicalId">Technical ID (optional)</Label>
          <Input
            id="add-technicalId"
            value={technicalId}
            onChange={(e) => setTechnicalId(e.target.value)}
            placeholder="band_color"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ComponentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPONENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Selection mode</Label>
            <Select
              value={selectionMode}
              onValueChange={(v) => setSelectionMode(v as SelectionMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SELECTION_MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim()}>
            Add Component
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function ComponentRow({
  component,
  index,
  total,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onMoveUp,
  onMoveDown,
  onDelete,
  getIcon,
}: {
  component: Configurator3DComponent;
  index: number;
  total: number;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (data: Partial<Configurator3DComponent>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  getIcon: (type: ComponentType) => React.ReactNode;
}) {
  const [name, setName] = useState(component.name);
  const [visible, setVisible] = useState(component.isVisible);

  if (isEditing) {
    return (
      <li className="flex items-center gap-3 border-b bg-muted/20 px-4 py-3">
        <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
        <div className="flex-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={() => onSave({ name })} title="Save">
            <Check className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onCancelEdit} title="Cancel">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30">
      <div className="flex flex-col gap-0.5">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={onMoveUp}
          disabled={index === 0}
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={onMoveDown}
          disabled={index === total - 1}
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
      <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
        {getIcon(component.type)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{component.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {component.technicalId ?? component.id}
        </p>
      </div>
      <Badge variant="secondary" className="text-xs">
        {component.type}
      </Badge>
      <Badge variant="outline" className="text-xs">
        {component.selectionMode}
      </Badge>
      <span className="text-sm text-muted-foreground">
        {component.options?.length ?? 0} options
      </span>
      <Switch
        checked={visible}
        onCheckedChange={(v) => {
          setVisible(v);
          onSave({ isVisible: v });
        }}
      />
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button size="icon" variant="ghost" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}
