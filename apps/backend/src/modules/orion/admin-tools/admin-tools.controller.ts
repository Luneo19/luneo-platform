import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminToolsService } from './admin-tools.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('orion')
@UseGuards(JwtAuthGuard, RolesGuard)
// @ts-expect-error NestJS decorator typing
@Roles(UserRole.PLATFORM_ADMIN)
export class AdminToolsController {
  constructor(private readonly adminToolsService: AdminToolsService) {}

  @Get('audit-log')
  getAuditLogs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminToolsService.getAuditLogs({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      action,
      userId,
      dateFrom,
      dateTo,
    });
  }

  @Get('notifications')
  getNotifications(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('type') type?: string,
    @Query('read') read?: string,
  ) {
    const readVal = read === 'true' ? true : read === 'false' ? false : undefined;
    return this.adminToolsService.getNotifications({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      type,
      read: readVal,
    });
  }

  @Get('notifications/count')
  getNotificationCount() {
    return this.adminToolsService.getNotificationCount();
  }

  @Put('notifications/:id/read')
  markNotificationRead(@Param('id') id: string) {
    return this.adminToolsService.markNotificationRead(id);
  }

  @Put('notifications/read-all')
  markAllNotificationsRead() {
    return this.adminToolsService.markAllNotificationsRead();
  }

  @Get('export/:type')
  async exportData(
    @Param('type') type: 'customers' | 'health-scores' | 'segments' | 'revenue' | 'audit-logs' | 'communications',
    @Query('format') format?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit?: string,
  ) {
    const fmt = (format === 'json' ? 'json' : 'csv') as 'csv' | 'json';
    const result = await this.adminToolsService.exportData(type, fmt, {
      dateFrom,
      dateTo,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return result;
  }
}
