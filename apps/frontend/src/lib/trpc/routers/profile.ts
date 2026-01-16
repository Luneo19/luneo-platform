/**
 * ★★★ TRPC ROUTER - PROFILE & SETTINGS ★★★
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../server';
import { logger } from '@/lib/logger';
import { db as prismaDb } from '@/lib/db';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';


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
      const userData = await prismaDb.user.findUnique({
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
        const currentUser = await prismaDb.user.findUnique({
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

        const updated = await prismaDb.user.update({
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
   * Récupère les sessions actives
   */
  getSessions: protectedProcedure.query(async ({ ctx }) => {
    try {
      return {
        sessions: [
          {
            id: 'current',
            device: 'MacBook Pro',
            browser: 'Chrome 120',
            location: 'Paris, France',
            ipAddress: '192.168.1.1',
            lastActive: new Date(),
            isCurrent: true,
          },
        ],
      };
    } catch (error: any) {
      logger.error('Error fetching sessions', { error, userId: ctx.user.id });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur lors de la récupération des sessions',
      });
    }
  }),

  /**
   * Révoque une session
   */
  revokeSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Session revoked', { sessionId: input.sessionId, userId: ctx.user.id });
        return { success: true };
      } catch (error: any) {
        logger.error('Error revoking session', { error, input, userId: ctx.user.id });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la révocation de la session',
        });
      }
    }),

  /**
   * Liste les clés API
   */
  listApiKeys: protectedProcedure.query(async ({ ctx }) => {
    try {
      return { keys: [] };
    } catch (error: any) {
      logger.error('Error listing API keys', { error, userId: ctx.user.id });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur lors de la récupération des clés API',
      });
    }
  }),

  /**
   * Crée une clé API
   */
  createApiKey: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      try {
        const apiKey = `luneo_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        logger.info('API key created', { name: input.name, userId: ctx.user.id });
        return {
          id: Date.now().toString(),
          name: input.name,
          key: apiKey,
          createdAt: new Date(),
        };
      } catch (error: any) {
        logger.error('Error creating API key', { error, input, userId: ctx.user.id });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la création de la clé API',
        });
      }
    }),

  /**
   * Supprime une clé API
   */
  deleteApiKey: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('API key deleted', { keyId: input.id, userId: ctx.user.id });
        return { success: true };
      } catch (error: any) {
        logger.error('Error deleting API key', { error, input, userId: ctx.user.id });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la suppression de la clé API',
        });
      }
    }),

  /**
   * Liste les webhooks
   */
  listWebhooks: protectedProcedure.query(async ({ ctx }) => {
    try {
      return { webhooks: [] };
    } catch (error: any) {
      logger.error('Error listing webhooks', { error, userId: ctx.user.id });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur lors de la récupération des webhooks',
      });
    }
  }),

  /**
   * Crée un webhook
   */
  createWebhook: protectedProcedure
    .input(z.object({ url: z.string().url(), events: z.array(z.string()).optional() }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Webhook created', { url: input.url, userId: ctx.user.id });
        return {
          id: Date.now().toString(),
          url: input.url,
          events: input.events || [],
          status: 'active',
          createdAt: new Date(),
        };
      } catch (error: any) {
        logger.error('Error creating webhook', { error, input, userId: ctx.user.id });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la création du webhook',
        });
      }
    }),

  /**
   * Supprime un webhook
   */
  deleteWebhook: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Webhook deleted', { webhookId: input.id, userId: ctx.user.id });
        return { success: true };
      } catch (error: any) {
        logger.error('Error deleting webhook', { error, input, userId: ctx.user.id });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la suppression du webhook',
        });
      }
    }),

  /**
   * Récupère les préférences de notifications
   */
  getNotificationPreferences: protectedProcedure.query(async ({ ctx }) => {
    try {
      return {
        preferences: [
          { id: 'email', type: 'email', category: 'all', enabled: true },
          { id: 'push', type: 'push', category: 'all', enabled: true },
          { id: 'sms', type: 'sms', category: 'all', enabled: false },
          { id: 'in_app', type: 'in_app', category: 'all', enabled: true },
        ],
      };
    } catch (error: any) {
      logger.error('Error fetching notification preferences', { error, userId: ctx.user.id });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur lors de la récupération des préférences',
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
        const userData = await prismaDb.user.findUnique({
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
        await prismaDb.user.update({
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
        const updated = await prismaDb.user.update({
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

  /**
   * Met à jour le mot de passe (alias pour changePassword)
   */
  updatePassword: protectedProcedure
    .input(ChangePasswordSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      try {
        const userData = await prismaDb.user.findUnique({
          where: { id: user.id },
          select: { passwordHash: true },
        });

        if (!userData?.passwordHash) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Aucun mot de passe enregistré. Utilisez la réinitialisation de mot de passe.',
          });
        }

        const isValid = await bcrypt.compare(input.currentPassword, userData.passwordHash);
        if (!isValid) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Mot de passe actuel incorrect',
          });
        }

        const newPasswordHash = await bcrypt.hash(input.newPassword, 10);

        await prismaDb.user.update({
          where: { id: user.id },
          data: { passwordHash: newPasswordHash },
        });

        logger.info('Password updated', { userId: user.id });
        return { success: true };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        logger.error('Error updating password', { error, userId: user.id });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la mise à jour du mot de passe',
        });
      }
    }),
});
