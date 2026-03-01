import { Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser as CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { CurrentUser } from '@/common/types/user.types';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @CurrentUserDecorator() user: CurrentUser,
    @Query('limit') limit?: string,
  ) {
    if (!user.organizationId) return { data: [], total: 0, unreadCount: 0 };
    const parsedLimit = limit ? Number(limit) : 20;
    const { items, unreadCount } = await this.notificationsService.listForUser(
      user.id,
      user.organizationId,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
    );
    return {
      data: items,
      total: items.length,
      unreadCount,
    };
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUserDecorator() user: CurrentUser) {
    if (!user.organizationId) return { count: 0 };
    const { unreadCount } = await this.notificationsService.listForUser(
      user.id,
      user.organizationId,
      1,
    );
    return { count: unreadCount };
  }

  @Post(':id/read')
  async markAsRead(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
  ) {
    if (user.organizationId) {
      await this.notificationsService.markAsRead(id, user.id, user.organizationId);
    }
    return { success: true, id };
  }

  @Post('read-all')
  async markAllAsRead(@CurrentUserDecorator() user: CurrentUser) {
    if (user.organizationId) {
      await this.notificationsService.markAllAsRead(user.id, user.organizationId);
    }
    return { success: true };
  }

  @Delete(':id')
  async deleteNotification(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
  ) {
    if (user.organizationId) {
      await this.notificationsService.delete(id, user.id, user.organizationId);
    }
    return { success: true, id };
  }
}
