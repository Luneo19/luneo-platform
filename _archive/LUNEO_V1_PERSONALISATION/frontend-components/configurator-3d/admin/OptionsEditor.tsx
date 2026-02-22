'use client';

import React, { useState, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  Check,
  X,
  Image as ImageIcon,
  Palette,
  Type,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
  Configurator3DOption,
  Configurator3DComponent,
  OptionType,
  PricingType,
} from '@/lib/configurator-3d/types/configurator.types';
import { configurator3dEndpoints } from '@/lib/api/configurator-3d.endpoints';

const OPTION_TYPES: { value: OptionType; label: string }[] = [
  { value: 'COLOR', label: 'Color' },
  { value: 'TEXTURE', label: 'Texture' },
  { value: 'MATERIAL', label: 'Material' },
  { value: 'SIZE', label: 'Size' },
  { value: 'TEXT', label: 'Text' },
  { value: 'IMAGE', label: 'Image' },
  { value: 'MODEL', label: 'Model' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'BOOLEAN', label: 'Boolean' },
];

const PRICING_TYPES: { value: PricingType; label: string }[] = [
  { value: 'FIXED', label: 'Fixed' },
  { value: 'PERCENTAGE', label: 'Percentage' },
  { value: 'REPLACEMENT', label: 'Replacement' },
  { value: 'FORMULA', label: 'Formula' },
];

export interface OptionsEditorProps {
  configId: string;
  component: Configurator3DComponent;
  options: Configurator3DOption[];
  onOptionsChange: (options: Configurator3DOption[]) => void;
  isLoading?: boolean;
  className?: string;
}

export function OptionsEditor({
  configId,
  component,
  options,
  onOptionsChange,
  isLoading = false,
  className,
}: OptionsEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleSetDefault = useCallback(
    (optionId: string) => {
      const updates = options.map((opt) => ({
        ...opt,
        isDefault: opt.id === optionId,
      }));
      updates.forEach((opt, i) => {
        if (opt.isDefault !== options[i]?.isDefault) {
          configurator3dEndpoints.options
            .update(configId, component.id, opt.id, { isDefault: opt.isDefault })
            .then((res) => {
              const updated = (typeof res === 'object' && res !== null && 'id' in res)
                ? (res as Configurator3DOption)
                : (res as { data?: Configurator3DOption })?.data;
              if (updated) {
                onOptionsChange(
                  options.map((o) => (o.id === opt.id ? { ...o, ...updated } : { ...o, isDefault: false }))
                );
              }
            })
            .catch(() => {});
        }
      });
    },
    [configId, component.id, options, onOptionsChange]
  );

  const handleToggleEnabled = useCallback(
    (optionId: string, isEnabled: boolean) => {
      configurator3dEndpoints.options
        .update(configId, component.id, optionId, { isEnabled })
        .then((res) => {
          const updated = (typeof res === 'object' && res !== null && 'id' in res)
            ? (res as Configurator3DOption)
            : (res as { data?: Configurator3DOption })?.data;
          if (updated) {
            onOptionsChange(
              options.map((o) => (o.id === optionId ? { ...o, isEnabled } : o))
            );
          }
        })
        .catch(() => {});
    },
    [configId, component.id, options, onOptionsChange]
  );

  const handleDelete = useCallback(
    (optionId: string) => {
      configurator3dEndpoints.options
        .delete(configId, component.id, optionId)
        .then(() => {
          onOptionsChange(options.filter((o) => o.id !== optionId));
          setDeleteConfirmId(null);
        })
        .catch(() => {});
    },
    [configId, component.id, options, onOptionsChange]
  );

  const handleUpdate = useCallback(
    (optionId: string, data: Partial<Configurator3DOption>) => {
      configurator3dEndpoints.options
        .update(configId, component.id, optionId, data)
        .then((res) => {
          const updated = (typeof res === 'object' && res !== null && 'id' in res)
            ? (res as Configurator3DOption)
            : (res as { data?: Configurator3DOption })?.data ?? data;
          onOptionsChange(
            options.map((o) => (o.id === optionId ? { ...o, ...updated } : o))
          );
          setEditingId(null);
        })
        .catch(() => {});
    },
    [configId, component.id, options, onOptionsChange]
  );

  const handleCreate = useCallback(
    (data: {
      name: string;
      type: OptionType;
      priceDelta?: number;
      pricingType?: PricingType;
      isDefault?: boolean;
    }) => {
      configurator3dEndpoints.options
        .create(configId, component.id, {
          name: data.name,
          type: data.type,
          priceDelta: data.priceDelta ?? 0,
          pricingType: data.pricingType ?? 'FIXED',
          isDefault: data.isDefault ?? false,
          isEnabled: true,
          isVisible: true,
          sortOrder: options.length,
        })
        .then((res) => {
          const created = (typeof res === 'object' && res !== null && 'id' in res)
            ? (res as Configurator3DOption)
            : (res as { data?: Configurator3DOption })?.data;
          if (created) onOptionsChange([...options, created]);
          setAddOpen(false);
        })
        .catch(() => {});
    },
    [configId, component.id, options, onOptionsChange]
  );

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Options: {component.name}</CardTitle>
            <CardDescription>
              Manage options for this component
            </CardDescription>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Option
              </Button>
            </DialogTrigger>
            <AddOptionDialog
              onAdd={handleCreate}
              onCancel={() => setAddOpen(false)}
            />
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[360px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : options.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Palette className="mb-4 h-12 w-12 opacity-50" />
              <p className="font-medium">No options yet</p>
              <p className="text-sm">Add options for users to choose from</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Option
              </Button>
            </div>
          ) : (
            <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {options.map((opt) => (
                <OptionCard
                  key={opt.id}
                  option={opt}
                  isEditing={editingId === opt.id}
                  onEdit={() => setEditingId(opt.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onSave={(data) => handleUpdate(opt.id, data)}
                  onSetDefault={() => handleSetDefault(opt.id)}
                  onToggleEnabled={(v) => handleToggleEnabled(opt.id, v)}
                  onDelete={() => setDeleteConfirmId(opt.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <Dialog open={!!deleteConfirmId} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete option?</DialogTitle>
            <DialogDescription>
              This action cannot be undone.
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

function AddOptionDialog({
  onAdd,
  onCancel,
}: {
  onAdd: (data: {
    name: string;
    type: OptionType;
    priceDelta?: number;
    pricingType?: PricingType;
    isDefault?: boolean;
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<OptionType>('COLOR');
  const [priceDelta, setPriceDelta] = useState(0);
  const [pricingType, setPricingType] = useState<PricingType>('FIXED');
  const [isDefault, setIsDefault] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), type, priceDelta, pricingType, isDefault });
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add Option</DialogTitle>
        <DialogDescription>
          Create a new option for this component
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="opt-name">Name</Label>
          <Input
            id="opt-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Gold"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as OptionType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPTION_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Pricing type</Label>
            <Select value={pricingType} onValueChange={(v) => setPricingType(v as PricingType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRICING_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Price delta</Label>
            <Input
              type="number"
              step="0.01"
              value={priceDelta}
              onChange={(e) => setPriceDelta(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={isDefault} onCheckedChange={setIsDefault} />
          <Label>Set as default</Label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim()}>
            Add Option
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function OptionCard({
  option,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onSetDefault,
  onToggleEnabled,
  onDelete,
}: {
  option: Configurator3DOption;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (data: Partial<Configurator3DOption>) => void;
  onSetDefault: () => void;
  onToggleEnabled: (v: boolean) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(option.name);
  const [priceDelta, setPriceDelta] = useState(option.pricing?.priceDelta ?? 0);

  const swatchColor =
    option.type === 'COLOR' && option.value && typeof option.value === 'object' && 'hex' in option.value
      ? (option.value as { hex?: string }).hex
      : undefined;

  if (isEditing) {
    return (
      <div className="rounded-lg border bg-muted/20 p-3">
        <div className="space-y-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9"
          />
          <Input
            type="number"
            step="0.01"
            value={priceDelta}
            onChange={(e) => setPriceDelta(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="mt-2 flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => onSave({ name, pricing: { ...option.pricing, priceDelta } })}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancelEdit}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30',
        !option.isEnabled && 'opacity-60'
      )}
    >
      <div
        className="h-10 w-10 shrink-0 rounded-md border"
        style={
          swatchColor
            ? { backgroundColor: swatchColor }
            : option.swatchImageUrl || option.previewImageUrl
              ? { backgroundImage: `url(${option.swatchImageUrl || option.previewImageUrl})`, backgroundSize: 'cover' }
              : { backgroundColor: 'var(--muted)' }
        }
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{option.name}</p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {option.type}
          </Badge>
          {option.pricing?.priceDelta !== undefined && option.pricing.priceDelta !== 0 && (
            <span className="text-xs text-muted-foreground">
              {option.pricing.priceDelta > 0 ? '+' : ''}
              {option.pricing.priceDelta}
            </span>
          )}
          {option.isDefault && (
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {!option.isDefault && (
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onSetDefault} title="Set default">
            <Star className="h-4 w-4" />
          </Button>
        )}
        <Switch
          checked={option.isEnabled}
          onCheckedChange={onToggleEnabled}
          className="scale-75"
        />
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
