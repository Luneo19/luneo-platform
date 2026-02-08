import { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { endpoints } from '@/lib/api/client';

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

      const data = await endpoints.team.members();
      const raw = data as { data?: { members?: TeamMember[] }; members?: TeamMember[] };
      setMembers(raw?.data?.members ?? raw?.members ?? []);
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

      await endpoints.team.invite(email, role);
      await loadMembers();
      return { success: true, message: 'Invitation envoyée' };
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

      await endpoints.team.remove(memberId);
      await loadMembers();
      return { success: true, message: 'Membre supprimé' };
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

      await endpoints.team.update(memberId, { role });
      await loadMembers();
      return { success: true, message: 'Rôle mis à jour' };
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

