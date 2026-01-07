/**
 * ★★★ PAGE - SETTINGS ★★★
 * Page Server Component pour les paramètres
 * 
 * Architecture:
 * - Server Component qui fetch les données initiales
 * - Client Component pour les interactions
 * - Composants < 300 lignes
 * - Types stricts (pas de any)
 */

import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SettingsPageClient } from './SettingsPageClient';
import { SettingsSkeleton } from './components/SettingsSkeleton';
// Note: On ne peut pas utiliser trpc directement dans un Server Component
// On utilisera fetch ou Supabase directement

export const metadata = {
  title: 'Paramètres | Luneo',
  description: 'Gérez vos préférences et configurations',
};

/**
 * Server Component - Fetch les données initiales
 */
export default async function SettingsPage() {
  const supabase = await createClient();

  // Vérifier l'authentification
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <ErrorBoundary level="page" componentName="SettingsPage">
        <div className="p-6">
          <p className="text-red-400">Non authentifié</p>
        </div>
      </ErrorBoundary>
    );
  }

  // Fetch profile data from Supabase
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profileData) {
    return (
      <ErrorBoundary level="page" componentName="SettingsPage">
        <div className="p-6">
          <p className="text-red-400">Erreur lors du chargement du profil</p>
        </div>
      </ErrorBoundary>
    );
  }

  const metadata = (profileData.metadata || {}) as any;

  const initialProfile = {
    id: profileData.id,
    name: profileData.name || '',
    email: user.email || '',
    phone: profileData.phone || metadata.phone || '',
    company: metadata.company || '',
    website: profileData.website || metadata.website || '',
    bio: metadata.bio || '',
    location: metadata.location || '',
    avatar_url: profileData.avatar_url || '',
    timezone: profileData.timezone || 'Europe/Paris',
    role: profileData.role || '',
  };

  const initialNotificationPreferences = metadata.notificationPreferences || undefined;

  return (
    <ErrorBoundary level="page" componentName="SettingsPage">
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsPageClient
          initialProfile={initialProfile}
          initialNotificationPreferences={initialNotificationPreferences}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
