/**
 * Settings Page - General, Access, Features, SEO, Danger zone
 */

'use client';

import { use, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronLeft, Save, Loader2, Archive, Trash2 } from 'lucide-react';
import { configurator3dEndpoints } from '@/lib/api/configurator-3d.endpoints';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { Configurator3DConfig } from '@/lib/configurator-3d/types/configurator.types';

export default function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    description: '',
    slug: '',
    tags: '',
    isPublic: true,
    password: '',
    allowedDomains: '',
    expiration: '',
    enableAR: true,
    enableScreenshots: true,
    enableSharing: true,
    enableComparison: false,
    metaTitle: '',
    metaDescription: '',
    ogImage: '',
    customCss: '',
  });

  const { data: config, isLoading } = useQuery({
    queryKey: ['configurator3d', 'config', id],
    queryFn: () => configurator3dEndpoints.configurations.get<Configurator3DConfig & { slug?: string; isPublic?: boolean; allowedDomains?: string[] }>(id),
  });

  useEffect(() => {
    if (config) {
      setForm((f) => ({
        ...f,
        name: config.name ?? '',
        description: config.description ?? '',
        slug: (config as { slug?: string }).slug ?? '',
        tags: Array.isArray((config as { tags?: string[] }).tags) ? ((config as { tags?: string[] }).tags ?? []).join(', ') : '',
        isPublic: (config as { isPublic?: boolean }).isPublic ?? true,
        allowedDomains: Array.isArray((config as { allowedDomains?: string[] }).allowedDomains)
          ? ((config as { allowedDomains?: string[] }).allowedDomains ?? []).join(', ')
          : '',
        enableAR: config.features?.enableAR ?? true,
        enableScreenshots: config.features?.enableScreenshots ?? true,
        enableSharing: config.features?.enableSharing ?? true,
        enableComparison: config.features?.enableComparison ?? false,
        metaTitle: (config as { metaTitle?: string }).metaTitle ?? '',
        metaDescription: (config as { metaDescription?: string }).metaDescription ?? '',
        ogImage: (config as { ogImage?: string }).ogImage ?? '',
        customCss: (config as { customCss?: string }).customCss ?? '',
      }));
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => configurator3dEndpoints.configurations.patch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configurator3d', 'config', id] });
      toast({ title: 'Settings saved' });
    },
    onError: () => toast({ title: 'Failed to save', variant: 'destructive' }),
  });

  const archiveMutation = useMutation({
    mutationFn: () => configurator3dEndpoints.configurations.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configurator3d', 'config', id] });
      toast({ title: 'Configuration archived' });
    },
    onError: () => toast({ title: 'Failed to archive', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => configurator3dEndpoints.configurations.delete(id),
    onSuccess: () => {
      toast({ title: 'Configuration deleted' });
      window.location.href = '/dashboard/configurator-3d';
    },
    onError: () => toast({ title: 'Failed to delete', variant: 'destructive' }),
  });

  const handleSave = () => {
    const payload: Record<string, unknown> = {
      name: form.name,
      description: form.description || undefined,
      slug: form.slug || undefined,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      isPublic: form.isPublic,
      allowedDomains: form.allowedDomains ? form.allowedDomains.split(',').map((d) => d.trim()).filter(Boolean) : undefined,
      features: {
        enableAR: form.enableAR,
        enableScreenshots: form.enableScreenshots,
        enableSharing: form.enableSharing,
        enableComparison: form.enableComparison,
      },
      metaTitle: form.metaTitle || undefined,
      metaDescription: form.metaDescription || undefined,
      ogImage: form.ogImage || undefined,
      customCss: form.customCss || undefined,
    };
    updateMutation.mutate(payload);
  };

  const updateForm = (updates: Partial<typeof form>) => setForm((f) => ({ ...f, ...updates }));

  if (isLoading || !config) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/configurator-3d/${id}`}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Configure your configurator</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Name, description, slug, tags</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => updateForm({ name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => updateForm({ description: e.target.value })} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => updateForm({ slug: e.target.value })} placeholder="my-configurator" />
          </div>
          <div className="space-y-2">
            <Label>Tags (comma-separated)</Label>
            <Input value={form.tags} onChange={(e) => updateForm({ tags: e.target.value })} placeholder="jewelry, custom" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Access</CardTitle>
          <CardDescription>Public, password, domains, expiration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Public</Label>
              <p className="text-sm text-muted-foreground">Anyone can access</p>
            </div>
            <Switch checked={form.isPublic} onCheckedChange={(v) => updateForm({ isPublic: v })} />
          </div>
          <div className="space-y-2">
            <Label>Password (optional)</Label>
            <Input type="password" value={form.password} onChange={(e) => updateForm({ password: e.target.value })} placeholder="Leave empty for no password" />
          </div>
          <div className="space-y-2">
            <Label>Allowed domains (comma-separated)</Label>
            <Input value={form.allowedDomains} onChange={(e) => updateForm({ allowedDomains: e.target.value })} placeholder="example.com, shop.example.com" />
          </div>
          <div className="space-y-2">
            <Label>Expiration (optional)</Label>
            <Input type="date" value={form.expiration} onChange={(e) => updateForm({ expiration: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>Toggles for AR, screenshots, sharing, comparison</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>AR</Label>
              <p className="text-sm text-muted-foreground">Allow AR view on mobile</p>
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
          <div className="flex items-center justify-between">
            <div>
              <Label>Comparison</Label>
              <p className="text-sm text-muted-foreground">Side-by-side comparison</p>
            </div>
            <Switch checked={form.enableComparison} onCheckedChange={(v) => updateForm({ enableComparison: v })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO</CardTitle>
          <CardDescription>Meta title, description, OG image</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Meta title</Label>
            <Input value={form.metaTitle} onChange={(e) => updateForm({ metaTitle: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Meta description</Label>
            <Textarea value={form.metaDescription} onChange={(e) => updateForm({ metaDescription: e.target.value })} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>OG image URL</Label>
            <Input value={form.ogImage} onChange={(e) => updateForm({ ogImage: e.target.value })} placeholder="https://..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom CSS</CardTitle>
          <CardDescription>Override styles for the configurator</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea value={form.customCss} onChange={(e) => updateForm({ customCss: e.target.value })} rows={6} className="font-mono text-sm" placeholder=".configurator { }" />
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>Archive or permanently delete this configuration</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button variant="outline" onClick={() => { if (confirm('Archive this configuration?')) archiveMutation.mutate(); }}>
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </Button>
          <Button variant="destructive" onClick={() => { if (confirm('Permanently delete? This cannot be undone.')) deleteMutation.mutate(); }}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
