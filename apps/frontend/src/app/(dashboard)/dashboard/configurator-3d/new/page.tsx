/**
 * New Configuration Wizard - Multi-step form to create a 3D configurator
 */

'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Upload, Loader2 } from 'lucide-react';
import { configurator3dEndpoints } from '@/lib/api/configurator-3d.endpoints';
import { endpoints } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

const STEPS = [
  { id: 1, title: 'Basic Info', description: 'Name, description, type, product' },
  { id: 2, title: '3D Model', description: 'Upload your GLTF/GLB file' },
  { id: 3, title: 'Scene Settings', description: 'Background, lighting, camera' },
  { id: 4, title: 'Pricing', description: 'Base price, currency, tax' },
  { id: 5, title: 'Features', description: 'AR, screenshots, sharing' },
  { id: 6, title: 'Review', description: 'Review and create' },
];

export default function NewConfigurationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'CUSTOM' as string,
    productId: '',
    modelFile: null as File | null,
    modelUrl: '',
    backgroundColor: '#1a1a2e',
    ambientIntensity: 0.5,
    basePrice: 0,
    currency: 'EUR',
    taxRate: 20,
    enableAR: true,
    enableScreenshots: true,
    enableSharing: true,
  });
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    endpoints.products.list?.({ limit: 100 }).then((res: unknown) => {
      const data = (res as { data?: { id: string; name: string }[] })?.data ?? (res as { id: string; name: string }[]);
      if (Array.isArray(data)) {
        setProducts(data.map((p) => ({ id: p.id, name: (p as { name?: string }).name ?? p.id })));
      }
    }).catch(() => {});
  }, []);

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await configurator3dEndpoints.configurations.create(payload);
      return res;
    },
    onSuccess: (data) => {
      const id = data && typeof data === 'object' && 'id' in data ? (data as { id: string }).id : undefined;
      toast({ title: 'Configuration created successfully' });
      router.push(id ? `/dashboard/configurator-3d/${id}` : '/dashboard/configurator-3d');
    },
    onError: () => toast({ title: 'Failed to create configuration', variant: 'destructive' }),
  });

  const handleNext = () => {
    if (step < 6) setStep((s) => s + 1);
    else handleSubmit();
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = () => {
    const payload: Record<string, unknown> = {
      name: form.name,
      description: form.description || undefined,
      type: form.type,
      productId: form.productId || undefined,
      status: 'DRAFT',
      modelUrl: form.modelUrl || undefined,
      sceneSettings: {
        backgroundColor: form.backgroundColor,
        ambientLight: { intensity: form.ambientIntensity },
      },
      pricingSettings: {
        basePrice: form.basePrice,
        currency: form.currency,
        taxRate: form.taxRate,
      },
      features: {
        enableAR: form.enableAR,
        enableScreenshots: form.enableScreenshots,
        enableSharing: form.enableSharing,
      },
    };
    createMutation.mutate(payload);
  };

  const updateForm = (updates: Partial<typeof form>) => setForm((f) => ({ ...f, ...updates }));

  const canProceed = step === 1 ? form.name.trim().length > 0 : true;

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/configurator-3d">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to list
          </Link>
        </Button>
        <h1 className="mt-4 text-2xl font-bold">Create New Configuration</h1>
        <p className="text-muted-foreground">Set up your 3D product configurator in a few steps</p>
      </div>

      <Progress value={(step / 6) * 100} className="h-2" />

      <div className="flex gap-4">
        <nav className="w-48 shrink-0 space-y-1">
          {STEPS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                step === s.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              {s.title}
            </button>
          ))}
        </nav>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>{STEPS[step - 1].title}</CardTitle>
            <CardDescription>{STEPS[step - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => updateForm({ name: e.target.value })}
                    placeholder="e.g. Custom Ring Configurator"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => updateForm({ description: e.target.value })}
                    placeholder="Brief description of this configurator"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => updateForm({ type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="JEWELRY">Jewelry</SelectItem>
                      <SelectItem value="WATCH">Watch</SelectItem>
                      <SelectItem value="EYEWEAR">Eyewear</SelectItem>
                      <SelectItem value="FURNITURE">Furniture</SelectItem>
                      <SelectItem value="APPAREL">Apparel</SelectItem>
                      <SelectItem value="ACCESSORIES">Accessories</SelectItem>
                      <SelectItem value="CUSTOM">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Product (optional)</Label>
                  <Select value={form.productId} onValueChange={(v) => updateForm({ productId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div
                  className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-8 transition-colors hover:border-muted-foreground/50"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
                      updateForm({ modelFile: file });
                      toast({ title: 'File selected. Upload via your storage provider and paste URL in settings.' });
                    } else {
                      toast({ title: 'Please upload a .glb or .gltf file', variant: 'destructive' });
                    }
                  }}
                >
                  <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag and drop a .glb or .gltf file here, or upload via Settings after creation
                  </p>
                  {form.modelFile && (
                    <p className="mt-2 text-sm font-medium">{form.modelFile.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Model URL (optional - can set later)</Label>
                  <Input
                    value={form.modelUrl}
                    onChange={(e) => updateForm({ modelUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label>Background color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.backgroundColor}
                      onChange={(e) => updateForm({ backgroundColor: e.target.value })}
                      className="h-10 w-14 cursor-pointer rounded border"
                    />
                    <Input
                      value={form.backgroundColor}
                      onChange={(e) => updateForm({ backgroundColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ambient light intensity (0-2)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={form.ambientIntensity}
                    onChange={(e) => updateForm({ ambientIntensity: parseFloat(e.target.value) || 0.5 })}
                  />
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div className="space-y-2">
                  <Label>Base price</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.basePrice || ''}
                    onChange={(e) => updateForm({ basePrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={form.currency} onValueChange={(v) => updateForm({ currency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tax rate (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={form.taxRate}
                    onChange={(e) => updateForm({ taxRate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>AR support</Label>
                    <p className="text-sm text-muted-foreground">Allow viewing in AR on mobile</p>
                  </div>
                  <Switch checked={form.enableAR} onCheckedChange={(v) => updateForm({ enableAR: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Screenshots</Label>
                    <p className="text-sm text-muted-foreground">Let users capture screenshots</p>
                  </div>
                  <Switch checked={form.enableScreenshots} onCheckedChange={(v) => updateForm({ enableScreenshots: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sharing</Label>
                    <p className="text-sm text-muted-foreground">Allow sharing configurations</p>
                  </div>
                  <Switch checked={form.enableSharing} onCheckedChange={(v) => updateForm({ enableSharing: v })} />
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4 rounded-lg border p-4">
                <p><strong>Name:</strong> {form.name}</p>
                <p><strong>Type:</strong> {form.type}</p>
                <p><strong>Base price:</strong> {form.basePrice} {form.currency}</p>
                <p><strong>Tax:</strong> {form.taxRate}%</p>
                <p><strong>AR:</strong> {form.enableAR ? 'Yes' : 'No'}</p>
                <p><strong>Screenshots:</strong> {form.enableScreenshots ? 'Yes' : 'No'}</p>
                <p><strong>Sharing:</strong> {form.enableSharing ? 'Yes' : 'No'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={step <= 1}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleNext} disabled={!canProceed || createMutation.isPending}>
          {createMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {step < 6 ? (
            <>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          ) : (
            'Create Configuration'
          )}
        </Button>
      </div>
    </div>
  );
}
