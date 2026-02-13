/**
 * Onglet Notifications dans Settings
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Save, RefreshCw } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import { useToast } from '@/hooks/use-toast';
import { endpoints } from '@/lib/api/client';
import type { NotificationPreference } from '../../types';

const DEFAULT_PREFERENCES: NotificationPreference = {
  email: {
    orders: true,
    designs: true,
    marketing: false,
    securityAlerts: true,
  },
  push: {
    orders: true,
    designs: true,
  },
  inApp: {
    orders: true,
    designs: true,
    system: true,
  },
};

interface NotificationsTabProps {
  initialPreferences?: NotificationPreference;
}

export function NotificationsTab({ initialPreferences }: NotificationsTabProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreference>(
    initialPreferences ?? DEFAULT_PREFERENCES
  );
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(!initialPreferences);

  useEffect(() => {
    if (initialPreferences !== undefined) return;
    let cancelled = false;
    endpoints.settings.getNotifications()
      .then((res) => {
        if (cancelled) return;
        const p = res as Partial<NotificationPreference>;
        setPreferences({
          email: { ...DEFAULT_PREFERENCES.email, ...p.email },
          push: { ...DEFAULT_PREFERENCES.push, ...p.push },
          inApp: { ...DEFAULT_PREFERENCES.inApp, ...p.inApp },
        });
      })
      .catch(() => {
        if (!cancelled) setPreferences(DEFAULT_PREFERENCES);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [initialPreferences]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await endpoints.settings.notifications(preferences as unknown as Record<string, unknown>);
      toast({ title: t('common.success'), description: t('settings.notifications.successUpdated') });
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'message' in error
        ? String((error as { message: string }).message)
        : t('settings.notifications.errorUpdate');
      toast({
        title: t('common.error'),
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 text-gray-500">
        <p>{t('settings.notifications.loadingPrefs')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">{t('settings.notifications.emailTitle')}</CardTitle>
          <CardDescription className="text-gray-600">
            {t('settings.notifications.emailDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-700">{t('settings.notifications.orders')}</Label>
              <p className="text-sm text-gray-500">{t('settings.notifications.ordersDesc')}</p>
            </div>
            <Checkbox
              checked={preferences.email.orders}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  email: { ...preferences.email, orders: checked as boolean },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-700">{t('settings.notifications.designs')}</Label>
              <p className="text-sm text-gray-500">{t('settings.notifications.designsDesc')}</p>
            </div>
            <Checkbox
              checked={preferences.email.designs}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  email: { ...preferences.email, designs: checked as boolean },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-700">{t('settings.notifications.marketing')}</Label>
              <p className="text-sm text-gray-500">{t('settings.notifications.marketingDesc')}</p>
            </div>
            <Checkbox
              checked={preferences.email.marketing}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  email: { ...preferences.email, marketing: checked as boolean },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-700">{t('settings.notifications.securityAlerts')}</Label>
              <p className="text-sm text-gray-500">{t('settings.notifications.securityAlertsDesc')}</p>
            </div>
            <Checkbox
              checked={preferences.email.securityAlerts}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  email: { ...preferences.email, securityAlerts: checked as boolean },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* In-App Notifications */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">{t('settings.notifications.inAppTitle')}</CardTitle>
          <CardDescription className="text-gray-600">
            {t('settings.notifications.inAppDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-700">{t('settings.notifications.orders')}</Label>
            </div>
            <Checkbox
              checked={preferences.inApp.orders}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  inApp: { ...preferences.inApp, orders: checked as boolean },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-700">{t('settings.notifications.designs')}</Label>
            </div>
            <Checkbox
              checked={preferences.inApp.designs}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  inApp: { ...preferences.inApp, designs: checked as boolean },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-700">{t('settings.notifications.system')}</Label>
            </div>
            <Checkbox
              checked={preferences.inApp.system}
              onCheckedChange={(checked) =>
                setPreferences({
                  ...preferences,
                  inApp: { ...preferences.inApp, system: checked as boolean },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-cyan-600 to-blue-600"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              {t('settings.notifications.saving')}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {t('settings.profile.save')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

