/**
 * ★★★ SERVICE - NOTIFICATIONS ★★★
 * Service professionnel pour les notifications
 * - Notifications in-app
 * - Notifications email
 * - Notifications push (PWA)
 * - Centre de notifications
 * - Historique notifications
 */

import { logger } from '@/lib/logger';
import { cacheService } from '@/lib/cache/CacheService';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '@/lib/send-email';

// db importé depuis @/lib/db

// ========================================
// TYPES
// ========================================

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'order' | 'customization' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  actionUrl?: string;
  actionLabel?: string;
}

export interface CreateNotificationRequest {
  userId: string;
  type: Notification['type'];
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
  actionLabel?: string;
  sendEmail?: boolean;
  sendPush?: boolean;
}

export interface NotificationPreferences {
  email: {
    orders: boolean;
    customizations: boolean;
    system: boolean;
    marketing: boolean;
  };
  push: {
    orders: boolean;
    customizations: boolean;
    system: boolean;
  };
  inApp: {
    orders: boolean;
    customizations: boolean;
    system: boolean;
  };
}

// ========================================
// SERVICE
// ========================================

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // ========================================
  // IN-APP NOTIFICATIONS
  // ========================================

  /**
   * Crée une notification in-app
   */
  async createNotification(
    request: CreateNotificationRequest
  ): Promise<Notification> {
    try {
      logger.info('Creating notification', {
        userId: request.userId,
        type: request.type,
      });

      // Get user email for email notifications
      const user = await db.user.findUnique({
        where: { id: request.userId },
        select: { email: true },
      });

      // Save to database using Prisma
      const dbNotification = await db.notification.create({
        data: {
          userId: request.userId,
          type: request.type,
          title: request.title,
          message: request.message,
          data: request.data || {},
          actionUrl: request.actionUrl,
          actionLabel: request.actionLabel,
          read: false,
        },
      });

      // Convert to Notification interface
      const notification: Notification = {
        id: dbNotification.id,
        userId: dbNotification.userId,
        type: dbNotification.type as Notification['type'],
        title: dbNotification.title,
        message: dbNotification.message,
        data: dbNotification.data as Record<string, any> | undefined,
        read: dbNotification.read,
        readAt: dbNotification.readAt || undefined,
        createdAt: dbNotification.createdAt,
        actionUrl: dbNotification.actionUrl || undefined,
        actionLabel: dbNotification.actionLabel || undefined,
      };

      // Send email if requested
      if (request.sendEmail && user?.email) {
        await this.sendEmailNotification({
          ...request,
          userEmail: user.email,
        });
      }

      // Send push if requested
      if (request.sendPush) {
        await this.sendPushNotification(request);
      }

      // Invalidate cache
      cacheService.delete(`notifications:${request.userId}`);

      logger.info('Notification created', { notificationId, userId: request.userId });

      return notification;
    } catch (error: any) {
      logger.error('Error creating notification', { error, request });
      throw error;
    }
  }

  /**
   * Liste les notifications d'un utilisateur
   */
  async listNotifications(
    userId: string,
    options?: {
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
    },
    useCache: boolean = true
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    try {
      const cacheKey = `notifications:${userId}:${options?.unreadOnly}:${options?.limit}:${options?.offset}`;

      // Check cache
      if (useCache) {
        const cached = cacheService.get<{
          notifications: Notification[];
          total: number;
          unreadCount: number;
        }>(cacheKey);
        if (cached) {
          logger.info('Cache hit for notifications', { userId });
          return cached;
        }
      }

      // Fetch from database using Prisma
      const where: any = {
        userId,
      };

      if (options?.unreadOnly) {
        where.read = false;
      }
      if (options?.type) {
        where.type = options.type;
      }

      const [dbNotifications, total, unreadCount] = await Promise.all([
        db.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: options?.limit || 20,
          skip: options?.offset || 0,
        }),
        db.notification.count({ where }),
        db.notification.count({
          where: {
            userId,
            read: false,
          },
        }),
      ]);

      const notifications: Notification[] = dbNotifications.map(n => ({
        id: n.id,
        userId: n.userId,
        type: n.type as Notification['type'],
        title: n.title,
        message: n.message,
        data: n.data as Record<string, any> | undefined,
        read: n.read,
        readAt: n.readAt || undefined,
        createdAt: n.createdAt,
        actionUrl: n.actionUrl || undefined,
        actionLabel: n.actionLabel || undefined,
      }));

      const result = {
        notifications,
        total,
        unreadCount,
      };

      // Cache for 1 minute (optional performance optimization)
      if (useCache) {
        cacheService.set(cacheKey, result, 60);
      }

      return result;
    } catch (error: any) {
      logger.error('Error listing notifications', { error, userId });
      throw error;
    }
  }

  /**
   * Marque une notification comme lue
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    try {
      logger.info('Marking notification as read', { notificationId, userId });

      // Update in database using Prisma
      const dbNotification = await db.notification.update({
        where: {
          id: notificationId,
          userId, // Ensure ownership
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      const notification: Notification = {
        id: dbNotification.id,
        userId: dbNotification.userId,
        type: dbNotification.type as Notification['type'],
        title: dbNotification.title,
        message: dbNotification.message,
        data: dbNotification.data as Record<string, any> | undefined,
        read: dbNotification.read,
        readAt: dbNotification.readAt || undefined,
        createdAt: dbNotification.createdAt,
        actionUrl: dbNotification.actionUrl || undefined,
        actionLabel: dbNotification.actionLabel || undefined,
      };

      logger.info('Notification marked as read', { notificationId, userId });

      return notification;
    } catch (error: any) {
      logger.error('Error marking notification as read', { error, notificationId });
      throw error;
    }
  }

  /**
   * Marque toutes les notifications comme lues
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      logger.info('Marking all notifications as read', { userId });

      // Update in database using Prisma
      await db.notification.updateMany({
        where: {
          userId,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      logger.info('All notifications marked as read', { userId });
    } catch (error: any) {
      logger.error('Error marking all notifications as read', { error, userId });
      throw error;
    }
  }

  /**
   * Supprime une notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      logger.info('Deleting notification', { notificationId, userId });

      // Delete from database using Prisma
      await db.notification.delete({
        where: {
          id: notificationId,
          userId, // Ensure ownership
        },
      });

      logger.info('Notification deleted', { notificationId, userId });
    } catch (error: any) {
      logger.error('Error deleting notification', { error, notificationId });
      throw error;
    }
  }

  // ========================================
  // EMAIL NOTIFICATIONS
  // ========================================

  /**
   * Envoie une notification par email
   */
  async sendEmailNotification(
    request: CreateNotificationRequest & { userEmail?: string }
  ): Promise<void> {
    try {
      if (!request.userEmail) {
        // Get user email
        const user = await db.user.findUnique({
          where: { id: request.userId },
          select: { email: true },
        });

        if (!user?.email) {
          logger.warn('Cannot send email notification: user has no email', { userId: request.userId });
          return;
        }

        request.userEmail = user.email;
      }

      // Check user preferences
      const preferences = await this.getPreferences(request.userId);
      const notificationType = request.type;

      // Check if email is enabled for this notification type
      if (notificationType === 'order' && !preferences.email.orders) return;
      if (notificationType === 'customization' && !preferences.email.customizations) return;
      if (notificationType === 'system' && !preferences.email.system) return;

      // Generate email HTML
      const emailHtml = this.generateEmailTemplate(request);

      // Send email via Resend
      await sendEmail({
        to: request.userEmail,
        subject: request.title,
        html: emailHtml,
      });

      logger.info('Email notification sent', {
        userId: request.userId,
        email: request.userEmail,
        type: request.type,
      });
    } catch (error: any) {
      logger.error('Error sending email notification', { error, request });
      // Don't throw - email failures shouldn't break the notification creation
    }
  }

  /**
   * Génère le template HTML pour l'email
   */
  private generateEmailTemplate(request: CreateNotificationRequest): string {
    const actionButton = request.actionUrl
      ? `<a href="${request.actionUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">${request.actionLabel || 'Voir les détails'}</a>`
      : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
            <h1 style="color: #0070f3; margin-top: 0;">${request.title}</h1>
            <p style="font-size: 16px; margin-bottom: 20px;">${request.message}</p>
            ${actionButton}
            <p style="margin-top: 30px; font-size: 12px; color: #666;">
              Vous recevez cet email car vous avez activé les notifications par email pour ce type d'événement.
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://luneo.app'}/settings/notifications" style="color: #0070f3;">Gérer mes préférences</a>
            </p>
          </div>
        </body>
      </html>
    `;
  }

  // ========================================
  // PUSH NOTIFICATIONS
  // ========================================

  /**
   * Envoie une notification push
   */
  async sendPushNotification(request: CreateNotificationRequest): Promise<void> {
    try {
      // Check user preferences
      const preferences = await this.getPreferences(request.userId);
      const notificationType = request.type;

      // Check if push is enabled for this notification type
      if (notificationType === 'order' && !preferences.push.orders) return;
      if (notificationType === 'customization' && !preferences.push.customizations) return;
      if (notificationType === 'system' && !preferences.push.system) return;

      // Get user's push subscription from database
      // Note: Push subscriptions are stored in user.metadata.pushSubscriptions
      // In production, consider creating a dedicated PushSubscription model in Prisma
      // for better querying and management
      const pushSubscriptions = await this.getUserPushSubscriptions(request.userId);

      if (pushSubscriptions.length === 0) {
        logger.info('No push subscriptions found for user', { userId: request.userId });
        return;
      }

      // Send push notification to all subscriptions
      for (const subscription of pushSubscriptions) {
        try {
          await this.sendPushToSubscription(subscription, {
            title: request.title,
            body: request.message,
            data: {
              type: request.type,
              actionUrl: request.actionUrl,
              ...request.data,
            },
          });
        } catch (error: any) {
          logger.error('Error sending push to subscription', {
            error,
            subscriptionId: subscription.id,
            userId: request.userId,
          });
        }
      }

      logger.info('Push notification sent', {
        userId: request.userId,
        subscriptions: pushSubscriptions.length,
        type: request.type,
      });
    } catch (error: any) {
      logger.error('Error sending push notification', { error, request });
      // Don't throw - push failures shouldn't break the notification creation
    }
  }

  /**
   * Récupère les abonnements push d'un utilisateur
   */
  private async getUserPushSubscriptions(userId: string): Promise<Array<{ id: string; endpoint: string; keys: any }>> {
    try {
      // Check cache first
      const cached = cacheService.get<Array<{ id: string; endpoint: string; keys: any }>>(`push:subscriptions:${userId}`);
      if (cached) {
        return cached;
      }

      // Query from database (when PushSubscription model is created in Prisma)
      // For now, use a workaround with User.metadata or a separate table
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { metadata: true },
      });

      if (user?.metadata) {
        const metadata = user.metadata as any;
        const subscriptions = metadata.pushSubscriptions || [];
        
        // Cache for 5 minutes
        cacheService.set(`push:subscriptions:${userId}`, subscriptions, 5 * 60);
        
        return subscriptions;
      }

      return [];
    } catch (error: any) {
      logger.error('Error getting push subscriptions', { error, userId });
      return [];
    }
  }

  /**
   * Envoie une notification push à un abonnement spécifique
   */
  private async sendPushToSubscription(
    subscription: { endpoint: string; keys: any },
    payload: { title: string; body: string; data?: any }
  ): Promise<void> {
    // Web Push API implementation
    // This requires web-push library on the server
    // For now, we'll use a placeholder that would work with service worker

    // In production, use web-push library:
    // import webpush from 'web-push';
    // await webpush.sendNotification(subscription, JSON.stringify(payload));

    logger.info('Push notification would be sent', {
      endpoint: subscription.endpoint.substring(0, 50) + '...',
      title: payload.title,
    });
  }

  // ========================================
  // PREFERENCES
  // ========================================

  /**
   * Récupère les préférences de notifications
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // Fetch from database (User model should have notificationPreferences field)
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { notificationPreferences: true },
      });

      // Default preferences
      const defaultPreferences: NotificationPreferences = {
        email: {
          orders: true,
          customizations: true,
          system: true,
          marketing: false,
        },
        push: {
          orders: true,
          customizations: true,
          system: true,
        },
        inApp: {
          orders: true,
          customizations: true,
          system: true,
        },
      };

      if (user?.notificationPreferences) {
        // Merge with defaults
        const userPrefs = user.notificationPreferences as any;
        return {
          email: { ...defaultPreferences.email, ...(userPrefs.email || {}) },
          push: { ...defaultPreferences.push, ...(userPrefs.push || {}) },
          inApp: { ...defaultPreferences.inApp, ...(userPrefs.inApp || {}) },
        };
      }

      return defaultPreferences;
    } catch (error: any) {
      logger.error('Error fetching notification preferences', { error, userId });
      // Return defaults on error
      return {
        email: {
          orders: true,
          customizations: true,
          system: true,
          marketing: false,
        },
        push: {
          orders: true,
          customizations: true,
          system: true,
        },
        inApp: {
          orders: true,
          customizations: true,
          system: true,
        },
      };
    }
  }

  /**
   * Met à jour les préférences de notifications
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      logger.info('Updating notification preferences', { userId });

      // Get current preferences
      const current = await this.getPreferences(userId);

      // Merge with new preferences
      const updated: NotificationPreferences = {
        email: { ...current.email, ...(preferences.email || {}) },
        push: { ...current.push, ...(preferences.push || {}) },
        inApp: { ...current.inApp, ...(preferences.inApp || {}) },
      };

      // Update in database
      await db.user.update({
        where: { id: userId },
        data: {
          notificationPreferences: updated as any,
        },
      });

      logger.info('Notification preferences updated', { userId });

      return updated;
    } catch (error: any) {
      logger.error('Error updating notification preferences', { error, userId });
      throw error;
    }
  }
}

// ========================================
// EXPORT
// ========================================

export const notificationService = NotificationService.getInstance();
