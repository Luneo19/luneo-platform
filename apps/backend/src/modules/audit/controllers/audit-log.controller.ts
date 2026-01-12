/**
 * Audit Log Controller
 * API endpoints for viewing audit logs
 */

import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { AuditLogService, AuditAction } from '../services/audit-log.service';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.BRAND_ADMIN)
  @ApiOperation({ summary: 'Get audit logs with filters' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'brandId', required: false })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiQuery({ name: 'resourceType', required: false })
  @ApiQuery({ name: 'resourceId', required: false })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('brandId') brandId?: string,
    @Query('action') action?: AuditAction,
    @Query('resourceType') resourceType?: string,
    @Query('resourceId') resourceId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Request() req?: any,
  ) {
    // Ensure users can only access their own brand's logs (unless platform admin)
    if (req.user.role !== UserRole.PLATFORM_ADMIN) {
      brandId = req.user.brandId;
    }

    return this.auditLogService.getAuditLogs({
      userId,
      brandId,
      action,
      resourceType,
      resourceId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit.toString(), 10) : 100,
      offset: offset ? parseInt(offset.toString(), 10) : 0,
    });
  }

  @Get(':id')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.BRAND_ADMIN)
  @ApiOperation({ summary: 'Get audit log by ID' })
  @ApiResponse({ status: 200, description: 'Audit log retrieved successfully' })
  async getAuditLog(@Param('id') id: string) {
    return this.auditLogService.getAuditLogById(id);
  }

  @Get('export/csv')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.BRAND_ADMIN)
  @ApiOperation({ summary: 'Export audit logs as CSV' })
  @ApiResponse({ status: 200, description: 'Audit logs exported successfully' })
  async exportAuditLogs(
    @Query('userId') userId?: string,
    @Query('brandId') brandId?: string,
    @Query('action') action?: AuditAction,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?: any,
  ) {
    // Ensure users can only export their own brand's logs (unless platform admin)
    if (req.user.role !== UserRole.PLATFORM_ADMIN) {
      brandId = req.user.brandId;
    }

    const csvBuffer = await this.auditLogService.exportAuditLogs({
      userId,
      brandId,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return {
      success: true,
      data: csvBuffer.toString('base64'),
      format: 'csv',
    };
  }
}
