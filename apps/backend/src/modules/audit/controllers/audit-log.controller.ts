// @ts-nocheck
/**
 * Audit Log Controller
 * Provides API endpoints for audit log management
 */

import { Controller, Get, Query, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditLogService, AuditAction } from '../services/audit-log.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@/common/compat/v1-enums';

@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * Get audit logs with filters
   */
  @Get()
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.BRAND_ADMIN)
  @ApiOperation({ summary: 'Get audit logs with filters' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'brandId', required: false })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiQuery({ name: 'resourceType', required: false })
  @ApiQuery({ name: 'resourceId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('brandId') brandId?: string,
    @Query('action') action?: AuditAction,
    @Query('resourceType') resourceType?: string,
    @Query('resourceId') resourceId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters = {
      userId,
      brandId,
      action,
      resourceType,
      resourceId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    const logs = await this.auditLogService.getAuditLogs(filters);
    return { logs, total: logs.length };
  }

  /**
   * Get audit log by ID
   */
  @Get(':id')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.BRAND_ADMIN)
  @ApiOperation({ summary: 'Get audit log by ID' })
  @ApiResponse({ status: 200, description: 'Audit log retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  async getAuditLogById(@Param('id') id: string) {
    const log = await this.auditLogService.getAuditLogById(id);
    if (!log) {
      return { error: 'Audit log not found' };
    }
    return log;
  }

  /**
   * Export audit logs
   */
  @Get('export/:format')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.BRAND_ADMIN)
  @ApiOperation({ summary: 'Export audit logs to CSV or JSON' })
  @ApiResponse({ status: 200, description: 'Audit logs exported successfully' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'brandId', required: false })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async exportAuditLogs(
    @Param('format') format: 'csv' | 'json',
    @Res() res: Response,
    @Query('userId') userId?: string,
    @Query('brandId') brandId?: string,
    @Query('action') action?: AuditAction,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      userId,
      brandId,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const buffer = await this.auditLogService.exportAuditLogs(filters, format);

    const contentType = format === 'csv' ? 'text/csv' : 'application/json';
    const extension = format === 'csv' ? 'csv' : 'json';
    const filename = `audit-logs-${new Date().toISOString()}.${extension}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
