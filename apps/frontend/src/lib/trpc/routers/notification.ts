/**
 * ★★★ TRPC ROUTER - NOTIFICATIONS ★★★
 * Router tRPC complet pour les notifications
 * - CRUD notifications
 * - Préférences
 * - Email & Push
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../server';
import { logger } from '@/lib/logger';
import { notificationService } from '@/lib/services/NotificationService';

// ========================================
// SCHEMAS
// ========================================

const NotificationTypeSchema = z.enum([
  'info',
  'success',
  'warning',
  'error',
  'order',
  'customization',
  'system',
]);

const CreateNotificationSchema = z.object({
  userId: z.string().cuid(),
  type: NotificationTypeSchema,
  title: z.string().min(1),
  message: z.string().min(1),
  data: z.record(z.any()).optional(),
  actionUrl: z.string().url().optional(),
  actionLabel: z.string().optional(),
  sendEmail: z.boolean().optional(),
  sendPush: z.boolean().optional(),
});

const NotificationPreferencesSchema = z.object({
  email: z
    .object({
      orders: z.boolean(),
      customizations: z.boolean(),
      system: z.boolean(),
      marketing: z.boolean(),
    })
    .optional(),
  push: z
    .object({
      orders: z.boolean(),
      customizations: z.boolean(),
      system: z.boolean(),
    })
    .optional(),
  inApp: z
    .object({
      orders: z.boolean(),
      customizations: z.boolean(),
      system: z.boolean(),
    })
    .optional(),
});

// ========================================
// ROUTER
// ========================================

export const notificationRouter = router({
  // ========================================
  // CREATE
  // ========================================

  create: protectedProcedure
    .input(CreateNotificationSchema)
    .mutation(async ({ ctx, input }) => {
      const notification = await notificationService.createNotification(input);

      logger.info('Notification created', {
        notificationId: notification.id,
        userId: input.userId,
      });

      return notification;
    }),

  // ========================================
  // READ
  // ========================================

  list: protectedProcedure
    .input(
      z.object({
        unreadOnly: z.boolean().optional(),
        limit: z.number().int().positive().max(100).default(20),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user) {
        throw new Error('User not authenticated');
      }

      try {
        return await notificationService.listNotifications(user.id, input);
      } catch (error) {
        logger.warn('Failed to fetch notifications, returning empty list', { error });
        return { notifications: [], total: 0 };
      }
    }),

  // ========================================
  // UPDATE
  // ========================================

  markAsRead: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user) {
        throw new Error('User not authenticated');
      }

      const notification = await notificationService.markAsRead(input.id, user.id);

      logger.info('Notification marked as read', {
        notificationId: input.id,
        userId: user.id,
      });

      return notification;
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const { user } = ctx;

    if (!user) {
      throw new Error('User not authenticated');
    }

    await notificationService.markAllAsRead(user.id);

    logger.info('All notifications marked as read', { userId: user.id });
  }),

  // ========================================
  // DELETE
  // ========================================

  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user) {
        throw new Error('User not authenticated');
      }

      await notificationService.deleteNotification(input.id, user.id);

      logger.info('Notification deleted', {
        notificationId: input.id,
        userId: user.id,
      });
    }),

  // ========================================
  // PREFERENCES
  // ========================================

  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;

    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      return await notificationService.getPreferences(user.id);
    } catch (error) {
      logger.warn('Failed to fetch notification preferences', { error });
      return {
        email: true,
        push: true,
        inApp: true,
        types: {},
      };
    }
  }),

  updatePreferences: protectedProcedure
    .input(NotificationPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user) {
        throw new Error('User not authenticated');
      }

      const preferences = await notificationService.updatePreferences(
        user.id,
        input
      );

      logger.info('Notification preferences updated', {
        userId: user.id,
        preferences: input,
      });

      return preferences;
    }),
});

