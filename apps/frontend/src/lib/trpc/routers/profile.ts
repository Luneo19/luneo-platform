/**
 * ★★★ TRPC ROUTER - PROFILE & SETTINGS ★★★
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../server';
import { api, endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { TRPCError } from '@trpc/server';


const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  website: z.union([z.string().url(), z.literal('')]).optional(),
  timezone: z.string().max(50).optional(),
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
      const userData = await endpoints.auth.me();

      if (!userData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Utilisateur introuvable',
        });
      }

      const u = userData as unknown as Record<string, unknown>;
      const metadata = (u.metadata ?? {}) as Record<string, unknown>;

      return {
        id: u.id,
        email: u.email,
        name: u.name || '',
        avatar_url: u.imageUrl || u.avatar_url || '',
        phone: u.phone || '',
        website: u.website || '',
        timezone: u.timezone || 'Europe/Paris',
        role: u.role,
        company: metadata.company || '',
        createdAt: (typeof u.createdAt === 'string' || typeof u.createdAt === 'number' || u.createdAt instanceof Date) ? new Date(u.createdAt as string | number | Date).toISOString() : '',
        lastLoginAt: (typeof u.lastLoginAt === 'string' || typeof u.lastLoginAt === 'number' || u.lastLoginAt instanceof Date) ? new Date(u.lastLoginAt as string | number | Date).toISOString() : null,
      };
    } catch (error: unknown) {
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
        const currentUser = (await endpoints.auth.me()) as unknown as Record<string, unknown> | null;
        const metadata = (currentUser?.metadata ?? {}) as Record<string, unknown>;

        // Backend UpdateProfileDto: firstName, lastName, avatar, phone, website, timezone
        const updateData: Record<string, unknown> = {};
        if (input.name !== undefined) {
          const parts = input.name.trim().split(/\s+/);
          updateData.firstName = parts[0] ?? '';
          updateData.lastName = parts.slice(1).join(' ') ?? '';
        }
        if (input.phone !== undefined) updateData.phone = input.phone;
        if (input.website !== undefined) updateData.website = input.website;
        if (input.timezone !== undefined) updateData.timezone = input.timezone;

        const updated = await endpoints.users.update(user.id, updateData as Record<string, unknown>) as Record<string, unknown>;

        // Company is stored on the brand; update via brand settings if provided
        if (input.company !== undefined) {
          await endpoints.brands.updateSettings({ name: input.company }).catch((err: unknown) => {
            logger.warn('Brand name update skipped or failed', { err, userId: user.id });
          });
        }

        logger.info('Profile updated', { userId: user.id, fields: Object.keys(input) });

        const updatedMetadata = (updated.metadata ?? {}) as Record<string, unknown>;
        const firstName = (updated.firstName as string) || '';
        const lastName = (updated.lastName as string) || '';
        const name = [firstName, lastName].filter(Boolean).join(' ') || '';
        const profile = updated.userProfile as { phone?: string; website?: string; timezone?: string } | undefined;
        return {
          id: updated.id,
          email: updated.email,
          name,
          avatar_url: updated.avatar ?? updated.imageUrl ?? updated.avatar_url ?? '',
          phone: profile?.phone ?? (updated.phone as string) ?? '',
          website: profile?.website ?? (updated.website as string) ?? '',
          timezone: profile?.timezone ?? (updated.timezone as string) ?? 'Europe/Paris',
          role: updated.role,
          company: (updatedMetadata.company as string) ?? (input.company ?? ''),
        };
      } catch (error: unknown) {
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
      const response = await endpoints.security.sessions();
      const sessions = Array.isArray(response) ? response : (response as Record<string, unknown>)?.sessions ?? [];
      return { sessions };
    } catch (error: unknown) {
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
        await endpoints.security.revokeSession(input.sessionId);
        logger.info('Session revoked', { sessionId: input.sessionId, userId: ctx.user.id });
        return { success: true };
      } catch (error: unknown) {
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
      const response = await api.get('/api/v1/api-keys');
      const raw = response as Record<string, unknown>;
      return { keys: Array.isArray(raw) ? raw : (raw?.keys ?? raw?.data ?? []) as unknown[] };
    } catch {
      return { keys: [] };
    }
  }),

  /**
   * Crée une clé API
   */
  createApiKey: protectedProcedure
    .input(z.object({ name: z.string().min(1), permissions: z.array(z.string()).optional() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const response = await api.post('/api/v1/api-keys', { name: input.name, permissions: input.permissions });
        const raw = response as Record<string, unknown>;
        logger.info('API key created', { name: input.name, userId: ctx.user.id });
        return {
          id: String(raw.id ?? ''),
          name: String(raw.name ?? input.name),
          key: String(raw.key ?? raw.apiKey ?? ''),
          createdAt: (raw.createdAt != null && (typeof raw.createdAt === 'string' || typeof raw.createdAt === 'number' || raw.createdAt instanceof Date))
            ? new Date(raw.createdAt as string | number | Date).toISOString()
            : new Date().toISOString(),
        };
      } catch (error: unknown) {
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
        await api.delete(`/api/v1/api-keys/${input.id}`);
        logger.info('API key deleted', { keyId: input.id, userId: ctx.user.id });
        return { success: true };
      } catch (error: unknown) {
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
      const data = await api.get<{ webhooks?: unknown[]; data?: unknown[] }>('/api/v1/public-api/webhooks');
      return { webhooks: data?.webhooks || data?.data || [] };
    } catch (error: unknown) {
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
    .input(z.object({
      url: z.string().url(),
      events: z.array(z.string()).optional(),
      name: z.string().optional(),
      secret: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const data = await api.post('/api/v1/public-api/webhooks', {
          name: input.name || 'Webhook',
          url: input.url,
          events: input.events,
          secret: input.secret,
        });
        return data;
      } catch (error: unknown) {
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
        await api.delete(`/api/v1/public-api/webhooks/${input.id}`);
        return { success: true };
      } catch (error: unknown) {
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
      const response = await endpoints.settings.getNotifications();
      const raw = response as Record<string, unknown>;
      const prefs = raw.preferences ?? raw;
      return { preferences: Array.isArray(prefs) ? prefs : [] };
    } catch (error: unknown) {
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
        await api.put('/api/v1/users/me/password', {
          current_password: input.currentPassword,
          new_password: input.newPassword,
        });

        logger.info('Password changed', { userId: user.id });
        return { success: true };
      } catch (error: unknown) {
        if (error instanceof TRPCError) throw error;
        const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
        const status = err?.response?.status;
        const message = err?.response?.data?.message || err?.message;
        if (status === 400) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: message || 'Aucun mot de passe enregistré. Utilisez la réinitialisation de mot de passe.',
          });
        }
        if (status === 401) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: message || 'Mot de passe actuel incorrect',
          });
        }
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
        const updated = await endpoints.users.update(user.id, { imageUrl: input.imageUrl }) as Record<string, unknown>;

        logger.info('Avatar uploaded', { userId: user.id });
        return { avatar_url: updated?.imageUrl || updated?.avatar_url || input.imageUrl };
      } catch (error: unknown) {
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
        await api.put('/api/v1/users/me/password', {
          current_password: input.currentPassword,
          new_password: input.newPassword,
        });

        logger.info('Password updated', { userId: user.id });
        return { success: true };
      } catch (error: unknown) {
        if (error instanceof TRPCError) throw error;
        const err = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
        const status = err?.response?.status;
        const message = err?.response?.data?.message || err?.message;
        if (status === 400) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: message || 'Aucun mot de passe enregistré.',
          });
        }
        if (status === 401) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: message || 'Mot de passe actuel incorrect',
          });
        }
        logger.error('Error updating password', { error, userId: user.id });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la mise à jour du mot de passe',
        });
      }
    }),
});
