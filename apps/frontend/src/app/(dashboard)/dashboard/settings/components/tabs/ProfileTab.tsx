/**
 * Onglet Profil dans Settings
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, RefreshCw } from 'lucide-react';
import { useProfileSettings } from '../../hooks/useProfileSettings';
import type { UserProfile } from '../../types';

interface ProfileTabProps {
  profile: UserProfile;
  onProfileChange: (profile: Partial<UserProfile>) => void;
}

export function ProfileTab({ profile, onProfileChange }: ProfileTabProps) {
  const { handleUpdateProfile, isUpdating } = useProfileSettings();
  const [localProfile, setLocalProfile] = useState<Partial<UserProfile>>(profile);

  const handleSave = async () => {
    const result = await handleUpdateProfile(localProfile);
    if (result.success) {
      onProfileChange(localProfile);
    }
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-900">Informations personnelles</CardTitle>
        <CardDescription className="text-gray-600">
          Gérez vos informations de profil
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-700">Nom</Label>
            <Input
              value={localProfile.name || ''}
              onChange={(e) => setLocalProfile({ ...localProfile, name: e.target.value })}
              className="bg-white border-gray-200 text-gray-900 mt-1"
            />
          </div>
          <div>
            <Label className="text-gray-700">Email</Label>
            <Input
              value={profile.email}
              disabled
              className="bg-gray-50 border-gray-200 text-gray-500 mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
          </div>
          <div>
            <Label className="text-gray-700">Téléphone</Label>
            <Input
              value={localProfile.phone || ''}
              onChange={(e) => setLocalProfile({ ...localProfile, phone: e.target.value })}
              className="bg-white border-gray-200 text-gray-900 mt-1"
            />
          </div>
          <div>
            <Label className="text-gray-700">Entreprise</Label>
            <Input
              value={localProfile.company || ''}
              onChange={(e) => setLocalProfile({ ...localProfile, company: e.target.value })}
              className="bg-white border-gray-200 text-gray-900 mt-1"
            />
          </div>
          <div>
            <Label className="text-gray-700">Site web</Label>
            <Input
              value={localProfile.website || ''}
              onChange={(e) => setLocalProfile({ ...localProfile, website: e.target.value })}
              placeholder="https://example.com"
              className="bg-white border-gray-200 text-gray-900 mt-1"
            />
          </div>
          <div>
            <Label className="text-gray-700">Localisation</Label>
            <Input
              value={localProfile.location || ''}
              onChange={(e) => setLocalProfile({ ...localProfile, location: e.target.value })}
              className="bg-white border-gray-200 text-gray-900 mt-1"
            />
          </div>
        </div>
        <div>
          <Label className="text-gray-700">Bio</Label>
          <Textarea
            value={localProfile.bio || ''}
            onChange={(e) => setLocalProfile({ ...localProfile, bio: e.target.value })}
            rows={4}
            className="bg-white border-gray-200 text-gray-900 mt-1"
            placeholder="Décrivez-vous en quelques mots..."
          />
        </div>
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
      </CardContent>
    </Card>
  );
}



