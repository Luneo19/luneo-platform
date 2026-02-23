import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface NotificationGroup {
  type: string;
  count: number;
  unreadCount: number;
  latest?: { id: string; title: string; createdAt: Date };
}

export interface NotificationCenterResult {
  groups: NotificationGroup[];
  totalUnread: number;
  totalCount: number;
}

export interface NotificationPreferences {
  email?: Record<string, boolean>;
  push?: Record<string, boolean>;
  inApp?: Record<string, boolean>;
}

export interface PushNotificationPayload {
  title: string;
  body?: string;
  icon?: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationEnhancedService {
  private readonly logger = new Logger(NotificationEnhancedService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns grouped notifications with read/unread counts for the notification center.
   */
  async getNotificationCenter(userId: string): Promise<NotificationCenterResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        type: true,
        title: true,
        read: true,
        createdAt: true,
      },
    });

    const byType = new Map<string, { count: number; unread: number; latest: typeof notifications[0] | null }>();
    for (const n of notifications) {
      const key = n.type ?? 'system';
      const existing = byType.get(key);
      if (!existing) {
        byType.set(key, {
          count: 1,
          unread: n.read ? 0 : 1,
          latest: n,
        });
      } else {
        existing.count += 1;
        if (!n.read) existing.unread += 1;
        if (!existing.latest || n.createdAt > existing.latest.createdAt) {
          existing.latest = n;
        }
      }
    }

    const groups: NotificationGroup[] = [];
    let totalUnread = 0;
    for (const [type, data] of byType.entries()) {
      totalUnread += data.unread;
      groups.push({
        type,
        count: data.count,
        unreadCount: data.unread,
        latest: data.latest
          ? {
              id: data.latest.id,
              title: data.latest.title,
              createdAt: data.latest.createdAt,
            }
          : undefined,
      });
    }

    groups.sort((a, b) => (b.latest?.createdAt?.getTime() ?? 0) - (a.latest?.createdAt?.getTime() ?? 0));

    return {
      groups,
      totalUnread,
      totalCount: notifications.length,
    };
  }

  /**
   * Update notification preferences (email/push/inApp per type).
   */
  async updatePreferences(
    userId: string,
    preferences: NotificationPreferences,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, notificationPreferences: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const current = (user.notificationPreferences as Record<string, unknown>) ?? {};
    const merged = {
      ...current,
      ...(preferences.email && { email: preferences.email }),
      ...(preferences.push && { push: preferences.push }),
      ...(preferences.inApp && { inApp: preferences.inApp }),
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: { notificationPreferences: merged },
    });
    this.logger.log(`Notification preferences updated for user ${userId}`);
  }

  /**
   * Send web push notification to user (enqueue; actual send via NotificationsService).
   */
  async sendPush(
    userId: string,
    notification: PushNotificationPayload,
  ): Promise<{ notificationId: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!notification?.title) {
      throw new BadRequestException('Notification title is required');
    }

    const created = await this.prisma.notification.create({
      data: {
        userId,
        type: 'push',
        title: notification.title,
        message: notification.body ?? '',
        data: notification.data ? (notification.data as Prisma.InputJsonValue) : undefined,
        read: false,
      },
    });

    this.logger.debug(`Push notification created for user ${userId}: ${created.id}`);
    return { notificationId: created.id };
  }

  /**
   * Setup WebSocket channel for real-time notifications (returns channel name for client).
   */
  async setupWebSocket(userId: string): Promise<{ channel: string; tokenHint?: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const channel = `notifications:user:${userId}`;
    this.logger.debug(`WebSocket channel setup for user ${userId}: ${channel}`);
    return {
      channel,
      tokenHint: 'Use auth token in connection query',
    };
  }
}
