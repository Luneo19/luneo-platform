/**
 * White-Label Configuration Page
 * Dashboard page for brands to configure white-label settings.
 * Requires Business plan or higher.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Palette,
  Upload,
  Globe,
  Mail,
  Sparkles,
  ExternalLink,
  Loader2,
  RotateCcw,
  Check,
  Crown,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { logger } from '@/lib/logger';
import { endpoints } from '@/lib/api/client';
import { useFeatureGate } from '@/lib/hooks/api/useFeatureGate';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface WhiteLabelSettings {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  customDomain: string;
  emailFromName: string;
  emailReplyTo: string;
  removeLuneoBranding: boolean;
}

const DEFAULT_SETTINGS: WhiteLabelSettings = {
  logoUrl: '',
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  accentColor: '#06b6d4',
  customDomain: '',
  emailFromName: '',
  emailReplyTo: '',
  removeLuneoBranding: false,
};

function WhiteLabelUpgradePrompt() {
  const router = useRouter();
  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Palette className="w-8 h-8 text-amber-400" />
          White-Label
        </h1>
        <p className="text-gray-400 mt-1">
          Configure your brand identity across the platform
        </p>
      </div>

      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-amber-900/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
        <CardContent className="relative p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-semibold text-white mb-2">
                White-Label is a premium feature
              </h2>
              <p className="text-gray-400 mb-4 max-w-md">
                Customize your logo, colors, domain, and email branding. Remove all Luneo
                mentions for a fully white-labeled experience. Available on Business and
                Enterprise plans.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Button
                  onClick={() => router.push('/dashboard/billing')}
                  className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upgrade to Business
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/pricing')}
                  className="border-amber-500/50 hover:bg-amber-500/10"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View plans
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WhiteLabelPageContent() {
  const { toast } = useToast();
  const { hasAccess, isLoading: isPlanLoading } = useFeatureGate('whiteLabel');

  const [settings, setSettings] = useState<WhiteLabelSettings>(DEFAULT_SETTINGS);
  const [initialSettings, setInitialSettings] = useState<WhiteLabelSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await endpoints.brands.settings();
      const data = (res as { brandSettings?: Record<string, unknown> })?.brandSettings ??
        (res as Record<string, unknown>);
      if (data) {
        const loaded: WhiteLabelSettings = {
          logoUrl: (data.logo_url as string) ?? DEFAULT_SETTINGS.logoUrl,
          primaryColor: (data.primary_color as string) ?? DEFAULT_SETTINGS.primaryColor,
          secondaryColor: (data.secondary_color as string) ?? DEFAULT_SETTINGS.secondaryColor,
          accentColor: (data.accent_color as string) ?? DEFAULT_SETTINGS.accentColor,
          customDomain: (data.custom_domain as string) ?? DEFAULT_SETTINGS.customDomain,
          emailFromName: (data.email_from_name as string) ?? DEFAULT_SETTINGS.emailFromName,
          emailReplyTo: (data.email_reply_to as string) ?? DEFAULT_SETTINGS.emailReplyTo,
          removeLuneoBranding: Boolean(data.remove_luneo_branding ?? DEFAULT_SETTINGS.removeLuneoBranding),
        };
        setSettings(loaded);
        setInitialSettings(loaded);
      }
    } catch (error) {
      logger.error('Failed to fetch white-label settings', error instanceof Error ? error : new Error(String(error)));
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getErrorDisplayMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (hasAccess) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [hasAccess, fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await endpoints.brands.updateSettings({
        logo_url: settings.logoUrl,
        primary_color: settings.primaryColor,
        secondary_color: settings.secondaryColor,
        accent_color: settings.accentColor,
        custom_domain: settings.customDomain,
        email_from_name: settings.emailFromName,
        email_reply_to: settings.emailReplyTo,
        remove_luneo_branding: settings.removeLuneoBranding,
      });
      setInitialSettings(settings);
      toast({ title: 'Saved', description: 'White-label settings updated successfully' });
    } catch (error) {
      logger.error('Failed to save white-label settings', error instanceof Error ? error : new Error(String(error)));
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getErrorDisplayMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(initialSettings ?? DEFAULT_SETTINGS);
    toast({ title: 'Reset', description: 'Settings reverted to last saved state' });
  };

  const handleLogoUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setLogoUploading(true);
      try {
        // Upload to Cloudinary using upload preset
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'luneo_logos';

        if (!cloudName) {
          throw new Error('Cloudinary not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        formData.append('folder', 'luneo/white-label/logos');

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Upload failed' }));
          throw new Error(error.error?.message || 'Failed to upload logo');
        }

        const result = await response.json();
        const logoUrl = result.secure_url || result.url;

        // Update settings with new logo URL
        setSettings((s) => ({ ...s, logoUrl }));
        toast({
          title: 'Logo uploaded',
          description: 'Logo has been uploaded successfully',
        });
      } catch (error) {
        logger.error('Failed to upload logo', error instanceof Error ? error : new Error(String(error)));
        toast({
          variant: 'destructive',
          title: 'Upload failed',
          description: getErrorDisplayMessage(error),
        });
      } finally {
        setLogoUploading(false);
      }
    };
    input.click();
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings ?? DEFAULT_SETTINGS);

  if (isPlanLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-2 border-white/[0.06]" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-500 animate-spin" />
        </div>
        <p className="text-gray-400">Loading white-label settings...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return <WhiteLabelUpgradePrompt />;
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Palette className="w-8 h-8 text-cyan-400" />
            White-Label
          </h1>
          <p className="text-gray-400 mt-1">
            Configure your brand identity across the platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges || saving}
            className="border-gray-600"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Logo */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-400" />
                Logo
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your brand logo (PNG, SVG recommended). Upload via Cloudinary.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div
                  className="flex-shrink-0 w-32 h-32 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center bg-gray-900/50 overflow-hidden"
                  style={{ borderColor: settings.primaryColor + '40' }}
                >
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt="Logo"
                      className="max-w-full max-h-full object-contain p-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Upload className="w-10 h-10 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Label className="text-gray-300">Logo URL</Label>
                  <Input
                    value={settings.logoUrl}
                    onChange={(e) => setSettings((s) => ({ ...s, logoUrl: e.target.value }))}
                    placeholder="https://cdn.example.com/logo.png"
                    className="bg-gray-900 border-gray-600 text-white"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogoUpload}
                    disabled={logoUploading}
                    className="border-gray-600"
                  >
                    {logoUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Upload (Cloudinary)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Color scheme</CardTitle>
              <CardDescription className="text-gray-400">
                Customize your brand colors across the experience
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { key: 'primaryColor' as const, label: 'Primary' },
                { key: 'secondaryColor' as const, label: 'Secondary' },
                { key: 'accentColor' as const, label: 'Accent' },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <Label className="text-gray-300">{label}</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings[key]}
                      onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
                      className="h-10 w-10 cursor-pointer rounded border border-gray-600 bg-transparent"
                    />
                    <Input
                      value={settings[key]}
                      onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
                      className="bg-gray-900 border-gray-600 text-white flex-1"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Custom domain */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                Custom domain
              </CardTitle>
              <CardDescription className="text-gray-400">
                Use your own domain for the customer-facing experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-gray-300">Domain</Label>
                <Input
                  value={settings.customDomain}
                  onChange={(e) => setSettings((s) => ({ ...s, customDomain: e.target.value }))}
                  placeholder="app.yourbrand.com"
                  className="bg-gray-900 border-gray-600 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Email branding */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-cyan-400" />
                Email template branding
              </CardTitle>
              <CardDescription className="text-gray-400">
                Customize sender name and reply-to for transactional emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">From name</Label>
                <Input
                  value={settings.emailFromName}
                  onChange={(e) => setSettings((s) => ({ ...s, emailFromName: e.target.value }))}
                  placeholder="Your Brand"
                  className="bg-gray-900 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Reply-to</Label>
                <Input
                  type="email"
                  value={settings.emailReplyTo}
                  onChange={(e) => setSettings((s) => ({ ...s, emailReplyTo: e.target.value }))}
                  placeholder="support@yourbrand.com"
                  className="bg-gray-900 border-gray-600 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Remove Luneo branding */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Branding visibility</CardTitle>
              <CardDescription className="text-gray-400">
                Remove all Luneo logos and mentions from the customer-facing experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="remove-branding" className="text-gray-300 cursor-pointer">
                  Remove Luneo branding
                </Label>
                <Switch
                  id="remove-branding"
                  checked={settings.removeLuneoBranding}
                  onCheckedChange={(checked) =>
                    setSettings((s) => ({ ...s, removeLuneoBranding: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <Card className="bg-gray-800/50 border-gray-700 sticky top-6">
            <CardHeader>
              <CardTitle className="text-white">Preview</CardTitle>
              <CardDescription className="text-gray-400">
                How your branding will look
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-lg border border-gray-600 overflow-hidden p-6 space-y-4"
                style={{
                  backgroundColor: settings.primaryColor + '10',
                  borderColor: settings.primaryColor + '30',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: settings.primaryColor }}
                  >
                    {settings.logoUrl ? (
                      <img
                        src={settings.logoUrl}
                        alt="Logo"
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : null}
                    {!settings.logoUrl && (
                      <span className="text-white font-bold text-lg">
                        {settings.emailFromName?.[0] || 'B'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {settings.emailFromName || 'Your Brand'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {settings.customDomain || 'app.example.com'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div
                    className="h-8 flex-1 rounded"
                    style={{ backgroundColor: settings.primaryColor }}
                  />
                  <div
                    className="h-8 flex-1 rounded"
                    style={{ backgroundColor: settings.secondaryColor }}
                  />
                  <div
                    className="h-8 flex-1 rounded"
                    style={{ backgroundColor: settings.accentColor }}
                  />
                </div>
                {!settings.removeLuneoBranding && (
                  <p className="text-xs text-gray-500">Powered by Luneo</p>
                )}
                {settings.removeLuneoBranding && (
                  <p className="text-xs text-green-500/80 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Luneo branding hidden
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function WhiteLabelPageClient() {
  return (
    <ErrorBoundary level="page" componentName="WhiteLabelPage">
      <WhiteLabelPageContent />
    </ErrorBoundary>
  );
}
