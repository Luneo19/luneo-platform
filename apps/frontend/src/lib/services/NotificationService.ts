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
  data?: Record<string, unknown>;
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
  data?: Record<string, unknown>;
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
      const created = await api.post<Notification & { readAt?: string }>('/api/v1/notifications', {
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
    } catch (error: unknown) {
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

      interface NotificationsApiResponse {
        notifications?: Array<{ id: string; userId: string; type: string; title: string; message: string; data?: Record<string, unknown>; read: boolean; readAt?: Date | string | null; createdAt: Date | string; actionUrl?: string | null; actionLabel?: string | null }>;
        data?: unknown[];
        pagination?: { total?: number };
        total?: number;
        unreadCount?: number;
      }

      const response = await api.get<NotificationsApiResponse>('/api/v1/notifications', {
        params: {
          userId,
          limit: options?.limit || 20,
          offset: options?.offset || 0,
          unreadOnly: options?.unreadOnly || false,
          type: options?.type,
        },
      });

      const dbNotifications = response?.notifications ?? response?.data ?? [];
      const list = Array.isArray(dbNotifications) ? dbNotifications : [];
      const total = response?.pagination?.total ?? response?.total ?? list.length;
      const unreadCount = response?.unreadCount ?? list.filter((n: unknown) => !(n as { read?: boolean }).read).length;

      type NotifLike = {
        id: string;
        userId: string;
        type: string;
        title: string;
        message: string;
        data?: Record<string, unknown>;
        read: boolean;
        readAt?: Date | string | null;
        createdAt: Date | string;
        actionUrl?: string | null;
        actionLabel?: string | null;
      };
      const notifications: Notification[] = (list as NotifLike[]).map((n) => ({
          id: n.id,
          userId: n.userId,
          type: n.type as Notification['type'],
          title: n.title,
          message: n.message,
          data: n.data,
          read: n.read,
          readAt: n.readAt != null ? (typeof n.readAt === 'string' ? new Date(n.readAt) : n.readAt) : undefined,
          createdAt: typeof n.createdAt === 'string' ? new Date(n.createdAt) : n.createdAt,
          actionUrl: n.actionUrl ?? undefined,
          actionLabel: n.actionLabel ?? undefined,
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
    } catch (error: unknown) {
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

      interface NotificationApiRow {
        id: string;
        userId: string;
        type: string;
        title: string;
        message: string;
        data?: Record<string, unknown>;
        read?: boolean;
        readAt?: string | Date | null;
        createdAt: string | Date;
        actionUrl?: string | null;
        actionLabel?: string | null;
      }
      const res = await api.get<NotificationApiRow>(`/api/v1/notifications/${notificationId}`).catch(() => null);
      const raw = res ?? null;
      if (raw) {
        const notification: Notification = {
          id: raw.id,
          userId: raw.userId,
          type: raw.type as Notification['type'],
          title: raw.title,
          message: raw.message,
          ...(raw.data != null ? { data: raw.data } : {}),
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      logger.error('Error deleting notification', { error, notificationId });
      throw error;
    }
  }

  // ========================================
  // REAL-TIME (SSE)
  // ========================================

  /**
   * Build SSE stream URL (matches API client: uses NEXT_PUBLIC_API_URL env var).
   */
  private getSSEStreamUrl(): string {
    if (typeof window === 'undefined') return '';
    const base = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3001` : 'http://127.0.0.1:3001');
    return `${base.replace(/\/$/, '')}/api/v1/notifications/stream`;
  }

  /**
   * Subscribe to real-time notifications via Server-Sent Events.
   * Cookies are sent automatically (withCredentials) for auth.
   * Returns an unsubscribe function.
   */
  subscribeToRealtime(onNotification: (notification: Notification) => void): () => void {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return () => {};
    }
    const url = this.getSSEStreamUrl();
    if (!url) return () => {};
    const es = new EventSource(url, { withCredentials: true });
    const handler = (event: MessageEvent) => {
      try {
        const raw = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
        const data = JSON.parse(raw) as Record<string, unknown>;
        const notification: Notification = {
          id: String(data.id ?? ''),
          userId: String(data.userId ?? ''),
          type: (data.type as Notification['type']) ?? 'info',
          title: String(data.title ?? ''),
          message: String(data.message ?? ''),
          data: data.data as Record<string, unknown> | undefined,
          read: Boolean(data.read ?? false),
          readAt: data.readAt ? new Date(data.readAt as string) : undefined,
          createdAt: new Date((data.createdAt as string) ?? Date.now()),
          actionUrl: data.actionUrl as string | undefined,
          actionLabel: data.actionLabel as string | undefined,
        };
        onNotification(notification);
      } catch (err) {
        logger.error('SSE parse error', { error: err, data: event.data });
      }
    };
    es.onmessage = handler;
    es.onerror = () => {
      logger.warn('SSE connection error or closed');
    };
    return () => {
      es.close();
    };
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
    } catch (error: unknown) {
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
              <a href="${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:3000')}/settings/notifications" style="color: #0070f3;">Gérer mes préférences</a>
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
    } catch (error: unknown) {
      logger.error('Error sending push notification', { error, request });
    }
  }

  /**
   * Envoie une notification push à un abonnement spécifique via backend API
   */
  private async sendPushToSubscription(
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: { title: string; body: string; data?: Record<string, unknown>; icon?: string; badge?: string; url?: string }
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
    } catch (error: unknown) {
      logger.error('Failed to send push notification', {
        error,
        endpoint: subscription.endpoint.substring(0, 50) + '...',
      });
    }
  }

  /**
   * Register the service worker (must be called before subscribeToPush).
   * Returns the registration or null if not supported.
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    try {
      if (!('serviceWorker' in navigator)) {
        return null;
      }
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      logger.info('Service worker registered', { scope: registration.scope });
      return registration;
    } catch (error) {
      logger.error('Failed to register service worker', { error });
      return null;
    }
  }

  /**
   * S'abonner aux notifications push (côté client).
   * Registers the service worker if needed, requests permission, subscribes with VAPID, sends subscription to backend.
   */
  async subscribeToPush(userId: string): Promise<PushSubscription | null> {
    try {
      // Check if push is supported
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        logger.warn('Push notifications not supported in this browser');
        return null;
      }

      // Register service worker first (ensures /sw.js is controlling the page)
      const registration =
        (await navigator.serviceWorker.getRegistration()) ??
        (await this.registerServiceWorker());
      if (!registration) {
        logger.warn('Could not get or register service worker');
        return null;
      }
      // Wait for the SW to be active (e.g. after first register)
      const activeRegistration = await navigator.serviceWorker.ready;

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        logger.info('Push notification permission denied');
        return null;
      }

      // VAPID public key: prefer env, fallback to API
      let publicKey: string;
      const envKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (envKey && envKey.trim()) {
        publicKey = envKey.trim();
      } else {
        const res = await api.get<{ publicKey: string }>(
          '/api/v1/notifications/push/vapid-key'
        );
        publicKey = res.publicKey;
      }

      // Convert VAPID key to Uint8Array
      const applicationServerKey = this.urlBase64ToUint8Array(publicKey);

      // Subscribe to push
      const subscription = await activeRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      // Send subscription to backend
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
   * Map API shape (email.designs, etc.) to internal shape (email.customizations).
   */
  private mapApiPreferencesToInternal(api: {
    email?: { orders?: boolean; designs?: boolean; marketing?: boolean; securityAlerts?: boolean };
    push?: { orders?: boolean; designs?: boolean };
    inApp?: { orders?: boolean; designs?: boolean; system?: boolean };
  }): NotificationPreferences {
    return {
      email: {
        ...this.defaultPreferences.email,
        orders: api.email?.orders ?? this.defaultPreferences.email.orders,
        customizations: api.email?.designs ?? this.defaultPreferences.email.customizations,
        marketing: api.email?.marketing ?? this.defaultPreferences.email.marketing,
        system: this.defaultPreferences.email.system,
      },
      push: {
        ...this.defaultPreferences.push,
        orders: api.push?.orders ?? this.defaultPreferences.push.orders,
        customizations: api.push?.designs ?? this.defaultPreferences.push.customizations,
        system: this.defaultPreferences.push.system,
      },
      inApp: {
        ...this.defaultPreferences.inApp,
        orders: api.inApp?.orders ?? this.defaultPreferences.inApp.orders,
        customizations: api.inApp?.designs ?? this.defaultPreferences.inApp.customizations,
        system: api.inApp?.system ?? this.defaultPreferences.inApp.system,
      },
    };
  }

  /**
   * Récupère les préférences de notifications (via API or defaults)
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const res = await api.get<{
        email?: { orders?: boolean; designs?: boolean; marketing?: boolean; securityAlerts?: boolean };
        push?: { orders?: boolean; designs?: boolean };
        inApp?: { orders?: boolean; designs?: boolean; system?: boolean };
      }>('/api/v1/settings/notifications').catch(() => null);
      if (res && (res.email || res.push || res.inApp)) {
        return this.mapApiPreferencesToInternal(res);
      }
      const me = await endpoints.auth.me().catch(() => null) as {
        notificationPreferences?: { email?: { orders?: boolean; designs?: boolean }; push?: { orders?: boolean; designs?: boolean }; inApp?: { orders?: boolean; designs?: boolean; system?: boolean } };
      } | null;
      const prefs = me?.notificationPreferences;
      if (prefs && (prefs.email || prefs.push || prefs.inApp)) {
        return this.mapApiPreferencesToInternal(prefs);
      }
      return this.defaultPreferences;
    } catch (error: unknown) {
      logger.error('Error fetching notification preferences', { error, userId });
      return this.defaultPreferences;
    }
  }

  /**
   * Map internal preferences (customizations) to API shape (designs).
   */
  private mapInternalPreferencesToApi(prefs: NotificationPreferences): Record<string, unknown> {
    return {
      email: {
        orders: prefs.email.orders,
        designs: prefs.email.customizations,
        marketing: prefs.email.marketing,
        securityAlerts: prefs.email.system,
      },
      push: { orders: prefs.push.orders, designs: prefs.push.customizations },
      inApp: {
        orders: prefs.inApp.orders,
        designs: prefs.inApp.customizations,
        system: prefs.inApp.system,
      },
    };
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

      await endpoints.settings.notifications(this.mapInternalPreferencesToApi(updated));

      logger.info('Notification preferences updated', { userId });
      return updated;
    } catch (error: unknown) {
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
