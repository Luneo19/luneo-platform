/**
 * ★★★ TRPC ROUTER - GESTION ÉQUIPE ★★★
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../server';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { TRPCError } from '@trpc/server';

const RoleSchema = z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']);

export const teamRouter = router({
  listMembers: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.brandId) {
      return { members: [], pendingInvites: [] };
    }

    const [membersRes, invitesRes] = await Promise.all([
      endpoints.team.members().catch((err: unknown) => {
        logger.error('Failed to fetch team members', { error: err });
        return [];
      }),
      endpoints.team.invites().catch((err: unknown) => {
        logger.error('Failed to fetch team invites', { error: err });
        return [];
      }),
    ]);

    const membersRaw = membersRes as { members?: unknown[]; data?: unknown[] } | unknown[];
    const members = Array.isArray(membersRes) ? membersRes : (membersRaw && typeof membersRaw === 'object' && !Array.isArray(membersRaw) ? ((membersRaw as { members?: unknown[]; data?: unknown[] }).members ?? (membersRaw as { data?: unknown[] }).data ?? []) : []);
    const invitesRaw = invitesRes as { invites?: unknown[]; data?: unknown[] } | unknown[];
    const pendingInvites = Array.isArray(invitesRes) ? invitesRes : (invitesRaw && typeof invitesRaw === 'object' && !Array.isArray(invitesRaw) ? ((invitesRaw as { invites?: unknown[]; data?: unknown[] }).invites ?? (invitesRaw as { data?: unknown[] }).data ?? []) : []);

    type MemberLike = { id: string; email: string; name?: string; role?: string; imageUrl?: string; avatar?: string; createdAt?: unknown; joinedAt?: unknown; lastLoginAt?: unknown; lastActive?: unknown };
    type InviteLike = { id: string; email: string; role?: string; createdAt?: unknown; invitedAt?: unknown; expiresAt?: unknown };
    return {
      members: (Array.isArray(members) ? members : []).map((m: MemberLike) => ({
        id: m.id,
        email: m.email,
        name: m.name,
        role: m.role,
        avatar: m.imageUrl ?? m.avatar,
        joinedAt: m.createdAt ?? m.joinedAt,
        lastActive: m.lastLoginAt ?? m.lastActive,
      })),
      pendingInvites: (Array.isArray(pendingInvites) ? pendingInvites : []).map((i: InviteLike) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        invitedAt: i.createdAt ?? i.invitedAt,
        expiresAt: i.expiresAt,
      })),
    };
  }),

  inviteMember: protectedProcedure
    .input(z.object({ email: z.string().email(), role: RoleSchema, message: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.brandId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'User must be associated with a brand' });
      }

      try {
        const invitation = await endpoints.team.invite(input.email, input.role.toLowerCase());
        const inv = invitation as { id: string; email?: string; role?: string; createdAt?: unknown; invitedAt?: unknown; expiresAt?: unknown };
        logger.info('Team member invited', { invitationId: inv.id, email: input.email });
        return {
          id: inv.id,
          email: inv.email ?? input.email,
          role: inv.role ?? input.role,
          invitedAt: inv.createdAt ?? inv.invitedAt ?? new Date(),
          expiresAt: inv.expiresAt,
        };
      } catch (error: unknown) {
        const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
        const status = err?.response?.status;
        const message = err?.response?.data?.message ?? err?.message;
        if (status === 409 || message?.includes('déjà')) {
          throw new TRPCError({ code: 'CONFLICT', message: message || 'Cet utilisateur est déjà membre ou invitation en attente' });
        }
        throw error;
      }
    }),

  updateMemberRole: protectedProcedure
    .input(z.object({ memberId: z.string().cuid(), role: RoleSchema }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.brandId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'User must be associated with a brand' });
      }

      const member = await endpoints.team.get(input.memberId).catch(() => null);
      if (!member) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Membre introuvable' });
      }
      const m = member as { role?: string; id?: string };
      if (m.role === 'OWNER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Impossible de modifier le rôle du propriétaire' });
      }

      const updated = await endpoints.team.update(input.memberId, { role: input.role.toLowerCase() });
      logger.info('Team member role updated', { memberId: input.memberId, newRole: input.role });
      const u = updated as { id: string; email: string; role?: string };
      return { id: u.id, email: u.email, role: u.role ?? input.role };
    }),

  removeMember: protectedProcedure
    .input(z.object({ memberId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.brandId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'User must be associated with a brand' });
      }

      const member = await endpoints.team.get(input.memberId).catch(() => null);
      if (!member) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Membre introuvable' });
      }
      const m = member as { role?: string; id?: string };
      if (m.role === 'OWNER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Impossible de supprimer le propriétaire' });
      }
      if (m.id === ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Vous ne pouvez pas vous supprimer vous-même' });
      }

      await endpoints.team.remove(input.memberId);
      logger.info('Team member removed', { memberId: input.memberId });
      return { success: true };
    }),

  cancelInvite: protectedProcedure
    .input(z.object({ inviteId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.brandId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'User must be associated with a brand' });
      }

      await endpoints.team.cancelInvite(input.inviteId);
      logger.info('Invitation cancelled', { inviteId: input.inviteId });
      return { success: true };
    }),
});
