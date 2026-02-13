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

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Charger le profil
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await api.get<Profile | { data?: { profile?: Profile }; profile?: Profile }>('/api/v1/auth/me');
      const profileData = (data as { data?: { profile?: Profile }; profile?: Profile })?.data?.profile
        ?? (data as { profile?: Profile })?.profile
        ?? (data as Profile);
      setProfile(profileData as Profile);
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

      const data = await api.put<{ data?: { profile?: Profile }; profile?: Profile }>('/api/v1/profile', updates);
      const profileData = data?.data?.profile ?? data?.profile;
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

      const data = await api.post<{ data?: { avatar_url?: string }; avatar_url?: string }>('/api/v1/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const avatarUrl = data?.data?.avatar_url ?? data?.avatar_url;
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

