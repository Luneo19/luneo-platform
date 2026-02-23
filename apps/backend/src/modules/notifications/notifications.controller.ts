import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
}
