import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';

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

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly vapidPublicKey: string;
  private webPushEnabled: boolean = false;
  
  // In-memory push subscriptions (in production, use Redis or DB table)
  private pushSubscriptions: Map<string, PushSubscriptionData[]> = new Map();

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.vapidPublicKey = this.configService.get<string>('VAPID_PUBLIC_KEY') || '';
    
    // Check if web-push can be enabled
    const vapidPrivateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    if (this.vapidPublicKey && vapidPrivateKey) {
      this.webPushEnabled = true;
      this.logger.log('Web Push configured (VAPID keys present)');
    } else {
      this.logger.warn('VAPID keys not configured - push notifications disabled');
    }
  }

  // ========================================
  // PUSH NOTIFICATIONS
  // ========================================

  /**
   * Get VAPID public key for client subscription
   */
  getVapidPublicKey(): string {
    return this.vapidPublicKey;
  }

  /**
   * Subscribe user to push notifications
   */
  async subscribeToPush(userId: string, subscription: PushSubscriptionData): Promise<{ success: boolean }> {
    try {
      // Store subscription in memory (for MVP - use Redis/DB in production)
      const existing = this.pushSubscriptions.get(userId) || [];
      
      // Check if already subscribed
      const existingIndex = existing.findIndex(s => s.endpoint === subscription.endpoint);
      if (existingIndex >= 0) {
        existing[existingIndex] = subscription;
      } else {
        existing.push(subscription);
      }
      
      this.pushSubscriptions.set(userId, existing);
      this.logger.log(`Push subscription added for user ${userId}`);
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to subscribe user ${userId} to push`, error);
      return { success: false };
    }
  }

  /**
   * Unsubscribe user from push notifications
   */
  async unsubscribeFromPush(userId: string, endpoint: string): Promise<{ success: boolean }> {
    try {
      const existing = this.pushSubscriptions.get(userId) || [];
      const filtered = existing.filter(s => s.endpoint !== endpoint);
      
      if (filtered.length > 0) {
        this.pushSubscriptions.set(userId, filtered);
      } else {
        this.pushSubscriptions.delete(userId);
      }
      
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
      // In production, implement actual web-push sending here
      // For now, log the notification
      this.logger.log('Push notification would be sent', {
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
   */
  async sendPushToUser(userId: string, payload: PushPayload): Promise<{ sent: number; failed: number }> {
    const subscriptions = this.pushSubscriptions.get(userId) || [];
    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      const result = await this.sendPushNotification(sub, payload);
      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    }

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
    return this.prisma.notification.create({
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
