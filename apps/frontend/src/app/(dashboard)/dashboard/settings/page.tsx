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
import { getServerUser } from '@/lib/auth/get-user';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SettingsPageClient } from './SettingsPageClient';
import { SettingsSkeleton } from './components/SettingsSkeleton';
import { cookies } from 'next/headers';

export const metadata = {
  title: 'Paramètres | Luneo',
  description: 'Gérez vos préférences et configurations',
};

const getBackendUrl = () =>
  process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://api.luneo.app' : 'http://localhost:3001');

/**
 * Server Component - Fetch les données initiales
 */
export default async function SettingsPage() {
  // Vérifier l'authentification
  const user = await getServerUser();

  if (!user) {
    return (
      <ErrorBoundary level="page" componentName="SettingsPage">
        <div className="p-6">
          <p className="text-red-400">Non authentifié</p>
        </div>
      </ErrorBoundary>
    );
  }

  // Full profile is fetched from GET /api/v1/auth/me below (cookies sent via Cookie header)
  let initialProfile = {
    id: user.id,
    name: '',
    email: user.email || '',
    phone: '',
    company: '',
    website: '',
    bio: '',
    location: '',
    avatar_url: '',
    timezone: 'Europe/Paris',
    role: user.role || '',
  };

  let initialNotificationPreferences = undefined;

  try {
    // Try to fetch full profile from backend
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value || '';
    const cookieHeader = refreshToken
      ? `accessToken=${accessToken}; refreshToken=${refreshToken}`
      : `accessToken=${accessToken}`;

    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      // Map backend user data to profile format
      initialProfile = {
        id: data.id || user.id,
        name: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : data.firstName || data.lastName || '',
        email: data.email || user.email || '',
        phone: data.phone || '',
        company: data.company || '',
        website: data.website || '',
        bio: data.bio || '',
        location: data.location || '',
        avatar_url: data.avatar || '',
        timezone: data.timezone || 'Europe/Paris',
        role: data.role || user.role || '',
      };
      initialNotificationPreferences = data.notificationPreferences || undefined;
    }
  } catch (error) {
    // If profile fetch fails, use basic user data
    // Client component will handle fetching full profile
  }

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
