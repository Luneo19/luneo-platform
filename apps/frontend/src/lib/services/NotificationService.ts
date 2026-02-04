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
import { sendEmail } from '@/lib/send-email';
import { db as prismaDb } from '@/lib/db';

// ========================================
// TYPES
// ========================================

export interface Notification {
  id: string;
  userId: string;
  type:
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    | 'order'
    | 'customization'
    | 'system';
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
      const user = await prismaDb.user.findUnique({
        where: { id: request.userId },
        select: { email: true },
      });

      // Save to database using Prisma
      const dbNotification = await prismaDb.notification.create({
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
        ...(dbNotification.data
          ? { data: dbNotification.data as Record<string, any> }
          : {}),
        read: dbNotification.read,
        ...(dbNotification.readAt ? { readAt: dbNotification.readAt } : {}),
        createdAt: dbNotification.createdAt,
        ...(dbNotification.actionUrl
          ? { actionUrl: dbNotification.actionUrl }
          : {}),
        ...(dbNotification.actionLabel
          ? { actionLabel: dbNotification.actionLabel }
          : {}),
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

      const notificationId = notification.id;
      logger.info('Notification created', {
        notificationId,
        userId: request.userId,
      });

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
      type?: Notification['type'];
      limit?: number;
      offset?: number;
    },
    useCache: boolean = true
  ): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
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
      const optionsWithType = options as typeof options & {
        type?: Notification['type'];
      };
      if (optionsWithType?.type) {
        where.type = optionsWithType.type;
      }

      const [dbNotifications, total, unreadCount] = await Promise.all([
        prismaDb.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: options?.limit || 20,
          skip: options?.offset || 0,
        }),
        prismaDb.notification.count({ where }),
        prismaDb.notification.count({
          where: {
            userId,
            read: false,
          },
        }),
      ]);

      const notifications: Notification[] = dbNotifications.map(
        (n: {
          id: string;
          userId: string;
          type: string;
          title: string;
          message: string;
          data: unknown;
          read: boolean;
          readAt: Date | null;
          createdAt: Date;
          actionUrl?: string | null;
          actionLabel?: string | null;
        }) => ({
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
        })
      );

      const result = {
        notifications,
        total,
        unreadCount,
      };

      // Cache for 1 minute (optional performance optimization)
      if (useCache) {
        cacheService.set(cacheKey, result, { ttl: 60 * 1000 });
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
  async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<Notification> {
    try {
      logger.info('Marking notification as read', { notificationId, userId });

      // Update in database using Prisma
      const dbNotification = await prismaDb.notification.update({
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
        ...(dbNotification.data !== null
          ? { data: dbNotification.data as Record<string, any> }
          : {}),
        read: dbNotification.read,
        ...(dbNotification.readAt !== null
          ? { readAt: dbNotification.readAt }
          : {}),
        createdAt: dbNotification.createdAt,
        ...(dbNotification.actionUrl
          ? { actionUrl: dbNotification.actionUrl }
          : {}),
        ...(dbNotification.actionLabel
          ? { actionLabel: dbNotification.actionLabel }
          : {}),
      };

      logger.info('Notification marked as read', { notificationId, userId });

      return notification;
    } catch (error: any) {
      logger.error('Error marking notification as read', {
        error,
        notificationId,
      });
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
      await prismaDb.notification.updateMany({
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
      logger.error('Error marking all notifications as read', {
        error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Supprime une notification
   */
  async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<void> {
    try {
      logger.info('Deleting notification', { notificationId, userId });

      // Delete from database using Prisma
      await prismaDb.notification.delete({
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
        const user = await prismaDb.user.findUnique({
          where: { id: request.userId },
          select: { email: true },
        });

        if (!user?.email) {
          logger.warn('Cannot send email notification: user has no email', {
            userId: request.userId,
          });
          return;
        }

        request.userEmail = user.email;
      }

      // Check user preferences
      const preferences = await this.getPreferences(request.userId);
      const notificationType = request.type;

      // Check if email is enabled for this notification type
      if (notificationType === 'order' && !preferences.email.orders) return;
      if (
        notificationType === 'customization' &&
        !preferences.email.customizations
      )
        return;
      if (notificationType === 'system' && !preferences.email.system) return;

      // Generate email HTML
      const emailHtml = this.generateEmailTemplate(request);

      const userEmail = request.userEmail;
      if (!userEmail) {
        logger.warn('Cannot send email notification: user email missing', {
          userId: request.userId,
        });
        return;
      }

      // Send email via Resend
      await sendEmail({
        to: userEmail,
        subject: request.title,
        html: emailHtml,
      });

      logger.info('Email notification sent', {
        userId: request.userId,
        email: userEmail,
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
  async sendPushNotification(
    request: CreateNotificationRequest
  ): Promise<void> {
    try {
      // Check user preferences
      const preferences = await this.getPreferences(request.userId);
      const notificationType = request.type;

      // Check if push is enabled for this notification type
      if (notificationType === 'order' && !preferences.push.orders) return;
      if (
        notificationType === 'customization' &&
        !preferences.push.customizations
      )
        return;
      if (notificationType === 'system' && !preferences.push.system) return;

      // Get user's push subscription from database
      // Note: Push subscriptions are stored in user.metadata.pushSubscriptions
      // In production, consider creating a dedicated PushSubscription model in Prisma
      // for better querying and management
      const pushSubscriptions = await this.getUserPushSubscriptions(
        request.userId
      );

      if (pushSubscriptions.length === 0) {
        logger.info('No push subscriptions found for user', {
          userId: request.userId,
        });
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
  private async getUserPushSubscriptions(
    userId: string
  ): Promise<Array<{ id: string; endpoint: string; keys: any }>> {
    try {
      // Check cache first
      const cached = cacheService.get<
        Array<{ id: string; endpoint: string; keys: any }>
      >(`push:subscriptions:${userId}`);
      if (cached) {
        return cached;
      }

      // Query from database (when PushSubscription model is created in Prisma)
      // For now, use a workaround with User.metadata or a separate table
      const user = await prismaDb.user.findUnique({
        where: { id: userId },
        select: { metadata: true },
      });

      if (user?.metadata) {
        const metadata = user.metadata as any;
        const subscriptions = metadata.pushSubscriptions || [];

        // Cache for 5 minutes
        cacheService.set(`push:subscriptions:${userId}`, subscriptions, {
          ttl: 5 * 60 * 1000,
        });

        return subscriptions;
      }

      return [];
    } catch (error: any) {
      logger.error('Error getting push subscriptions', { error, userId });
      return [];
    }
  }

  /**
   * Envoie une notification push à un abonnement spécifique via backend API
   */
  private async sendPushToSubscription(
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: { title: string; body: string; data?: any; icon?: string; badge?: string; url?: string }
  ): Promise<void> {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${API_BASE}/notifications/push/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subscription,
          payload: {
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/icons/notification-icon.png',
            badge: payload.badge || '/icons/badge-icon.png',
            data: {
              ...payload.data,
              url: payload.url || '/',
            },
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to send push notification');
      }

      logger.info('Push notification sent successfully', {
        endpoint: subscription.endpoint.substring(0, 50) + '...',
        title: payload.title,
      });
    } catch (error) {
      logger.error('Failed to send push notification', {
        error,
        endpoint: subscription.endpoint.substring(0, 50) + '...',
      });
      // Don't throw - push failures shouldn't break the notification flow
    }
  }

  /**
   * S'abonner aux notifications push (côté client)
   */
  async subscribeToPush(userId: string): Promise<PushSubscription | null> {
    try {
      // Check if push is supported
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        logger.warn('Push notifications not supported in this browser');
        return null;
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        logger.info('Push notification permission denied');
        return null;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from backend
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
      const vapidResponse = await fetch(`${API_BASE}/notifications/push/vapid-key`, {
        credentials: 'include',
      });
      
      if (!vapidResponse.ok) {
        throw new Error('Failed to get VAPID public key');
      }
      
      const { publicKey } = await vapidResponse.json();

      // Convert VAPID key to Uint8Array
      const applicationServerKey = this.urlBase64ToUint8Array(publicKey);

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Save subscription to backend
      await this.savePushSubscription(userId, subscription);

      logger.info('Successfully subscribed to push notifications');
      return subscription;
    } catch (error) {
      logger.error('Failed to subscribe to push notifications', { error });
      return null;
    }
  }

  /**
   * Se désabonner des notifications push
   */
  async unsubscribeFromPush(userId: string): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator)) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await this.removePushSubscription(userId, subscription.endpoint);
        logger.info('Successfully unsubscribed from push notifications');
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to unsubscribe from push notifications', { error });
      return false;
    }
  }

  /**
   * Sauvegarde l'abonnement push sur le backend
   */
  private async savePushSubscription(userId: string, subscription: PushSubscription): Promise<void> {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
    const response = await fetch(`${API_BASE}/notifications/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        userId,
        subscription: subscription.toJSON(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save push subscription');
    }
  }

  /**
   * Supprime l'abonnement push du backend
   */
  private async removePushSubscription(userId: string, endpoint: string): Promise<void> {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
    await fetch(`${API_BASE}/notifications/push/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        userId,
        endpoint,
      }),
    });
  }

  /**
   * Convertit une clé VAPID base64 en Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
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
      const user = await prismaDb.user.findUnique({
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
      logger.error('Error fetching notification preferences', {
        error,
        userId,
      });
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
      await prismaDb.user.update({
        where: { id: userId },
        data: {
          notificationPreferences: updated as any,
        },
      });

      logger.info('Notification preferences updated', { userId });

      return updated;
    } catch (error: any) {
      logger.error('Error updating notification preferences', {
        error,
        userId,
      });
      throw error;
    }
  }
}

// ========================================
// EXPORT
// ========================================

export const notificationService = NotificationService.getInstance();
