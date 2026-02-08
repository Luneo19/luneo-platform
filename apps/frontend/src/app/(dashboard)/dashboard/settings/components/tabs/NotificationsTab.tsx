/**
 * Onglet Notifications dans Settings
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Save, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { endpoints } from '@/lib/api/client';
import type { NotificationPreference } from '../../types';

interface NotificationsTabProps {
  initialPreferences?: NotificationPreference;
}

export function NotificationsTab({ initialPreferences }: NotificationsTabProps) {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreference>(
    initialPreferences || {
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
    }
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await endpoints.settings.notifications(preferences as unknown as Record<string, unknown>);
      toast({ title: 'Succès', description: 'Préférences mises à jour' });
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'message' in error
        ? String((error as { message: string }).message)
        : 'Erreur lors de la mise à jour';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Notifications Email</CardTitle>
          <CardDescription className="text-gray-600">
            Choisissez les notifications que vous souhaitez recevoir par email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-700">Commandes</Label>
              <p className="text-sm text-gray-500">Notifications sur vos commandes</p>
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
              <Label className="text-gray-700">Designs</Label>
              <p className="text-sm text-gray-500">Notifications sur vos designs</p>
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
              <Label className="text-gray-700">Marketing</Label>
              <p className="text-sm text-gray-500">Newsletters et offres promotionnelles</p>
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
              <Label className="text-gray-700">Alertes de sécurité</Label>
              <p className="text-sm text-gray-500">Notifications importantes de sécurité</p>
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
          <CardTitle className="text-gray-900">Notifications In-App</CardTitle>
          <CardDescription className="text-gray-600">
            Choisissez les notifications affichées dans l'application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-700">Commandes</Label>
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
              <Label className="text-gray-700">Designs</Label>
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
              <Label className="text-gray-700">Système</Label>
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
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

