/**
 * Hook personnalisé pour gérer les membres de l'équipe
 */

import { useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';
import type { TeamMember, PendingInvite, TeamStats } from '../types';

export function useTeamMembers() {
  const teamQuery = trpc.team.listMembers.useQuery();

  type MemberLike = { id: string; name?: string; email: string; role?: string; avatar?: string; joinedAt?: string | Date; lastActive?: string | Date; permissions?: string[]; metadata?: unknown };
  const members: TeamMember[] = useMemo(() => {
    return (teamQuery.data?.members || []).map((m: MemberLike) => ({
      id: m.id,
      name: m.name || m.email,
      email: m.email,
      role: m.role || 'MEMBER',
      status: 'active' as const,
      avatar: m.avatar,
      joinedAt: m.joinedAt ? new Date(m.joinedAt) : new Date(),
      lastActive: m.lastActive ? new Date(m.lastActive) : undefined,
      permissions: m.permissions || [],
      metadata: m.metadata,
    }));
  }, [teamQuery.data]);

  type InviteLike = { id: string; email: string; role?: string; invitedBy?: string; invitedAt?: string | Date; expiresAt?: string | Date; status?: string };
  const pendingInvites: PendingInvite[] = useMemo(() => {
    return (teamQuery.data?.pendingInvites || []).map((i: InviteLike) => ({
      id: i.id,
      email: i.email,
      role: (i.role || 'MEMBER') as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER',
      invitedBy: i.invitedBy,
      invitedAt: i.invitedAt ? new Date(i.invitedAt as string) : new Date(),
      expiresAt: i.expiresAt ? new Date(i.expiresAt as string) : new Date(),
      status: (i.status || 'pending') as 'pending' | 'accepted' | 'expired',
    }));
  }, [teamQuery.data]);

  const stats: TeamStats = useMemo(() => {
    return {
      total: members.length,
      active: members.filter((m) => m.status === 'active').length,
      pending: members.filter((m) => m.status === 'pending').length,
      suspended: members.filter((m) => m.status === 'suspended').length,
      invites: pendingInvites.filter((i) => i.status === 'pending').length,
      byRole: {
        OWNER: members.filter((m) => m.role === 'OWNER').length,
        ADMIN: members.filter((m) => m.role === 'ADMIN').length,
        MEMBER: members.filter((m) => m.role === 'MEMBER').length,
        VIEWER: members.filter((m) => m.role === 'VIEWER').length,
      },
    };
  }, [members, pendingInvites]);

  return {
    members,
    pendingInvites,
    stats,
    isLoading: teamQuery.isLoading,
    error: teamQuery.error,
    refetch: teamQuery.refetch,
  };
}

