// @ts-nocheck
import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, Subject } from 'rxjs';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';

// Web Push types
interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

interface PushSubscriptionData {
  endpoint: string;
  expirationTime?: number | null;
  keys: PushSubscriptionKeys;
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

/**
 * PERF-01: Push subscriptions migrées vers Redis
 * - Plus de perte de données au redémarrage
 * - Support du scaling horizontal (multi-instances)
 * - TTL automatique pour nettoyer les subscriptions expirées
 */
const PUSH_SUB_REDIS_PREFIX = 'push:sub:';
const PUSH_SUB_TTL = 60 * 60 * 24 * 30; // 30 jours

/** MessageEvent-compatible shape for SSE (data only; EventSource expects { data: string }). */
export interface SseMessageEvent {
  data: string | object;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly vapidPublicKey: string;
  private webPushEnabled: boolean = false;
  private redisAvailable: boolean = false;

  // Fallback in-memory pour mode dégradé (si Redis indisponible)
  private inMemoryFallback: Map<string, PushSubscriptionData[]> = new Map();

  // SSE: per-user subjects for real-time notification stream
  private readonly notificationSubjects = new Map<string, Subject<SseMessageEvent>>();

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private redis: RedisOptimizedService,
  ) {
    this.vapidPublicKey = this.configService.get<string>('VAPID_PUBLIC_KEY') || '';
    
    // Check if web-push can be enabled
    const vapidPrivateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    if (this.vapidPublicKey && vapidPrivateKey) {
      this.webPushEnabled = true;
      this.logger.log('Web Push configured (VAPID keys present)');
    } else {
      this.logger.debug('VAPID keys not configured - push notifications disabled');
    }
    
    // Check Redis availability
    this.checkRedisAvailability();
  }
  
  /**
   * Vérifie si Redis est disponible pour le stockage des subscriptions
   */
  private async checkRedisAvailability(): Promise<void> {
    try {
      const isHealthy = await this.redis.healthCheck();
      this.redisAvailable = isHealthy;
      if (isHealthy) {
        this.logger.log('✅ Push subscriptions: Redis storage enabled');
      } else {
        this.logger.debug('⚠️ Push subscriptions: Redis unavailable, using in-memory fallback');
      }
    } catch {
      this.redisAvailable = false;
      this.logger.debug('Push subscriptions: Redis not yet available, using in-memory fallback');
    }
  }

  // ========================================
  // PUSH NOTIFICATIONS (PERF-01: Redis-backed)
  // ========================================

  /**
   * Get VAPID public key for client subscription
   */
  getVapidPublicKey(): string {
    return this.vapidPublicKey;
  }
  
  /**
   * Récupère les subscriptions d'un utilisateur depuis Redis ou fallback
   */
  private async getUserSubscriptions(userId: string): Promise<PushSubscriptionData[]> {
    if (this.redisAvailable) {
      try {
        const data = await this.redis.get<PushSubscriptionData[]>(
          `${PUSH_SUB_REDIS_PREFIX}${userId}`,
          'session'
        );
        return data || [];
      } catch (error) {
        this.logger.error(`Failed to get subscriptions from Redis for user ${userId}`, error);
        // Fallback to in-memory
        return this.inMemoryFallback.get(userId) || [];
      }
    }
    return this.inMemoryFallback.get(userId) || [];
  }
  
  /**
   * Sauvegarde les subscriptions d'un utilisateur dans Redis ou fallback
   */
  private async saveUserSubscriptions(userId: string, subscriptions: PushSubscriptionData[]): Promise<boolean> {
    // Toujours sauvegarder en mémoire comme backup
    if (subscriptions.length > 0) {
      this.inMemoryFallback.set(userId, subscriptions);
    } else {
      this.inMemoryFallback.delete(userId);
    }
    
    if (this.redisAvailable) {
      try {
        if (subscriptions.length > 0) {
          await this.redis.set(
            `${PUSH_SUB_REDIS_PREFIX}${userId}`,
            subscriptions,
            'session',
            { ttl: PUSH_SUB_TTL }
          );
        } else {
          await this.redis.del(`${PUSH_SUB_REDIS_PREFIX}${userId}`, 'session');
        }
        return true;
      } catch (error) {
        this.logger.error(`Failed to save subscriptions to Redis for user ${userId}`, error);
        return false;
      }
    }
    return true;
  }

  /**
   * Subscribe user to push notifications
   * PERF-01: Stockage Redis persistant
   */
  async subscribeToPush(userId: string, subscription: PushSubscriptionData): Promise<{ success: boolean }> {
    try {
      const existing = await this.getUserSubscriptions(userId);
      
      // Check if already subscribed (update if exists)
      const existingIndex = existing.findIndex(s => s.endpoint === subscription.endpoint);
      if (existingIndex >= 0) {
        existing[existingIndex] = subscription;
      } else {
        existing.push(subscription);
      }
      
      await this.saveUserSubscriptions(userId, existing);
      this.logger.log(`Push subscription added for user ${userId} (Redis: ${this.redisAvailable})`);
      
      return {
        success: true,
        channel: 'push',
        subscribedAt: new Date().toISOString(),
        endpointHint: subscription.endpoint?.substring(0, 50) ?? undefined,
      } as { success: boolean; channel?: string; subscribedAt?: string; endpointHint?: string };
    } catch (error) {
      this.logger.error(`Failed to subscribe user ${userId} to push`, error);
      return { success: false };
    }
  }

  /**
   * Unsubscribe user from push notifications
   * PERF-01: Suppression depuis Redis
   */
  async unsubscribeFromPush(userId: string, endpoint: string): Promise<{ success: boolean }> {
    try {
      const existing = await this.getUserSubscriptions(userId);
      const filtered = existing.filter(s => s.endpoint !== endpoint);
      
      await this.saveUserSubscriptions(userId, filtered);
      
      this.logger.log(`Push subscription removed for user ${userId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to unsubscribe user ${userId} from push`, error);
      return { success: false };
    }
  }

  /**
   * Send push notification to a subscription
   */
  async sendPushNotification(
    subscription: PushSubscriptionData,
    payload: PushPayload,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.webPushEnabled) {
      this.logger.warn('Push notification skipped - web push not enabled');
      return { success: false, error: 'Web push not configured' };
    }

    try {
      // Envoyer la notification push via l'endpoint du navigateur
      const pushPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/icon-192x192.png',
        data: payload.data || {},
        tag: `luneo-${Date.now()}`,
      });

      const response = await fetch(subscription.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'TTL': '86400',
        },
        body: pushPayload,
      });

      if (!response.ok && response.status !== 201) {
        this.logger.warn(`Push notification failed with status ${response.status}`, {
          endpoint: subscription.endpoint.substring(0, 50),
        });
        return { success: false, error: `HTTP ${response.status}` };
      }

      this.logger.log('Push notification sent successfully', {
        endpoint: subscription.endpoint.substring(0, 50),
        title: payload.title,
      });
      
      return { success: true };
    } catch (error) {
      this.logger.error('Push notification failed', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Send push notification to all user subscriptions
   * PERF-01: Lecture depuis Redis
   */
  /**
   * SECURITY FIX: Helper to retrieve brandId for a given user.
   * Used by controller to verify cross-brand notification access.
   */
  async getUserBrandId(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { brandId: true },
    });
    return user?.brandId ?? null;
  }

  async sendPushToUser(userId: string, payload: PushPayload): Promise<{ sent: number; failed: number }> {
    const subscriptions = await this.getUserSubscriptions(userId);
    const results = await Promise.all(
      subscriptions.map((sub) => this.sendPushNotification(sub, payload))
    );
    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    return { sent, failed };
  }

  // ========================================
  // IN-APP NOTIFICATIONS
  // ========================================

  async findAll(userId: string, options?: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: { userId: string; read?: boolean } = { userId };
    if (options?.unreadOnly) {
      where.read = false;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Access denied to this notification');
    }

    return notification;
  }

  async create(createData: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    actionUrl?: string;
    actionLabel?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: createData.userId,
        type: createData.type,
        title: createData.title,
        message: createData.message,
        data: createData.data ? JSON.parse(JSON.stringify(createData.data)) : undefined,
        actionUrl: createData.actionUrl,
        actionLabel: createData.actionLabel,
      },
    });
    this.emitNotification(createData.userId, notification);
    return notification;
  }

  /**
   * SSE: returns an observable stream of notification events for the given user.
   * Caller must subscribe; on unsubscribe the stream is cleaned up.
   */
  getStream(userId: string): Observable<SseMessageEvent> {
    if (!this.notificationSubjects.has(userId)) {
      this.notificationSubjects.set(userId, new Subject<SseMessageEvent>());
    }
    const subject = this.notificationSubjects.get(userId)!;
    return new Observable((observer) => {
      const subscription = subject.subscribe(observer);
      return () => {
        subscription.unsubscribe();
        this.notificationSubjects.delete(userId);
      };
    });
  }

  /**
   * SSE: emit a notification event to the user's stream (for real-time in-app updates).
   */
  emitNotification(userId: string, notification: unknown): void {
    const subject = this.notificationSubjects.get(userId);
    if (subject) {
      const data = typeof notification === 'object' && notification !== null
        ? JSON.stringify(notification)
        : String(notification);
      subject.next({ data });
    }
  }

  async markAsRead(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.notification.update({
      where: { id },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  async delete(id: string, userId: string) {
    await this.findOne(id, userId);

    await this.prisma.notification.delete({
      where: { id },
    });

    return { success: true };
  }
}
