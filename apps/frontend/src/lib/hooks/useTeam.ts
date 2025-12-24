import { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/lib/logger';

interface TeamMember {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: 'admin' | 'designer' | 'manager' | 'viewer';
  status: 'pending' | 'active' | 'suspended';
  invited_at: string;
  accepted_at?: string;
  permissions?: string[];
}

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les membres
  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/team');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement des membres');
      }

      setMembers(data.data.members);
    } catch (err: any) {
      logger.error('Erreur chargement team', {
        error: err,
        message: err.message,
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Inviter un membre
  const inviteMember = useCallback(async (email: string, role: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'invitation');
      }

      // Recharger la liste
      await loadMembers();

      return { success: true, message: data.message };
    } catch (err: any) {
      logger.error('Erreur invitation', {
        error: err,
        email,
        role,
        message: err.message,
      });
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadMembers]);

  // Supprimer un membre
  const removeMember = useCallback(async (memberId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/team/${memberId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      // Recharger la liste
      await loadMembers();

      return { success: true, message: data.message };
    } catch (err: any) {
      logger.error('Erreur suppression membre', {
        error: err,
        memberId,
        message: err.message,
      });
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadMembers]);

  // Changer le rôle d'un membre
  const updateMemberRole = useCallback(async (memberId: string, role: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/team/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      // Recharger la liste
      await loadMembers();

      return { success: true, message: data.message };
    } catch (err: any) {
      logger.error('Erreur mise à jour rôle', {
        error: err,
        memberId,
        role,
        message: err.message,
      });
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadMembers]);

  // Charger au montage
  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const refresh = useCallback(() => {
    loadMembers();
  }, [loadMembers]);

  const memoizedMembers = useMemo(() => members, [members]);

  return {
    members: memoizedMembers,
    loading,
    error,
    inviteMember,
    removeMember,
    updateMemberRole,
    refresh,
  };
}

