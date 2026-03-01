import { Injectable } from '@nestjs/common';
import { NotificationChannel, Prisma } from '@prisma/client';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaOptimizedService) {}

  async listForUser(userId: string, organizationId: string, limit = 20) {
    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: {
          organizationId,
          OR: [{ userId }, { userId: null }],
        },
        orderBy: { createdAt: 'desc' },
        take: Math.max(1, Math.min(limit, 100)),
      }),
      this.prisma.notification.count({
        where: {
          organizationId,
          OR: [{ userId }, { userId: null }],
          readAt: null,
        },
      }),
    ]);

    return { items, unreadCount };
  }

  async markAsRead(id: string, userId: string, organizationId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id,
        organizationId,
        OR: [{ userId }, { userId: null }],
      },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string, organizationId: string) {
    return this.prisma.notification.updateMany({
      where: {
        organizationId,
        OR: [{ userId }, { userId: null }],
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }

  async delete(id: string, userId: string, organizationId: string) {
    return this.prisma.notification.deleteMany({
      where: {
        id,
        organizationId,
        OR: [{ userId }, { userId: null }],
      },
    });
  }

  async createSystemNotification(input: {
    organizationId: string;
    userId?: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    channels?: NotificationChannel[];
  }) {
    return this.prisma.notification.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data as Prisma.InputJsonValue | undefined,
        channels: input.channels ?? [NotificationChannel.IN_APP],
      },
    });
  }
}
