import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

export interface NotificationPreferencesNested {
  email?: {
    orders?: boolean;
    designs?: boolean;
    marketing?: boolean;
    securityAlerts?: boolean;
  };
  push?: {
    orders?: boolean;
    designs?: boolean;
  };
  inApp?: {
    orders?: boolean;
    designs?: boolean;
    system?: boolean;
  };
}

const DEFAULT_PREFERENCES: Required<NotificationPreferencesNested> = {
  email: {
    orders: true,
    designs: true,
    marketing: false,
    securityAlerts: true,
  },
  push: {
    orders: true,
    designs: true,
  },
  inApp: {
    orders: true,
    designs: true,
    system: true,
  },
};

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Update the current user's notification preferences.
   * Stores nested preferences in User.notificationPreferences JSON; merges with existing values.
   */
  async updateNotificationPreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesNested> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const current = (user.notificationPreferences as NotificationPreferencesNested | null) ?? {};
    const merged: NotificationPreferencesNested = {
      email: { ...DEFAULT_PREFERENCES.email, ...current.email, ...dto.email },
      push: { ...DEFAULT_PREFERENCES.push, ...current.push, ...dto.push },
      inApp: { ...DEFAULT_PREFERENCES.inApp, ...current.inApp, ...dto.inApp },
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: { notificationPreferences: merged as object },
    });

    return merged;
  }

  /**
   * Get the current user's notification preferences (nested shape with defaults).
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreferencesNested> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const stored = (user.notificationPreferences as NotificationPreferencesNested | null) ?? {};
    return {
      email: { ...DEFAULT_PREFERENCES.email, ...stored.email },
      push: { ...DEFAULT_PREFERENCES.push, ...stored.push },
      inApp: { ...DEFAULT_PREFERENCES.inApp, ...stored.inApp },
    };
  }
}
