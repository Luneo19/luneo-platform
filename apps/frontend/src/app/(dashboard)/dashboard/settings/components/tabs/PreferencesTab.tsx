/**
 * Onglet Préférences dans Settings
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, RefreshCw, Moon, Sun, Monitor } from 'lucide-react';
import { api } from '@/lib/api/client';
import { useProfileSettings } from '../../hooks/useProfileSettings';
import type { UserPreferences } from '../../types';

interface PreferencesTabProps {
  initialPreferences: UserPreferences;
}

export function PreferencesTab({ initialPreferences }: PreferencesTabProps) {
  const { handleUpdateProfile, isUpdating } = useProfileSettings();
  const [preferences, setPreferences] = useState<UserPreferences>(initialPreferences);

  const handleSave = async () => {
    await handleUpdateProfile({
      timezone: preferences.timezone,
    });
    await api.patch('/api/v1/auth/me', {
      preferences: { theme: preferences.theme, locale: preferences.language },
    });
  };

  return (
    <div className="space-y-6">
      {/* Theme */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Apparence</CardTitle>
          <CardDescription className="text-gray-400">
            Choisissez votre thème préféré
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'light', label: 'Clair', icon: Sun },
              { value: 'dark', label: 'Sombre', icon: Moon },
              { value: 'system', label: 'Système', icon: Monitor },
            ].map((theme) => {
              const Icon = theme.icon;
              return (
                <button
                  key={theme.value}
                  onClick={() => setPreferences({ ...preferences, theme: theme.value as any })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    preferences.theme === theme.value
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                  }`}
                >
                  <Icon className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-white text-sm">{theme.label}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Langue</CardTitle>
          <CardDescription className="text-gray-400">
            Choisissez votre langue préférée
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={preferences.language}
            onValueChange={(value) => setPreferences({ ...preferences, language: value })}
          >
            <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Timezone */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Fuseau horaire</CardTitle>
          <CardDescription className="text-gray-400">
            Choisissez votre fuseau horaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={preferences.timezone}
            onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}
          >
            <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Europe/Paris">Europe/Paris (GMT+1)</SelectItem>
              <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
              <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
              <SelectItem value="America/Los_Angeles">America/Los_Angeles (GMT-8)</SelectItem>
              <SelectItem value="Asia/Tokyo">Asia/Tokyo (GMT+9)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isUpdating}
          className="bg-gradient-to-r from-cyan-600 to-blue-600"
        >
          {isUpdating ? (
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



