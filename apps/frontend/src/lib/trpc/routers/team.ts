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
      throw new TRPCError({ code: 'FORBIDDEN', message: 'User must be associated with a brand' });
    }

    const [membersRes, invitesRes] = await Promise.all([
      endpoints.team.members(),
      endpoints.team.invites(),
    ]);

    const members = (membersRes as any)?.members ?? (membersRes as any)?.data ?? Array.isArray(membersRes) ? membersRes : [];
    const pendingInvites = (invitesRes as any)?.invites ?? (invitesRes as any)?.data ?? Array.isArray(invitesRes) ? invitesRes : [];

    return {
      members: (Array.isArray(members) ? members : []).map((m: any) => ({
        id: m.id,
        email: m.email,
        name: m.name,
        role: m.role,
        avatar: m.imageUrl ?? m.avatar,
        joinedAt: m.createdAt ?? m.joinedAt,
        lastActive: m.lastLoginAt ?? m.lastActive,
      })),
      pendingInvites: (Array.isArray(pendingInvites) ? pendingInvites : []).map((i: any) => ({
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
        const invitation = await endpoints.team.invite(input.email, input.role);
        const inv = invitation as any;
        logger.info('Team member invited', { invitationId: inv.id, email: input.email });
        return {
          id: inv.id,
          email: inv.email ?? input.email,
          role: inv.role ?? input.role,
          invitedAt: inv.createdAt ?? inv.invitedAt ?? new Date(),
          expiresAt: inv.expiresAt,
        };
      } catch (error: any) {
        const status = error?.response?.status;
        const message = error?.response?.data?.message ?? error?.message;
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
      const m = member as any;
      if (m.role === 'OWNER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Impossible de modifier le rôle du propriétaire' });
      }

      const updated = await endpoints.team.update(input.memberId, { role: input.role });
      logger.info('Team member role updated', { memberId: input.memberId, newRole: input.role });
      const u = updated as any;
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
      const m = member as any;
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
