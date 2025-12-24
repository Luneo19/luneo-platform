/**
 * ★★★ TRPC ROUTER - PROFILE & SETTINGS ★★★
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';

// db importé depuis @/lib/db

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  timezone: z.string().optional(),
  company: z.string().optional(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const profileRouter = router({
  /**
   * Récupère le profil de l'utilisateur
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;

    try {
      const userData = await db.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          name: true,
          imageUrl: true,
          phone: true,
          website: true,
          timezone: true,
          role: true,
          metadata: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });

      if (!userData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Utilisateur introuvable',
        });
      }

      const metadata = (userData.metadata || {}) as any;

      return {
        id: userData.id,
        email: userData.email,
        name: userData.name || '',
        avatar_url: userData.imageUrl || '',
        phone: userData.phone || '',
        website: userData.website || '',
        timezone: userData.timezone || 'Europe/Paris',
        role: userData.role,
        company: metadata.company || '',
        createdAt: userData.createdAt.toISOString(),
        lastLoginAt: userData.lastLoginAt?.toISOString() || null,
      };
    } catch (error: any) {
      if (error instanceof TRPCError) throw error;
      logger.error('Error getting profile', { error, userId: user.id });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur lors de la récupération du profil',
      });
    }
  }),

  /**
   * Met à jour le profil de l'utilisateur
   */
  update: protectedProcedure
    .input(UpdateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      try {
        const currentUser = await db.user.findUnique({
          where: { id: user.id },
          select: { metadata: true },
        });

        const metadata = (currentUser?.metadata || {}) as any;

        const updateData: any = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.email !== undefined) updateData.email = input.email;
        if (input.phone !== undefined) updateData.phone = input.phone;
        if (input.website !== undefined) updateData.website = input.website;
        if (input.timezone !== undefined) updateData.timezone = input.timezone;
        if (input.company !== undefined) {
          updateData.metadata = {
            ...metadata,
            company: input.company,
          };
        }

        const updated = await db.user.update({
          where: { id: user.id },
          data: updateData,
          select: {
            id: true,
            email: true,
            name: true,
            imageUrl: true,
            phone: true,
            website: true,
            timezone: true,
            role: true,
            metadata: true,
          },
        });

        logger.info('Profile updated', { userId: user.id, fields: Object.keys(input) });

        const updatedMetadata = (updated.metadata || {}) as any;
        return {
          id: updated.id,
          email: updated.email,
          name: updated.name || '',
          avatar_url: updated.imageUrl || '',
          phone: updated.phone || '',
          website: updated.website || '',
          timezone: updated.timezone || 'Europe/Paris',
          role: updated.role,
          company: updatedMetadata.company || '',
        };
      } catch (error: any) {
        logger.error('Error updating profile', { error, input, userId: user.id });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la mise à jour du profil',
        });
      }
    }),

  /**
   * Change le mot de passe
   */
  changePassword: protectedProcedure
    .input(ChangePasswordSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      try {
        // Récupérer l'utilisateur avec le mot de passe hashé
        const userData = await db.user.findUnique({
          where: { id: user.id },
          select: { passwordHash: true },
        });

        if (!userData?.passwordHash) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Aucun mot de passe enregistré. Utilisez la réinitialisation de mot de passe.',
          });
        }

        // Vérifier le mot de passe actuel
        const isValid = await bcrypt.compare(input.currentPassword, userData.passwordHash);
        if (!isValid) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Mot de passe actuel incorrect',
          });
        }

        // Hasher le nouveau mot de passe
        const newPasswordHash = await bcrypt.hash(input.newPassword, 10);

        // Mettre à jour
        await db.user.update({
          where: { id: user.id },
          data: { passwordHash: newPasswordHash },
        });

        logger.info('Password changed', { userId: user.id });
        return { success: true };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        logger.error('Error changing password', { error, userId: user.id });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors du changement de mot de passe',
        });
      }
    }),

  /**
   * Upload un avatar
   */
  uploadAvatar: protectedProcedure
    .input(z.object({ imageUrl: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      try {
        const updated = await db.user.update({
          where: { id: user.id },
          data: { imageUrl: input.imageUrl },
          select: { imageUrl: true },
        });

        logger.info('Avatar uploaded', { userId: user.id });
        return { avatar_url: updated.imageUrl || '' };
      } catch (error: any) {
        logger.error('Error uploading avatar', { error, input, userId: user.id });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de l\'upload de l\'avatar',
        });
      }
    }),
});

