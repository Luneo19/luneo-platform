import { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';

interface Profile {
  id: string;
  email: string;
  name?: string;
  company?: string;
  website?: string;
  bio?: string;
  avatar_url?: string;
  phone?: string;
  notification_preferences?: Record<string, unknown>;
  language?: string;
  timezone?: string;
  subscription_tier?: string;
  subscription_status?: string;
  created_at: string;
  stats?: {
    designs_count: number;
    products_count: number;
  };
}

// PROFILE FIX: Maps camelCase backend response (avatarUrl, createdAt, etc.) to snake_case Profile interface
function normalizeBackendProfile(raw: unknown): Profile | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  const profile = (d.data as Record<string, unknown>)?.profile ?? d.profile ?? d;
  if (!profile || typeof profile !== 'object') return null;
  const p = profile as Record<string, unknown>;
  const firstName = p.firstName as string | undefined;
  const lastName = p.lastName as string | undefined;
  const name = (p.name as string) ?? (firstName && lastName ? `${firstName} ${lastName}` : (firstName ?? lastName ?? undefined));
  const statsRaw = p.stats as Record<string, unknown> | undefined;
  return {
    id: String(p.id ?? ''),
    email: String(p.email ?? ''),
    name,
    company: p.company as string | undefined,
    website: p.website as string | undefined,
    bio: p.bio as string | undefined,
    avatar_url: (p.avatarUrl ?? p.avatar) as string | undefined,
    phone: p.phone as string | undefined,
    notification_preferences: (p.notificationPreferences ?? p.notification_preferences) as Record<string, unknown> | undefined,
    language: p.language as string | undefined,
    timezone: p.timezone as string | undefined,
    subscription_tier: (p.subscriptionTier ?? p.subscription_tier) as string | undefined,
    subscription_status: (p.subscriptionStatus ?? p.subscription_status) as string | undefined,
    created_at: String(p.createdAt ?? p.created_at ?? new Date().toISOString()),
    stats: statsRaw
      ? {
          designs_count: Number(statsRaw.designsCount ?? statsRaw.designs_count ?? 0),
          products_count: Number(statsRaw.productsCount ?? statsRaw.products_count ?? 0),
        }
      : undefined,
  };
}

// PROFILE FIX: Convert snake_case Profile updates to camelCase for backend API
function toBackendProfile(updates: Partial<Profile>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (updates.name !== undefined) {
    const parts = String(updates.name).trim().split(/\s+/);
    out.firstName = parts[0] ?? '';
    out.lastName = parts.slice(1).join(' ') ?? '';
  }
  if (updates.company !== undefined) out.company = updates.company;
  if (updates.website !== undefined) out.website = updates.website;
  if (updates.bio !== undefined) out.bio = updates.bio;
  if (updates.avatar_url !== undefined) out.avatar = updates.avatar_url;
  if (updates.phone !== undefined) out.phone = updates.phone;
  if (updates.notification_preferences !== undefined) out.notificationPreferences = updates.notification_preferences;
  if (updates.language !== undefined) out.language = updates.language;
  if (updates.timezone !== undefined) out.timezone = updates.timezone;
  if (updates.subscription_tier !== undefined) out.subscriptionTier = updates.subscription_tier;
  if (updates.subscription_status !== undefined) out.subscriptionStatus = updates.subscription_status;
  return out;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Charger le profil
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // PROFILE FIX: Backend returns camelCase; normalizer maps to snake_case Profile
      const data = await api.get<unknown>('/api/v1/auth/me');
      const profileData = normalizeBackendProfile(data);
      setProfile(profileData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Erreur chargement profil', { error: err, message });
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour le profil
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    try {
      setLoading(true);
      setError(null);

      // PROFILE FIX: Convert snake_case to camelCase for backend; normalize response
      const backendUpdates = toBackendProfile(updates);
      const data = await api.put<unknown>('/api/v1/profile', backendUpdates);
      const profileData = normalizeBackendProfile(data);
      if (profileData) {
        setProfile(profileData);
      }
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Erreur mise à jour profil', { error: err, updates, message });
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload avatar
  const uploadAvatar = useCallback(async (file: File) => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('avatar', file);

      // PROFILE FIX: Backend returns avatarUrl (camelCase); support both for compatibility
      const data = await api.post<Record<string, unknown>>('/api/v1/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const dataObj = (data as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
      const avatarUrl = (dataObj?.avatarUrl ?? dataObj?.avatar_url ?? (data as Record<string, unknown>).avatarUrl ?? (data as Record<string, unknown>).avatar_url) as string | undefined;
      if (avatarUrl) {
        setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
      }
      return { success: true, avatar_url: avatarUrl };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Erreur upload avatar', { error: err, fileName: file.name, fileSize: file.size, message });
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Changer le mot de passe
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await api.put<{ message?: string }>('/api/v1/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return { success: true, message: data?.message ?? 'Mot de passe mis à jour' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Erreur changement mot de passe', { error: err, message });
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger au montage
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const refresh = useCallback(() => {
    loadProfile();
  }, [loadProfile]);

  const memoizedProfile = useMemo(() => profile, [profile]);

  return {
    profile: memoizedProfile,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    changePassword,
    refresh,
  };
}

