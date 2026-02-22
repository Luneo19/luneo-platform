'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Mail, Smartphone, Bell, Save } from 'lucide-react';
import type { NotificationPreferences } from './types';

interface NotificationsPreferencesTabProps {
  preferences: NotificationPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<NotificationPreferences>>;
  onSave: () => void;
}

const EMAIL_LABELS: Record<string, string> = { orders: 'Commandes', customizations: 'Personnalisations', system: 'Système', marketing: 'Marketing' };
const PUSH_LABELS: Record<string, string> = { orders: 'Commandes', customizations: 'Personnalisations', system: 'Système' };
const INAPP_LABELS: Record<string, string> = { orders: 'Commandes', customizations: 'Personnalisations', system: 'Système' };

export function NotificationsPreferencesTab({ preferences, setPreferences, onSave }: NotificationsPreferencesTabProps) {
  return (
    <Card className="bg-zinc-800/50 border-zinc-700">
      <CardHeader>
        <CardTitle className="text-white">Préférences de notifications</CardTitle>
        <CardDescription className="text-zinc-400">Configurez comment et quand vous recevez des notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-400" />
            Notifications Email
          </h3>
          <div className="space-y-3">
            {Object.entries(preferences.email).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg">
                <Label htmlFor={`email-${key}`} className="text-zinc-300 cursor-pointer">{EMAIL_LABELS[key] ?? key}</Label>
                <Checkbox
                  id={`email-${key}`}
                  checked={value}
                  onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, email: { ...prev.email, [key]: checked as boolean } }))}
                />
              </div>
            ))}
          </div>
        </div>
        <Separator className="bg-zinc-700" />
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-400" />
            Notifications Push
          </h3>
          <div className="space-y-3">
            {Object.entries(preferences.push).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg">
                <Label htmlFor={`push-${key}`} className="text-zinc-300 cursor-pointer">{PUSH_LABELS[key] ?? key}</Label>
                <Checkbox
                  id={`push-${key}`}
                  checked={value}
                  onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, push: { ...prev.push, [key]: checked as boolean } }))}
                />
              </div>
            ))}
          </div>
        </div>
        <Separator className="bg-zinc-700" />
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" />
            Notifications In-App
          </h3>
          <div className="space-y-3">
            {Object.entries(preferences.inApp).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg">
                <Label htmlFor={`inapp-${key}`} className="text-zinc-300 cursor-pointer">{INAPP_LABELS[key] ?? key}</Label>
                <Checkbox
                  id={`inapp-${key}`}
                  checked={value}
                  onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, inApp: { ...prev.inApp, [key]: checked as boolean } }))}
                />
              </div>
            ))}
          </div>
        </div>
        <Separator className="bg-zinc-700" />
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Autres préférences</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg">
              <Label htmlFor="sound" className="text-zinc-300 cursor-pointer">Sons de notification</Label>
              <Checkbox id="sound" checked={preferences.sound} onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, sound: checked as boolean }))} />
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg">
              <Label htmlFor="dnd" className="text-zinc-300 cursor-pointer">Ne pas déranger</Label>
              <Checkbox
                id="dnd"
                checked={preferences.doNotDisturb.enabled}
                onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, doNotDisturb: { ...prev.doNotDisturb, enabled: checked as boolean } }))}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <Button onClick={onSave} className="bg-cyan-600 hover:bg-cyan-700">
            <Save className="w-4 h-4 mr-2" />
            Enregistrer les préférences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
