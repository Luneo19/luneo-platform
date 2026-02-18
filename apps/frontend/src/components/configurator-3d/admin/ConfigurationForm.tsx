'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Settings2, Camera, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { cn } from '@/lib/utils';
import type {
  Configurator3DConfig,
  ConfiguratorType,
  SceneSettings,
  CameraSettings,
  ConfiguratorFeatures,
} from '@/lib/configurator-3d/types/configurator.types';

const configuratorFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  description: z.string().optional(),
  type: z.enum([
    'JEWELRY',
    'WATCH',
    'EYEWEAR',
    'FURNITURE',
    'APPAREL',
    'ACCESSORIES',
    'CUSTOM',
  ]),
  modelUrl: z.string().url().optional().or(z.literal('')),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  tags: z.string().optional(),
  // Scene
  backgroundColor: z.string().optional(),
  ambientIntensity: z.number().min(0).max(2).optional(),
  useEnvironmentMap: z.boolean().optional(),
  shadowsEnabled: z.boolean().optional(),
  // Camera
  fov: z.number().min(30).max(120).optional(),
  minDistance: z.number().min(0).optional(),
  maxDistance: z.number().min(1).optional(),
  autoRotate: z.boolean().optional(),
  // Features
  enableAR: z.boolean().optional(),
  enableScreenshots: z.boolean().optional(),
  enableSharing: z.boolean().optional(),
});

export type ConfiguratorFormValues = z.infer<typeof configuratorFormSchema>;

export interface ConfigurationFormProps {
  config?: Configurator3DConfig | null;
  onSubmit: (values: ConfiguratorFormValues) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

const CONFIGURATOR_TYPES: { value: ConfiguratorType; label: string }[] = [
  { value: 'JEWELRY', label: 'Jewelry' },
  { value: 'WATCH', label: 'Watch' },
  { value: 'EYEWEAR', label: 'Eyewear' },
  { value: 'FURNITURE', label: 'Furniture' },
  { value: 'APPAREL', label: 'Apparel' },
  { value: 'ACCESSORIES', label: 'Accessories' },
  { value: 'CUSTOM', label: 'Custom' },
];

export function ConfigurationForm({
  config,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: ConfigurationFormProps) {
  const sceneSettings = config?.sceneSettings as SceneSettings | undefined;
  const cameraSettings = config?.cameraSettings as CameraSettings | undefined;
  const features = config?.features as ConfiguratorFeatures | undefined;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ConfiguratorFormValues>({
    resolver: zodResolver(configuratorFormSchema),
    defaultValues: {
      name: config?.name ?? '',
      description: config?.description ?? '',
      type: (config?.type ?? 'CUSTOM') as ConfiguratorType,
      modelUrl: config?.modelUrl ?? '',
      thumbnailUrl: config?.thumbnailUrl ?? '',
      tags: Array.isArray(config?.metadata?.tags)
        ? (config.metadata.tags as string[]).join(', ')
        : '',
      backgroundColor: sceneSettings?.backgroundColor ?? '#1a1a2e',
      ambientIntensity: sceneSettings?.ambientLight?.intensity ?? 0.5,
      useEnvironmentMap: sceneSettings?.useEnvironmentMap ?? false,
      shadowsEnabled: sceneSettings?.shadows?.enabled ?? true,
      fov: cameraSettings?.fov ?? 45,
      minDistance: cameraSettings?.minDistance ?? 1,
      maxDistance: cameraSettings?.maxDistance ?? 20,
      autoRotate: cameraSettings?.autoRotate ?? false,
      enableAR: features?.enableAR ?? true,
      enableScreenshots: features?.enableScreenshots ?? true,
      enableSharing: features?.enableSharing ?? true,
    },
  });

  const handleFormSubmit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form
      onSubmit={handleFormSubmit}
      className={cn('space-y-8', className)}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings2 className="h-5 w-5 text-primary" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Core configuration details for your 3D configurator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="My Configurator"
                {...register('name')}
                error={errors.name?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={watch('type')}
                onValueChange={(v) => setValue('type', v as ConfiguratorType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CONFIGURATOR_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your configurator..."
              rows={3}
              {...register('description')}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="modelUrl">Model URL</Label>
              <Input
                id="modelUrl"
                type="url"
                placeholder="https://..."
                {...register('modelUrl')}
                error={errors.modelUrl?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
              <Input
                id="thumbnailUrl"
                type="url"
                placeholder="https://..."
                {...register('thumbnailUrl')}
                error={errors.thumbnailUrl?.message}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="jewelry, custom, premium"
              {...register('tags')}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5 text-primary" />
            Scene Settings
          </CardTitle>
          <CardDescription>
            Background and lighting configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <input
                type="color"
                {...register('backgroundColor')}
                className="h-10 w-16 cursor-pointer rounded-lg border border-input bg-transparent"
                onChange={(e) => setValue('backgroundColor', e.target.value)}
              />
              <Label>Background</Label>
            </div>
            <div className="flex items-center gap-4">
              <Label className="whitespace-nowrap">Ambient light</Label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                {...register('ambientIntensity', { valueAsNumber: true })}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                {watch('ambientIntensity')}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={watch('useEnvironmentMap')}
                onCheckedChange={(v) => setValue('useEnvironmentMap', v)}
              />
              <Label>Environment map</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={watch('shadowsEnabled')}
                onCheckedChange={(v) => setValue('shadowsEnabled', v)}
              />
              <Label>Shadows</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Camera className="h-5 w-5 text-primary" />
            Camera Settings
          </CardTitle>
          <CardDescription>
            Viewport and orbit controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>FOV (degrees)</Label>
              <Input
                type="number"
                min={30}
                max={120}
                {...register('fov', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Min distance</Label>
              <Input
                type="number"
                min={0}
                step={0.1}
                {...register('minDistance', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max distance</Label>
              <Input
                type="number"
                min={1}
                {...register('maxDistance', { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={watch('autoRotate')}
              onCheckedChange={(v) => setValue('autoRotate', v)}
            />
            <Label>Auto-rotate</Label>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Feature Toggles</CardTitle>
          <CardDescription>
            Enable or disable configurator features
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <Switch
              checked={watch('enableAR')}
              onCheckedChange={(v) => setValue('enableAR', v)}
            />
            <Label>AR support</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={watch('enableScreenshots')}
              onCheckedChange={(v) => setValue('enableScreenshots', v)}
            />
            <Label>Screenshots</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={watch('enableSharing')}
              onCheckedChange={(v) => setValue('enableSharing', v)}
            />
            <Label>Sharing</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading || !isDirty}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {config ? 'Update' : 'Create'} Configuration
        </Button>
      </div>
    </form>
  );
}
