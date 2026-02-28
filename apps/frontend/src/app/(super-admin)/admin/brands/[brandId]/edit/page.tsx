'use client';

/**
 * Admin Brand Edit Page
 * Super Admin page for editing brand details
 * Uses fetch with credentials for API calls (admin section pattern)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useBrandDetail } from '@/hooks/admin/use-brand-detail';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
  { value: 'VERIFIED', label: 'Verified' },
];

const PLAN_OPTIONS = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'business', label: 'Business' },
  { value: 'enterprise', label: 'Enterprise' },
];

const SUBSCRIPTION_STATUS_OPTIONS = [
  { value: 'TRIALING', label: 'Trialing' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAST_DUE', label: 'Past Due' },
  { value: 'CANCELED', label: 'Canceled' },
  { value: 'UNPAID', label: 'Unpaid' },
];

export default function BrandEditPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = typeof params.brandId === 'string' ? params.brandId : null;
  const { brand, isLoading, isError, refresh } = useBrandDetail(brandId);
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStripe, setSyncStripe] = useState(false);
  const [formData, setFormData] = useState<Partial<BrandEditFormData>>({});

  const updateFormField = useCallback(<K extends keyof BrandEditFormData>(
    key: K,
    value: BrandEditFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name,
        description: brand.description ?? '',
        website: brand.website ?? '',
        industry: brand.industry ?? '',
        status: brand.status,
        plan: brand.subscriptionPlan || brand.plan || 'free',
        subscriptionStatus: brand.subscriptionStatus ?? 'TRIALING',
        maxProducts: brand.maxProducts ?? 5,
        maxMonthlyGenerations: brand.maxMonthlyGenerations ?? 100,
        aiCostLimitCents: brand.aiCostLimitCents ?? 500000,
      });
    }
  }, [brand]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandId) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/brands/${brandId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          website: formData.website || undefined,
          industry: formData.industry || undefined,
          status: formData.status,
          plan: formData.plan,
          subscriptionPlan: formData.plan,
          subscriptionStatus: formData.subscriptionStatus,
          maxProducts: formData.maxProducts,
          maxMonthlyGenerations: formData.maxMonthlyGenerations,
          aiCostLimitCents: formData.aiCostLimitCents,
          syncStripe: syncStripe || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errMsg = data.message || data.error || 'Failed to update brand';
        setError(typeof errMsg === 'string' ? errMsg : 'Failed to update brand');
        logger.error('Brand update failed', { status: res.status, data });
        toast({
          variant: 'destructive',
          title: 'Error',
          description: errMsg,
        });
        return;
      }

      toast({
        title: 'Brand updated',
        description: 'Brand details have been saved successfully.',
      });
      refresh();
      router.push(`/admin/brands/${brandId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(msg);
      logger.error('Brand update error', { error: err });
      toast({
        variant: 'destructive',
        title: 'Error',
        description: msg,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/admin/brands/${brandId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (isError || !brand) {
    return (
      <div className="p-6">
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-6 text-center">
            <p className="text-red-400">Brand not found</p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button variant="outline" onClick={() => refresh()} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                Retry
              </Button>
              <Link href="/admin/brands">
                <Button variant="outline">Back</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/brands/${brandId}`}>
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white">
          {brand.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Edit Brand</h1>
          <p className="text-sm text-zinc-400 mt-1">{brand.slug}</p>
        </div>
      </div>

      {error && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Brand Info */}
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Basic Information</CardTitle>
            <CardDescription className="text-zinc-400">
              Core brand details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-300">Name</Label>
                <Input
                  id="name"
                  value={formData.name ?? ''}
                  onChange={(e) => updateFormField('name', e.target.value)}
                  placeholder="Brand name"
                  className="bg-zinc-900 border-zinc-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-zinc-300">Slug</Label>
                <Input
                  id="slug"
                  value={brand.slug}
                  disabled
                  className="bg-zinc-900/50 border-zinc-700 text-zinc-500"
                />
                <p className="text-xs text-zinc-500">Slug cannot be changed</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-zinc-300">Description</Label>
              <Textarea
                id="description"
                value={formData.description ?? ''}
                onChange={(e) => updateFormField('description', e.target.value)}
                placeholder="Brand description"
                rows={3}
                className="bg-zinc-900 border-zinc-700 text-white resize-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website" className="text-zinc-300">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website ?? ''}
                  onChange={(e) => updateFormField('website', e.target.value)}
                  placeholder="https://example.com"
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry" className="text-zinc-300">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry ?? ''}
                  onChange={(e) => updateFormField('industry', e.target.value)}
                  placeholder="e.g. jewelry, watches, glasses"
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-zinc-300">Status</Label>
              <Select
                value={formData.status ?? 'ACTIVE'}
                onValueChange={(v) => updateFormField('status', v)}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Brand Settings / Limits */}
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Brand Settings</CardTitle>
            <CardDescription className="text-zinc-400">
              Plan, limits, and quotas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan" className="text-zinc-300">Plan</Label>
                <Select
                  value={formData.plan ?? 'free'}
                  onValueChange={(v) => updateFormField('plan', v)}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAN_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscriptionStatus" className="text-zinc-300">Subscription Status</Label>
                <Select
                  value={formData.subscriptionStatus ?? 'TRIALING'}
                  onValueChange={(v) => updateFormField('subscriptionStatus', v)}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxProducts" className="text-zinc-300">Max Products</Label>
                <Input
                  id="maxProducts"
                  type="number"
                  min={0}
                  value={formData.maxProducts ?? 0}
                  onChange={(e) => updateFormField('maxProducts', parseInt(e.target.value, 10) || 0)}
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxMonthlyGenerations" className="text-zinc-300">Max Monthly AI Generations</Label>
                <Input
                  id="maxMonthlyGenerations"
                  type="number"
                  min={0}
                  value={formData.maxMonthlyGenerations ?? 0}
                  onChange={(e) => updateFormField('maxMonthlyGenerations', parseInt(e.target.value, 10) || 0)}
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aiCostLimitCents" className="text-zinc-300">AI Cost Limit (cents)</Label>
                <Input
                  id="aiCostLimitCents"
                  type="number"
                  min={0}
                  value={formData.aiCostLimitCents ?? 0}
                  onChange={(e) => updateFormField('aiCostLimitCents', parseInt(e.target.value, 10) || 0)}
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
                <p className="text-xs text-zinc-500">e.g. 500000 = 5000€</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="syncStripe"
                checked={syncStripe}
                onCheckedChange={(checked) => setSyncStripe(checked === true)}
                className="border-zinc-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <Label
                htmlFor="syncStripe"
                className="text-zinc-300 text-sm font-normal cursor-pointer"
              >
                Synchroniser avec Stripe
              </Label>
            </div>
            <p className="text-xs text-zinc-500">
              Si coché et que le plan a changé, la souscription Stripe sera mise à jour.
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

interface BrandEditFormData {
  name: string;
  description: string;
  website: string;
  industry: string;
  status: string;
  plan: string;
  subscriptionStatus: string;
  maxProducts: number;
  maxMonthlyGenerations: number;
  aiCostLimitCents: number;
}
