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
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/hooks/use-toast';
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

  // TODO: Créer updateNotificationPreferences dans le router profile
  // Pour l'instant, on utilise une mutation temporaire
  const updateMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Préférences mises à jour' });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la mise à jour',
        variant: 'destructive',
      });
    },
  });

  const handleSave = async () => {
    // TODO: Implémenter updateNotificationPreferences dans le router
    // Pour l'instant, on sauvegarde dans les métadonnées du profil
    await updateMutation.mutateAsync({
      metadata: {
        notificationPreferences: preferences,
      },
    } as any);
  };

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Notifications Email</CardTitle>
          <CardDescription className="text-gray-400">
            Choisissez les notifications que vous souhaitez recevoir par email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-300">Commandes</Label>
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
              <Label className="text-gray-300">Designs</Label>
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
              <Label className="text-gray-300">Marketing</Label>
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
              <Label className="text-gray-300">Alertes de sécurité</Label>
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
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Notifications In-App</CardTitle>
          <CardDescription className="text-gray-400">
            Choisissez les notifications affichées dans l'application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-300">Commandes</Label>
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
              <Label className="text-gray-300">Designs</Label>
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
              <Label className="text-gray-300">Système</Label>
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
          disabled={updateMutation.isPending}
          className="bg-gradient-to-r from-cyan-600 to-blue-600"
        >
          {updateMutation.isPending ? (
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

