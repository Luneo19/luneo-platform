import { Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser as CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { CurrentUser } from '@/common/types/user.types';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  @Get()
  async getNotifications(
    @CurrentUserDecorator() user: CurrentUser,
    @Query('limit') limit?: string,
  ) {
    return {
      data: [],
      total: 0,
      unreadCount: 0,
    };
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUserDecorator() user: CurrentUser) {
    return { count: 0 };
  }

  @Post(':id/read')
  async markAsRead(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return { success: true, id };
  }

  @Post('read-all')
  async markAllAsRead(@CurrentUserDecorator() user: CurrentUser) {
    return { success: true };
  }

  @Delete(':id')
  async deleteNotification(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return { success: true, id };
  }
}
