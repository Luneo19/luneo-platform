import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

interface Profile {
  id: string;
  email: string;
  name?: string;
  company?: string;
  website?: string;
  bio?: string;
  avatar_url?: string;
  phone?: string;
  notification_preferences?: any;
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
  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/profile');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement du profil');
      }

      setProfile(data.data.profile);
    } catch (err: any) {
      logger.error('Erreur chargement profil', {
        error: err,
        message: err.message,
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour le profil
  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      setProfile(data.data.profile);
      return { success: true };
    } catch (err: any) {
      logger.error('Erreur mise à jour profil', {
        error: err,
        updates,
        message: err.message,
      });
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Upload avatar
  const uploadAvatar = async (file: File) => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'upload');
      }

      setProfile(prev => prev ? { ...prev, avatar_url: data.data.avatar_url } : null);
      return { success: true, avatar_url: data.data.avatar_url };
    } catch (err: any) {
      logger.error('Erreur upload avatar', {
        error: err,
        fileName: file.name,
        fileSize: file.size,
        message: err.message,
      });
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Changer le mot de passe
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du changement de mot de passe');
      }

      return { success: true, message: data.message };
    } catch (err: any) {
      logger.error('Erreur changement mot de passe', {
        error: err,
        message: err.message,
      });
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Charger au montage
  useEffect(() => {
    loadProfile();
  }, []);

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    changePassword,
    refresh: loadProfile,
  };
}

