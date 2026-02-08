import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

export interface NotificationPreferences {
  emailNotifications?: boolean;
  marketingEmails?: boolean;
  orderUpdates?: boolean;
  securityAlerts?: boolean;
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Update the current user's notification preferences.
   * Stores preferences in User.notificationPreferences JSON field; merges with existing values.
   */
  async updateNotificationPreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferences> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const current = (user.notificationPreferences as NotificationPreferences | null) ?? {};
    const merged: NotificationPreferences = {
      ...current,
      ...(dto.emailNotifications !== undefined && { emailNotifications: dto.emailNotifications }),
      ...(dto.marketingEmails !== undefined && { marketingEmails: dto.marketingEmails }),
      ...(dto.orderUpdates !== undefined && { orderUpdates: dto.orderUpdates }),
      ...(dto.securityAlerts !== undefined && { securityAlerts: dto.securityAlerts }),
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: { notificationPreferences: merged as object },
    });

    return merged;
  }

  /**
   * Get the current user's notification preferences.
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return (user.notificationPreferences as NotificationPreferences | null) ?? {};
  }
}
