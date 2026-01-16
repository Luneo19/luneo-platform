/**
 * ★★★ TRPC ROUTER - GESTION ÉQUIPE ★★★
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../server';
import { logger } from '@/lib/logger';
import { db as prismaDb } from '@/lib/db';
import { TRPCError } from '@trpc/server';

const RoleSchema = z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']);

export const teamRouter = router({
  listMembers: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;
    if (!user?.brandId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'User must be associated with a brand' });
    }

    const members = await prismaDb.user.findMany({
      where: { brandId: user.brandId },
      select: { id: true, email: true, name: true, role: true, imageUrl: true, createdAt: true, lastLoginAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const pendingInvites = await prismaDb.invitation.findMany({
      where: { brandId: user.brandId, status: 'PENDING' },
      select: { id: true, email: true, role: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      members: members.map((m: any) => ({
        id: m.id,
        email: m.email,
        name: m.name,
        role: m.role,
        avatar: m.imageUrl,
        joinedAt: m.createdAt,
        lastActive: m.lastLoginAt,
      })),
      pendingInvites: pendingInvites.map((i: any) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        invitedAt: i.createdAt,
        expiresAt: i.expiresAt,
      })),
    };
  }),

  inviteMember: protectedProcedure
    .input(z.object({ email: z.string().email(), role: RoleSchema, message: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      if (!user?.brandId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'User must be associated with a brand' });
      }

      const existingUser = await prismaDb.user.findUnique({ where: { email: input.email } });
      if (existingUser && existingUser.brandId === user.brandId) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Cet utilisateur est déjà membre' });
      }

      const existingInvite = await prismaDb.invitation.findFirst({
        where: { email: input.email, brandId: user.brandId, status: 'PENDING' },
      });
      if (existingInvite) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Invitation déjà en attente' });
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const invitation = await prismaDb.invitation.create({
        data: {
          email: input.email,
          brandId: user.brandId,
          role: input.role,
          invitedBy: user.id,
          expiresAt,
          message: input.message,
          status: 'PENDING',
        },
      });

      logger.info('Team member invited', { invitationId: invitation.id, email: input.email });
      return { id: invitation.id, email: invitation.email, role: invitation.role, invitedAt: invitation.createdAt, expiresAt: invitation.expiresAt };
    }),

  updateMemberRole: protectedProcedure
    .input(z.object({ memberId: z.string().cuid(), role: RoleSchema }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      if (!user?.brandId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'User must be associated with a brand' });
      }

      const member = await prismaDb.user.findUnique({ where: { id: input.memberId } });
      if (!member || member.brandId !== user.brandId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Membre introuvable' });
      }
      if (member.role === 'OWNER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Impossible de modifier le rôle du propriétaire' });
      }

      const updated = await prismaDb.user.update({ where: { id: input.memberId }, data: { role: input.role } });
      logger.info('Team member role updated', { memberId: input.memberId, newRole: input.role });
      return { id: updated.id, email: updated.email, role: updated.role };
    }),

  removeMember: protectedProcedure
    .input(z.object({ memberId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      if (!user?.brandId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'User must be associated with a brand' });
      }

      const member = await prismaDb.user.findUnique({ where: { id: input.memberId } });
      if (!member || member.brandId !== user.brandId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Membre introuvable' });
      }
      if (member.role === 'OWNER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Impossible de supprimer le propriétaire' });
      }
      if (member.id === user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Vous ne pouvez pas vous supprimer vous-même' });
      }

      await prismaDb.user.update({ where: { id: input.memberId }, data: { brandId: null } });
      logger.info('Team member removed', { memberId: input.memberId });
      return { success: true };
    }),

  cancelInvite: protectedProcedure
    .input(z.object({ inviteId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      if (!user?.brandId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'User must be associated with a brand' });
      }

      const invitation = await prismaDb.invitation.findUnique({ where: { id: input.inviteId } });
      if (!invitation || invitation.brandId !== user.brandId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invitation introuvable' });
      }

      await prismaDb.invitation.update({ where: { id: input.inviteId }, data: { status: 'CANCELLED' } });
      logger.info('Invitation cancelled', { inviteId: input.inviteId });
      return { success: true };
    }),
});
