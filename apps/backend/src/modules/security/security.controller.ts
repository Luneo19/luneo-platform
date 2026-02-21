import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { RequestWithUser } from '@/common/types/user.types';
import { RBACService } from './services/rbac.service';
import { AuditLogsService, AuditEventType } from './services/audit-logs.service';
import { GDPRService } from './services/gdpr.service';
import { Role, Permission } from './interfaces/rbac.interface';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermissions } from './decorators/require-permissions.decorator';
import { AssignRoleDto } from './dto/assign-role.dto';
import { ExportAuditLogsDto } from './dto/export-audit-logs.dto';
import { DeleteUserDataDto } from './dto/delete-user-data.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { RecordConsentDto } from './dto/record-consent.dto';
import { ScheduleDataRetentionDto } from './dto/schedule-data-retention.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { BrandOwnershipGuard } from '@/common/guards/brand-ownership.guard';
import { AuthService } from '@/modules/auth/auth.service';

/**
 * Controller pour la sécurité et conformité
 */
@ApiTags('Security & Compliance')
@Controller('security')
@UseGuards(JwtAuthGuard, BrandOwnershipGuard)
@ApiBearerAuth()
export class SecurityController {
  constructor(
    private readonly rbacService: RBACService,
    private readonly auditLogs: AuditLogsService,
    private readonly gdprService: GDPRService,
    private readonly authService: AuthService,
  ) {}

  // ==================== RBAC ====================

  @Get('roles')
  @ApiOperation({ summary: 'List all available roles' })
  @ApiResponse({ status: 200, description: 'Roles listed' })
  async getRoles() {
    return {
      roles: Object.values(Role),
      permissions: Object.values(Permission),
    };
  }

  @Get('roles/:role/permissions')
  @ApiOperation({ summary: 'Get permissions for a role' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved' })
  async getRolePermissions(@Param('role') role: Role) {
    return {
      role,
      permissions: this.rbacService.getRolePermissions(role),
    };
  }

  @Post('users/:userId/role')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.USER_UPDATE)
  @ApiOperation({ summary: 'Assign a role to a user' })
  @ApiResponse({ status: 200, description: 'Role assigned' })
  async assignRole(
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto,
  ) {
    await this.rbacService.assignRole(userId, dto.role);
    return { success: true, userId, role: dto.role };
  }

  @Get('users/:userId/permissions')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.USER_READ)
  @ApiOperation({ summary: 'Get all permissions for a user' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved' })
  async getUserPermissions(@Param('userId') userId: string) {
    const [role, permissions] = await Promise.all([
      this.rbacService.getUserRole(userId),
      this.rbacService.getUserPermissions(userId),
    ]);

    return { userId, role, permissions };
  }

  @Get('roles/stats')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.USER_READ)
  @ApiOperation({ summary: 'Get role statistics' })
  @ApiResponse({ status: 200, description: 'Stats retrieved' })
  async getRoleStats(@Request() req: RequestWithUser, @Query('brandId') queryBrandId?: string) {
    // SECURITY: Only PLATFORM_ADMIN can query arbitrary brandId; others are scoped to their brand
    const brandId =
      req.user?.role === UserRole.PLATFORM_ADMIN ? queryBrandId : req.user?.brandId ?? undefined;
    return this.rbacService.getRoleStats(brandId);
  }

  // ==================== AUDIT LOGS ====================

  @Get('audit/search')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.AUDIT_READ)
  @ApiOperation({ summary: 'Search audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved' })
  async searchAuditLogs(
    @Request() req: RequestWithUser,
    @Query('userId') userId?: string,
    @Query('brandId') queryBrandId?: string,
    @Query('eventType') eventType?: AuditEventType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const brandId =
      req.user?.role === UserRole.PLATFORM_ADMIN ? queryBrandId : req.user?.brandId ?? undefined;
    return this.auditLogs.search({
      userId,
      brandId,
      eventType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get('audit/resource/:resourceType/:resourceId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.AUDIT_READ)
  @ApiOperation({ summary: 'Get audit history for a resource' })
  @ApiResponse({ status: 200, description: 'Resource history retrieved' })
  async getResourceHistory(
    @Param('resourceType') resourceType: string,
    @Param('resourceId') resourceId: string,
  ) {
    const history = await this.auditLogs.getResourceHistory(
      resourceType,
      resourceId,
    );
    return { resourceType, resourceId, history };
  }

  @Get('audit/user/:userId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.AUDIT_READ)
  @ApiOperation({ summary: 'Get user activity log' })
  @ApiResponse({ status: 200, description: 'User activity retrieved' })
  async getUserActivity(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    const activity = await this.auditLogs.getUserActivity(
      userId,
      limit ? parseInt(limit, 10) : 100,
    );
    return { userId, activity };
  }

  @Get('audit/stats')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.AUDIT_READ)
  @ApiOperation({ summary: 'Get audit statistics' })
  @ApiResponse({ status: 200, description: 'Stats retrieved' })
  async getAuditStats(
    @Request() req: RequestWithUser,
    @Query('brandId') queryBrandId?: string,
    @Query('days') days?: string,
  ) {
    const brandId =
      req.user?.role === UserRole.PLATFORM_ADMIN ? queryBrandId : req.user?.brandId ?? undefined;
    return this.auditLogs.getStats(brandId, days ? parseInt(days, 10) : 30);
  }

  @Get('audit/export/csv')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.AUDIT_EXPORT)
  @ApiOperation({ summary: 'Export audit logs to CSV' })
  @ApiResponse({ status: 200, description: 'CSV exported' })
  async exportAuditLogsCSV(@Request() req: RequestWithUser, @Query() dto: ExportAuditLogsDto) {
    const brandId =
      req.user?.role === UserRole.PLATFORM_ADMIN ? dto.brandId : req.user?.brandId ?? undefined;
    const filters = {
      userId: dto.userId,
      brandId,
      eventType: dto.eventType,
      resourceType: dto.resourceType,
      resourceId: dto.resourceId,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    };
    const csv = await this.auditLogs.exportToCSV(filters);
    return {
      csv,
      filename: `audit-logs-${new Date().toISOString()}.csv`,
    };
  }

  @Get('audit/suspicious/:userId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.AUDIT_READ)
  @ApiOperation({ summary: 'Detect suspicious activity' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved' })
  async detectSuspiciousActivity(@Param('userId') userId: string) {
    const alerts = await this.auditLogs.detectSuspiciousActivity(userId);
    return { userId, alerts };
  }

  // ==================== GDPR ====================

  @Get('gdpr/export')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Export current user data (GDPR Right to Access)' })
  @ApiResponse({ status: 200, description: 'User data exported' })
  async exportMyData(@Request() req: RequestWithUser) {
    return this.gdprService.exportUserData(req.user.id);
  }

  @Get('gdpr/export/:userId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.USER_READ)
  @ApiOperation({ summary: 'Export all user data by userId (admin / support)' })
  @ApiResponse({ status: 200, description: 'User data exported' })
  async exportUserData(@Param('userId') userId: string) {
    return this.gdprService.exportUserData(userId);
  }

  @Delete('gdpr/delete-account')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete current user account (GDPR Right to Erasure)' })
  @ApiResponse({ status: 200, description: 'Account deleted' })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  async deleteMyAccount(@Request() req: RequestWithUser, @Body() dto: DeleteAccountDto) {
    const valid = await this.authService.verifyUserPassword(req.user.id, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid password');
    }
    return this.gdprService.deleteUserData(req.user.id, dto.reason);
  }

  @Delete('gdpr/delete/:userId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.USER_DELETE)
  @ApiOperation({ summary: 'Delete all user data (GDPR Right to Erasure)' })
  @ApiResponse({ status: 200, description: 'User data deleted' })
  async deleteUserData(
    @Param('userId') userId: string,
    @Body() dto: DeleteUserDataDto,
  ) {
    return this.gdprService.deleteUserData(userId, dto.reason);
  }

  @Post('gdpr/anonymize/:userId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.USER_UPDATE)
  @ApiOperation({ summary: 'Anonymize user data' })
  @ApiResponse({ status: 200, description: 'User data anonymized' })
  async anonymizeUserData(@Param('userId') userId: string) {
    await this.gdprService.anonymizeUserData(userId);
    return { success: true, userId };
  }

  @Post('gdpr/consent')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Record user consent' })
  @ApiResponse({ status: 201, description: 'Consent recorded' })
  async recordConsent(@Body() dto: RecordConsentDto) {
    await this.gdprService.recordConsent(
      dto.userId,
      dto.consentType,
      dto.given,
    );
    return {
      success: true,
      userId: dto.userId,
      consentType: dto.consentType,
      given: dto.given,
      recordedAt: new Date().toISOString(),
    };
  }

  @Get('gdpr/consent/:userId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.USER_READ)
  @ApiOperation({ summary: 'Get consent history for a user' })
  @ApiResponse({ status: 200, description: 'Consent history retrieved' })
  async getConsentHistory(@Param('userId') userId: string) {
    const history = await this.gdprService.getConsentHistory(userId);
    return { userId, history };
  }

  @Get('gdpr/compliance/:brandId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.AUDIT_READ)
  @ApiOperation({ summary: 'Generate GDPR compliance report' })
  @ApiResponse({ status: 200, description: 'Compliance report generated' })
  async getComplianceReport(@Param('brandId') brandId: string) {
    return this.gdprService.generateComplianceReport(brandId);
  }

  @Post('gdpr/retention/schedule')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.SETTINGS_UPDATE)
  @ApiOperation({ summary: 'Schedule data retention cleanup' })
  @ApiResponse({ status: 200, description: 'Retention scheduled' })
  async scheduleDataRetention(@Body() dto: ScheduleDataRetentionDto) {
    return this.gdprService.scheduleDataRetention(dto.days);
  }
}

