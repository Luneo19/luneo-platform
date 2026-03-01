import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlatformRole } from '@prisma/client';
import { RequestWithUser } from '@/common/types/user.types';
import { RBACService } from './services/rbac.service';
import { AuditLogsService, AuditEventType } from './services/audit-logs.service';
import { Role, Permission } from './interfaces/rbac.interface';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermissions } from './decorators/require-permissions.decorator';
import { AssignRoleDto } from './dto/assign-role.dto';
import { ExportAuditLogsDto } from './dto/export-audit-logs.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { BrandOwnershipGuard } from '@/common/guards/brand-ownership.guard';
import { AuthService } from '@/modules/auth/auth.service';
import { EnterpriseReadinessService } from './enterprise-readiness.service';

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
    private readonly authService: AuthService,
    private readonly enterpriseReadinessService: EnterpriseReadinessService,
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
  async getRoleStats(@Request() req: RequestWithUser, @Query('organizationId') queryBrandId?: string) {
    // SECURITY: Only PLATFORM_ADMIN can query arbitrary organizationId; others are scoped to their brand
    const organizationId =
      req.user?.role === PlatformRole.ADMIN ? queryBrandId : req.user?.organizationId ?? undefined;
    return this.rbacService.getRoleStats(organizationId);
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
    @Query('organizationId') queryBrandId?: string,
    @Query('eventType') eventType?: AuditEventType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const organizationId =
      req.user?.role === PlatformRole.ADMIN ? queryBrandId : req.user?.organizationId ?? undefined;
    return this.auditLogs.search({
      userId,
      organizationId,
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
    @Query('organizationId') queryBrandId?: string,
    @Query('days') days?: string,
  ) {
    const organizationId =
      req.user?.role === PlatformRole.ADMIN ? queryBrandId : req.user?.organizationId ?? undefined;
    return this.auditLogs.getStats(organizationId, days ? parseInt(days, 10) : 30);
  }

  @Get('audit/export/csv')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.AUDIT_EXPORT)
  @ApiOperation({ summary: 'Export audit logs to CSV' })
  @ApiResponse({ status: 200, description: 'CSV exported' })
  async exportAuditLogsCSV(@Request() req: RequestWithUser, @Query() dto: ExportAuditLogsDto) {
    const organizationId =
      req.user?.role === PlatformRole.ADMIN ? dto.organizationId : req.user?.organizationId ?? undefined;
    const filters = {
      userId: dto.userId,
      organizationId,
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

  // ==================== ENTERPRISE READINESS ====================

  @Get('enterprise/readiness')
  @ApiOperation({ summary: 'Get enterprise readiness status for current organization' })
  @ApiResponse({ status: 200, description: 'Enterprise readiness status' })
  async getEnterpriseReadiness(@Request() req: RequestWithUser) {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new UnauthorizedException('Organization context required');
    }
    return this.enterpriseReadinessService.getStatus(organizationId);
  }

  @Post('enterprise/scim')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.SETTINGS_UPDATE)
  @ApiOperation({ summary: 'Configure SCIM provisioning controls' })
  async configureScim(
    @Request() req: RequestWithUser,
    @Body() body: { enabled: boolean; endpoint?: string; tokenMasked?: string },
  ) {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new UnauthorizedException('Organization context required');
    }
    return this.enterpriseReadinessService.configureScim(organizationId, body);
  }

  @Post('enterprise/policy')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.SETTINGS_UPDATE)
  @ApiOperation({ summary: 'Configure policy-as-code controls' })
  async configurePolicy(
    @Request() req: RequestWithUser,
    @Body() body: { enabled: boolean; policyBundleVersion?: string },
  ) {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new UnauthorizedException('Organization context required');
    }
    return this.enterpriseReadinessService.configurePolicyAsCode(
      organizationId,
      body,
    );
  }

  @Post('enterprise/byok')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.SETTINGS_UPDATE)
  @ApiOperation({ summary: 'Configure BYOK controls' })
  async configureByok(
    @Request() req: RequestWithUser,
    @Body()
    body: { enabled: boolean; kmsProvider?: 'aws-kms' | 'gcp-kms' | 'azure-key-vault' },
  ) {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new UnauthorizedException('Organization context required');
    }
    return this.enterpriseReadinessService.configureByok(organizationId, body);
  }

  @Post('enterprise/isolation')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.SETTINGS_UPDATE)
  @ApiOperation({ summary: 'Configure environment isolation controls' })
  async configureIsolation(
    @Request() req: RequestWithUser,
    @Body() body: { enabled: boolean; mode?: 'shared' | 'dedicated' },
  ) {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new UnauthorizedException('Organization context required');
    }
    return this.enterpriseReadinessService.configureEnvironmentIsolation(
      organizationId,
      body,
    );
  }

}

