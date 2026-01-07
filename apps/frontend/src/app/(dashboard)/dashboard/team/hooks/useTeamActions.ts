/**
 * Hook personnalisé pour les actions sur l'équipe
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { trpc } from '@/lib/trpc/client';
import type { TeamRole } from '../types';

export function useTeamActions() {
  const router = useRouter();
  const { toast } = useToast();

  const inviteMutation = trpc.team.inviteMember.useMutation({
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Invitation envoyée' });
      router.refresh();
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateRoleMutation = trpc.team.updateMemberRole.useMutation({
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Rôle mis à jour' });
      router.refresh();
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const removeMemberMutation = trpc.team.removeMember.useMutation({
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Membre retiré' });
      router.refresh();
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const cancelInviteMutation = trpc.team.cancelInvite.useMutation({
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Invitation annulée' });
      router.refresh();
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const handleInvite = useCallback(
    async (email: string, role: TeamRole): Promise<{ success: boolean }> => {
      try {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          toast({ title: 'Erreur', description: 'Adresse email invalide', variant: 'destructive' });
          return { success: false };
        }

        await inviteMutation.mutateAsync({ email, role });
        return { success: true };
      } catch (error: any) {
        logger.error('Error inviting member', { error });
        return { success: false };
      }
    },
    [inviteMutation, toast]
  );

  const handleChangeRole = useCallback(
    async (memberId: string, newRole: TeamRole): Promise<{ success: boolean }> => {
      try {
        await updateRoleMutation.mutateAsync({ memberId, role: newRole });
        return { success: true };
      } catch (error: any) {
        logger.error('Error updating role', { error });
        return { success: false };
      }
    },
    [updateRoleMutation]
  );

  const handleRemoveMember = useCallback(
    async (memberId: string): Promise<{ success: boolean }> => {
      try {
        await removeMemberMutation.mutateAsync({ memberId });
        return { success: true };
      } catch (error: any) {
        logger.error('Error removing member', { error });
        return { success: false };
      }
    },
    [removeMemberMutation]
  );

  const handleCancelInvite = useCallback(
    async (inviteId: string): Promise<{ success: boolean }> => {
      try {
        await cancelInviteMutation.mutateAsync({ inviteId });
        return { success: true };
      } catch (error: any) {
        logger.error('Error cancelling invite', { error });
        return { success: false };
      }
    },
    [cancelInviteMutation]
  );

  return {
    handleInvite,
    handleChangeRole,
    handleRemoveMember,
    handleCancelInvite,
    isInviting: inviteMutation.isPending,
    isUpdatingRole: updateRoleMutation.isPending,
    isRemoving: removeMemberMutation.isPending,
    isCancelling: cancelInviteMutation.isPending,
  };
}


