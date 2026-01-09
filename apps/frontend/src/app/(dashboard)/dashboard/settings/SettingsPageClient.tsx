/**
 * Client Component pour la page Settings
 */

'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Shield, Bell, Settings as SettingsIcon } from 'lucide-react';
import { SettingsHeader } from './components/SettingsHeader';
import { ProfileTab } from './components/tabs/ProfileTab';
import { SecurityTab } from './components/tabs/SecurityTab';
import { NotificationsTab } from './components/tabs/NotificationsTab';
import { PreferencesTab } from './components/tabs/PreferencesTab';
import type { UserProfile, NotificationPreference, UserPreferences } from './types';

interface SettingsPageClientProps {
  initialProfile: UserProfile;
  initialNotificationPreferences?: NotificationPreference;
}

export function SettingsPageClient({
  initialProfile,
  initialNotificationPreferences,
}: SettingsPageClientProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<UserProfile>(initialProfile);

  const preferences: UserPreferences = useMemo(
    () => ({
      theme: 'system',
      language: 'fr',
      timezone: profile.timezone || 'Europe/Paris',
    }),
    [profile.timezone]
  );

  const handleProfileChange = (updatedProfile: Partial<UserProfile>) => {
    setProfile({ ...profile, ...updatedProfile });
  };

  return (
    <div className="space-y-6 pb-10">
      <SettingsHeader />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-900/50 border border-gray-700 grid grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="profile" className="data-[state=active]:bg-cyan-600">
            <User className="w-4 h-4 mr-2" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-cyan-600">
            <Shield className="w-4 h-4 mr-2" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-cyan-600">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-cyan-600">
            <SettingsIcon className="w-4 h-4 mr-2" />
            Préférences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab profile={profile} onProfileChange={handleProfileChange} />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab initialPreferences={initialNotificationPreferences} />
        </TabsContent>

        <TabsContent value="preferences">
          <PreferencesTab initialPreferences={preferences} />
        </TabsContent>
      </Tabs>
    </div>
  );
}



