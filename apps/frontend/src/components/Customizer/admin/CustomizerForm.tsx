'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save } from 'lucide-react';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';
import type { CustomizerConfig } from '@/stores/customizer';

const customizerFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['product', 'template', 'canvas']),
  productId: z.string().optional(),
  canvasWidth: z.number().min(1).max(10000),
  canvasHeight: z.number().min(1).max(10000),
  canvasUnit: z.enum(['px', 'mm', 'in', 'cm']),
  canvasDpi: z.number().min(72).max(600).default(300),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  // Tool toggles
  enableText: z.boolean().default(true),
  enableImages: z.boolean().default(true),
  enableShapes: z.boolean().default(true),
  enableClipart: z.boolean().default(false),
  enableDrawing: z.boolean().default(false),
  enableQR: z.boolean().default(false),
  // Text settings
  allowedFonts: z.array(z.string()).default([]),
  maxChars: z.number().min(0).optional(),
  // Image settings
  maxUploadSize: z.number().min(0).default(10485760), // 10MB default
  allowedFormats: z.array(z.string()).default(['jpg', 'jpeg', 'png', 'webp']),
  // Pricing settings
  basePrice: z.number().min(0).default(0),
  pricePerText: z.number().min(0).default(0),
  pricePerImage: z.number().min(0).default(0),
  pricePerColor: z.number().min(0).default(0),
  // Moderation
  enableModeration: z.boolean().default(false),
  blockProfanity: z.boolean().default(false),
  requireApproval: z.boolean().default(false),
});

type CustomizerFormValues = z.infer<typeof customizerFormSchema>;

interface CustomizerFormProps {
  customizerId?: string;
  onSuccess?: (config: CustomizerConfig) => void;
  onCancel?: () => void;
}

export function CustomizerForm({ customizerId, onSuccess, onCancel }: CustomizerFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CustomizerFormValues>({
    resolver: zodResolver(customizerFormSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'product',
      canvasWidth: 800,
      canvasHeight: 600,
      canvasUnit: 'px',
      canvasDpi: 300,
      backgroundColor: '#ffffff',
      enableText: true,
      enableImages: true,
      enableShapes: true,
      enableClipart: false,
      enableDrawing: false,
      enableQR: false,
      allowedFonts: [],
      maxUploadSize: 10485760,
      allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
      basePrice: 0,
      pricePerText: 0,
      pricePerImage: 0,
      pricePerColor: 0,
      enableModeration: false,
      blockProfanity: false,
      requireApproval: false,
    },
  });

  const watchedType = watch('type');
  const watchedEnableModeration = watch('enableModeration');

  // Load existing customizer if editing
  useEffect(() => {
    if (customizerId) {
      setIsLoading(true);
      api
        .get<CustomizerConfig>(`/api/v1/customizer/configurations/${customizerId}`)
        .then((config) => {
          setValue('name', config.name);
          setValue('description', config.name);
          setValue('canvasWidth', config.canvasWidth);
          setValue('canvasHeight', config.canvasHeight);
          setValue('backgroundColor', '#ffffff');
          // Map other fields...
        })
        .catch((err) => {
          logger.error('Failed to load customizer', { error: err });
        })
        .finally(() => setIsLoading(false));
    }
  }, [customizerId, setValue]);

  // Search products
  useEffect(() => {
    if (watchedType === 'product' && searchQuery.length > 2) {
      api
        .get<Array<{ id: string; name: string }>>('/api/v1/products/search', {
          params: { q: searchQuery },
        })
        .then(setProducts)
        .catch((err) => logger.error('Failed to search products', { error: err }));
    }
  }, [searchQuery, watchedType]);

  const onSubmit = async (data: CustomizerFormValues) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        toolSettings: {
          text: { enabled: data.enableText },
          images: { enabled: data.enableImages },
          shapes: { enabled: data.enableShapes },
          clipart: { enabled: data.enableClipart },
          drawing: { enabled: data.enableDrawing },
          qr: { enabled: data.enableQR },
        },
        textSettings: {
          availableFonts: data.allowedFonts,
          maxLength: data.maxChars,
        },
        imageSettings: {
          maxFileSize: data.maxUploadSize,
          allowedFormats: data.allowedFormats,
        },
        pricingSettings: {
          enabled: data.basePrice > 0 || data.pricePerText > 0 || data.pricePerImage > 0 || data.pricePerColor > 0,
          basePrice: data.basePrice,
          pricePerText: data.pricePerText,
          pricePerImage: data.pricePerImage,
          pricePerColor: data.pricePerColor,
          currency: 'USD',
        },
        moderationSettings: {
          enabled: data.enableModeration,
          blockProfanity: data.blockProfanity,
          requireApproval: data.requireApproval,
          autoModerate: false,
        },
      };

      const result = customizerId
        ? await api.put<CustomizerConfig>(`/api/v1/customizer/configurations/${customizerId}`, payload)
        : await api.post<CustomizerConfig>('/api/v1/customizer/configurations', payload);

      onSuccess?.(result);
    } catch (err) {
      logger.error('Failed to save customizer', { error: err });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Configure the basic settings for your customizer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={watchedType} onValueChange={(v) => setValue('type', v as any)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="template">Template</SelectItem>
                <SelectItem value="canvas">Canvas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {watchedType === 'product' && (
            <div className="space-y-2">
              <Label htmlFor="productId">Product</Label>
              <Input
                id="productId"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {products.length > 0 && (
                <div className="border rounded-md p-2 space-y-1 max-h-40 overflow-y-auto">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="p-2 hover:bg-accent cursor-pointer rounded"
                      onClick={() => {
                        setValue('productId', product.id);
                        setSearchQuery(product.name);
                        setProducts([]);
                      }}
                    >
                      {product.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Canvas Settings</CardTitle>
          <CardDescription>Configure canvas dimensions and properties</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="canvasWidth">Width</Label>
              <Input
                id="canvasWidth"
                type="number"
                {...register('canvasWidth', { valueAsNumber: true })}
              />
              {errors.canvasWidth && (
                <p className="text-sm text-destructive">{errors.canvasWidth.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="canvasHeight">Height</Label>
              <Input
                id="canvasHeight"
                type="number"
                {...register('canvasHeight', { valueAsNumber: true })}
              />
              {errors.canvasHeight && (
                <p className="text-sm text-destructive">{errors.canvasHeight.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="canvasUnit">Unit</Label>
              <Select
                value={watch('canvasUnit')}
                onValueChange={(v) => setValue('canvasUnit', v as any)}
              >
                <SelectTrigger id="canvasUnit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="px">Pixels (px)</SelectItem>
                  <SelectItem value="mm">Millimeters (mm)</SelectItem>
                  <SelectItem value="in">Inches (in)</SelectItem>
                  <SelectItem value="cm">Centimeters (cm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="canvasDpi">DPI</Label>
              <Input
                id="canvasDpi"
                type="number"
                {...register('canvasDpi', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="backgroundColor">Background Color</Label>
            <div className="flex gap-2">
              <Input
                id="backgroundColor"
                type="color"
                {...register('backgroundColor')}
                className="w-20 h-10"
              />
              <Input {...register('backgroundColor')} className="flex-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tool Settings</CardTitle>
          <CardDescription>Enable or disable available tools</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enableText">Text Tool</Label>
            <Switch id="enableText" {...register('enableText')} checked={watch('enableText')} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="enableImages">Image Tool</Label>
            <Switch
              id="enableImages"
              {...register('enableImages')}
              checked={watch('enableImages')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="enableShapes">Shapes Tool</Label>
            <Switch
              id="enableShapes"
              {...register('enableShapes')}
              checked={watch('enableShapes')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="enableClipart">Clipart Tool</Label>
            <Switch
              id="enableClipart"
              {...register('enableClipart')}
              checked={watch('enableClipart')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="enableDrawing">Drawing Tool</Label>
            <Switch
              id="enableDrawing"
              {...register('enableDrawing')}
              checked={watch('enableDrawing')}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="enableQR">QR Code Tool</Label>
            <Switch id="enableQR" {...register('enableQR')} checked={watch('enableQR')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Text Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxChars">Max Characters (optional)</Label>
            <Input
              id="maxChars"
              type="number"
              {...register('maxChars', { valueAsNumber: true })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Image Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxUploadSize">Max Upload Size (bytes)</Label>
            <Input
              id="maxUploadSize"
              type="number"
              {...register('maxUploadSize', { valueAsNumber: true })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="basePrice">Base Price</Label>
              <Input
                id="basePrice"
                type="number"
                step="0.01"
                {...register('basePrice', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricePerText">Price per Text</Label>
              <Input
                id="pricePerText"
                type="number"
                step="0.01"
                {...register('pricePerText', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricePerImage">Price per Image</Label>
              <Input
                id="pricePerImage"
                type="number"
                step="0.01"
                {...register('pricePerImage', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricePerColor">Price per Color</Label>
              <Input
                id="pricePerColor"
                type="number"
                step="0.01"
                {...register('pricePerColor', { valueAsNumber: true })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Moderation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enableModeration">Enable Moderation</Label>
            <Switch
              id="enableModeration"
              {...register('enableModeration')}
              checked={watchedEnableModeration}
            />
          </div>
          {watchedEnableModeration && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="blockProfanity">Block Profanity</Label>
                <Switch
                  id="blockProfanity"
                  {...register('blockProfanity')}
                  checked={watch('blockProfanity')}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="requireApproval">Require Approval</Label>
                <Switch
                  id="requireApproval"
                  {...register('requireApproval')}
                  checked={watch('requireApproval')}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Customizer
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
