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
import { api, endpoints } from '@/lib/api/client';

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

      // Create notification via backend API
      const created = await api.post<Notification>('/api/v1/notifications', {
        type: request.type,
        title: request.title,
        message: request.message,
        data: request.data || {},
        actionUrl: request.actionUrl,
        actionLabel: request.actionLabel,
      });

      const notification: Notification = {
        id: created.id,
        userId: created.userId,
        type: created.type,
        title: created.title,
        message: created.message,
        ...(created.data ? { data: created.data } : {}),
        read: created.read ?? false,
        ...(created.readAt ? { readAt: created.readAt } : {}),
        createdAt: new Date(created.createdAt),
        ...(created.actionUrl ? { actionUrl: created.actionUrl } : {}),
        ...(created.actionLabel ? { actionLabel: created.actionLabel } : {}),
      };

      // Get user email for email notifications (via API when needed)
      if (request.sendEmail) {
        try {
          const me = await endpoints.auth.me();
          if (me?.email) {
            await this.sendEmailNotification({
              ...request,
              userEmail: me.email,
            });
          }
        } catch {
          // Ignore - email send is best-effort
        }
      }

      if (request.sendPush) {
        await this.sendPushNotification(request);
      }

      cacheService.delete(`notifications:${request.userId}`);

      logger.info('Notification created', {
        notificationId: notification.id,
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

      const response = await api.get('/api/v1/notifications', {
        params: {
          userId,
          limit: options?.limit || 20,
          offset: options?.offset || 0,
          unreadOnly: options?.unreadOnly || false,
          type: (options as any)?.type,
        },
      });
      const resData = (response as any)?.data;
      const dbNotifications = resData?.notifications || resData?.data || [];
      const total = resData?.pagination?.total ?? resData?.total ?? dbNotifications.length;
      const unreadCount = resData?.unreadCount ?? dbNotifications.filter((n: any) => !n.read).length;

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

      await endpoints.notifications.markAsRead(notificationId);

      const res = await api.get<any>(`/api/v1/notifications/${notificationId}`).catch(() => null);
      const raw = res?.data ?? res;
      if (raw) {
        const notification: Notification = {
          id: raw.id,
          userId: raw.userId,
          type: raw.type as Notification['type'],
          title: raw.title,
          message: raw.message,
          ...(raw.data != null ? { data: raw.data as Record<string, any> } : {}),
          read: raw.read ?? true,
          ...(raw.readAt != null ? { readAt: typeof raw.readAt === 'string' ? new Date(raw.readAt) : raw.readAt } : {}),
          createdAt: typeof raw.createdAt === 'string' ? new Date(raw.createdAt) : raw.createdAt,
          ...(raw.actionUrl ? { actionUrl: raw.actionUrl } : {}),
          ...(raw.actionLabel ? { actionLabel: raw.actionLabel } : {}),
        };
        logger.info('Notification marked as read', { notificationId, userId });
        return notification;
      }

      const notification: Notification = {
        id: notificationId,
        userId,
        type: 'info',
        title: '',
        message: '',
        read: true,
        readAt: new Date(),
        createdAt: new Date(),
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

      await api.post('/api/v1/notifications/read-all', {});

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
    _userId: string
  ): Promise<void> {
    try {
      logger.info('Deleting notification', { notificationId, userId: _userId });

      await api.delete(`/api/v1/notifications/${notificationId}`);

      logger.info('Notification deleted', { notificationId, userId: _userId });
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
        try {
          const me = await endpoints.auth.me();
          if (!me?.email) {
            logger.warn('Cannot send email notification: user has no email', {
              userId: request.userId,
            });
            return;
            }
          request.userEmail = me.email;
        } catch {
          logger.warn('Cannot send email notification: could not load user', {
            userId: request.userId,
          });
          return;
        }
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
   * Envoie une notification push (via backend send-to-user)
   */
  async sendPushNotification(
    request: CreateNotificationRequest
  ): Promise<void> {
    try {
      const preferences = await this.getPreferences(request.userId);
      const notificationType = request.type;

      if (notificationType === 'order' && !preferences.push.orders) return;
      if (
        notificationType === 'customization' &&
        !preferences.push.customizations
      )
        return;
      if (notificationType === 'system' && !preferences.push.system) return;

      await api.post('/api/v1/notifications/push/send-to-user', {
        userId: request.userId,
        payload: {
          title: request.title,
          body: request.message,
          data: {
            type: request.type,
            actionUrl: request.actionUrl,
            ...request.data,
          },
        },
      });

      logger.info('Push notification sent', {
        userId: request.userId,
        type: request.type,
      });
    } catch (error: any) {
      logger.error('Error sending push notification', { error, request });
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
      await api.post('/api/v1/notifications/push/send', {
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
      });
      logger.info('Push notification sent successfully', {
        endpoint: subscription.endpoint.substring(0, 50) + '...',
        title: payload.title,
      });
    } catch (error) {
      logger.error('Failed to send push notification', {
        error,
        endpoint: subscription.endpoint.substring(0, 50) + '...',
      });
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

      const { publicKey } = await api.get<{ publicKey: string }>(
        '/api/v1/notifications/push/vapid-key'
      );

      // Convert VAPID key to Uint8Array
      const applicationServerKey = this.urlBase64ToUint8Array(publicKey);

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
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
    await api.post('/api/v1/notifications/push/subscribe', {
      userId,
      subscription: subscription.toJSON(),
    });
  }

  /**
   * Supprime l'abonnement push du backend
   */
  private async removePushSubscription(userId: string, endpoint: string): Promise<void> {
    await api.post('/api/v1/notifications/push/unsubscribe', {
      userId,
      endpoint,
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

  private readonly defaultPreferences: NotificationPreferences = {
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

  /**
   * Récupère les préférences de notifications (via API or defaults)
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const res = await api.get<{ notificationPreferences?: NotificationPreferences }>(
        '/api/v1/settings/notifications'
      ).catch(() => null);
      const userPrefs = res?.notificationPreferences;
      if (userPrefs) {
        return {
          email: { ...this.defaultPreferences.email, ...(userPrefs.email || {}) },
          push: { ...this.defaultPreferences.push, ...(userPrefs.push || {}) },
          inApp: { ...this.defaultPreferences.inApp, ...(userPrefs.inApp || {}) },
        };
      }
      const me = await endpoints.auth.me().catch(() => null);
      const prefs = (me as any)?.notificationPreferences;
      if (prefs) {
        return {
          email: { ...this.defaultPreferences.email, ...(prefs.email || {}) },
          push: { ...this.defaultPreferences.push, ...(prefs.push || {}) },
          inApp: { ...this.defaultPreferences.inApp, ...(prefs.inApp || {}) },
        };
      }
      return this.defaultPreferences;
    } catch (error: any) {
      logger.error('Error fetching notification preferences', { error, userId });
      return this.defaultPreferences;
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

      const current = await this.getPreferences(userId);
      const updated: NotificationPreferences = {
        email: { ...current.email, ...(preferences.email || {}) },
        push: { ...current.push, ...(preferences.push || {}) },
        inApp: { ...current.inApp, ...(preferences.inApp || {}) },
      };

      await endpoints.settings.notifications(updated as unknown as Record<string, unknown>);

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
