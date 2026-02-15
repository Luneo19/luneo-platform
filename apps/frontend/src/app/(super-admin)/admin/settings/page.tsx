'use client';

/**
 * Admin Settings - Configuration générale de la plateforme
 * Connected to GET/PUT /api/admin/settings (proxied to backend /api/v1/admin/settings)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/i18n/useI18n';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Settings,
  Shield,
  Bell,
  Wrench,
  Globe,
  Clock,
  Languages,
  CheckCircle,
  Save,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

interface PlatformSettings {
  enforce2FA: boolean;
  sessionTimeout: number;
  ipWhitelist: string;
  emailNotifications: boolean;
  webhookAlerts: boolean;
  maintenanceMode: boolean;
  platformName: string;
  defaultLanguage: string;
  timezone: string;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  enforce2FA: false,
  sessionTimeout: 30,
  ipWhitelist: '',
  emailNotifications: true,
  webhookAlerts: true,
  maintenanceMode: false,
  platformName: 'Luneo',
  defaultLanguage: 'Français',
  timezone: 'Europe/Paris',
};

export default function AdminSettingsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchWithTimeout('/api/admin/settings', {
        credentials: 'include',
        timeout: 10000,
      });
      if (!res.ok) throw new Error(`Failed to load settings (${res.status})`);
      const data = (await res.json()) as { settings?: Partial<PlatformSettings> };
      const settingsData = data?.settings;
      if (settingsData && typeof settingsData === 'object') {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...settingsData,
          sessionTimeout: Number(settingsData.sessionTimeout) || 30,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load settings';
      const isAbort = err instanceof Error && err.name === 'AbortError';
      setError(isAbort ? 'Request timed out. Please try again.' : message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetchWithTimeout('/api/admin/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
        timeout: 10000,
      });

      if (!res.ok) throw new Error(`Failed to save settings (${res.status})`);

      toast({ title: t('admin.settingsSaved'), description: t('admin.settingsSavedDesc') });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save settings';
      const isAbort = err instanceof Error && err.name === 'AbortError';
      toast({
        title: t('common.error'),
        description: isAbort ? 'Request timed out. Please try again.' : message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen bg-zinc-900 text-zinc-100 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="h-8 w-8 text-zinc-400" />
            {t('common.settings')}
          </h1>
          <p className="mt-2 text-zinc-400">
            {t('admin.settingsPageSubtitle')}
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('admin.saving')}</>
          ) : (
            <><Save className="h-4 w-4 mr-2" />{t('common.save')}</>
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={fetchSettings} className="ml-auto text-red-300 hover:text-red-200">
            {t('common.retry')}
          </Button>
        </div>
      )}

      {/* Settings grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* General */}
        <Card className="border-zinc-700 bg-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Globe className="h-5 w-5 text-cyan-400" />
              {t('admin.general')}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {t('admin.generalDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300 flex items-center gap-2">
                <Globe className="h-4 w-4 text-zinc-500" />
                {t('admin.platformName')}
              </Label>
              <Input
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                className="bg-zinc-900 border-zinc-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300 flex items-center gap-2">
                <Languages className="h-4 w-4 text-zinc-500" />
                Langue par défaut
              </Label>
              <Input
                value={settings.defaultLanguage}
                onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                className="bg-zinc-900 border-zinc-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300 flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-500" />
                {t('admin.timezone')}
              </Label>
              <Input
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="bg-zinc-900 border-zinc-600 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sécurité */}
        <Card className="border-zinc-700 bg-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-amber-400" />
              {t('admin.securityTitle')}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {t('admin.securityDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-zinc-900/50 p-3">
              <div>
                <p className="text-sm font-medium text-zinc-300">{t('admin.enforce2FA')}</p>
                <p className="text-xs text-zinc-500">
                  {t('admin.enforce2FADesc')}
                </p>
              </div>
              <Switch
                checked={settings.enforce2FA}
                onCheckedChange={(v) => setSettings({ ...settings, enforce2FA: v })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">{t('admin.sessionTimeout')}</Label>
              <Input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 30 })}
                className="bg-zinc-900 border-zinc-600 text-white"
                min="5"
                max="1440"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">{t('admin.ipWhitelist')}</Label>
              <Input
                value={settings.ipWhitelist}
                onChange={(e) => setSettings({ ...settings, ipWhitelist: e.target.value })}
                placeholder={t('admin.ipWhitelistPlaceholder')}
                className="bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-zinc-700 bg-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Bell className="h-5 w-5 text-purple-400" />
              {t('admin.notificationsTitle')}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {t('admin.notificationsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-zinc-900/50 p-3">
              <div>
                <p className="text-sm font-medium text-zinc-300">{t('admin.emailNotifications')}</p>
                <p className="text-xs text-zinc-500">
                  {t('admin.emailNotificationsDesc')}
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(v) => setSettings({ ...settings, emailNotifications: v })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-zinc-900/50 p-3">
              <div>
                <p className="text-sm font-medium text-zinc-300">{t('admin.webhookAlerts')}</p>
                <p className="text-xs text-zinc-500">
                  {t('admin.webhookAlertsDesc')}
                </p>
              </div>
              <Switch
                checked={settings.webhookAlerts}
                onCheckedChange={(v) => setSettings({ ...settings, webhookAlerts: v })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Maintenance */}
        <Card className="border-zinc-700 bg-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Wrench className="h-5 w-5 text-green-400" />
              {t('admin.maintenanceTitle')}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {t('admin.maintenanceDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-zinc-900/50 p-3">
              <div>
                <p className="text-sm font-medium text-zinc-300">{t('admin.maintenanceMode')}</p>
                <p className="text-xs text-zinc-500">
                  {t('admin.maintenanceModeDesc')}
                </p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(v) => setSettings({ ...settings, maintenanceMode: v })}
              />
            </div>
            <div className="rounded-lg bg-zinc-900/50 p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <p className="text-sm font-medium text-zinc-300">{t('admin.systemStatus')}</p>
              </div>
              <p className="text-xs text-green-400/80 mt-1 ml-6">
                {t('admin.allServicesOperational')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
