import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RBACService } from './services/rbac.service';
import { AuditLogsService, AuditEventType } from './services/audit-logs.service';
import { AuditSearchQuery } from './interfaces/audit.interface';
import { GDPRService } from './services/gdpr.service';
import { RateLimiterService } from './services/rate-limiter.service';
import { JwtRotationService } from './services/jwt-rotation.service';
import { Role, Permission } from './interfaces/rbac.interface';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermissions } from './decorators/require-permissions.decorator';

/**
 * Controller pour la sécurité et conformité
 */
@ApiTags('Security & Compliance')
@Controller('security')
@ApiBearerAuth()
export class SecurityController {
  constructor(
    private readonly rbacService: RBACService,
    private readonly auditLogs: AuditLogsService,
    private readonly gdprService: GDPRService,
    private readonly rateLimiter: RateLimiterService,
    private readonly jwtRotation: JwtRotationService,
  ) {}

  private getQueryValue(value?: string | string[]): string | undefined {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  private parseAuditQuery(
    query: Record<string, string | string[] | undefined>,
  ): AuditSearchQuery {
    const get = (key: string) => this.getQueryValue(query[key]);

    const filters: AuditSearchQuery = {};

    const userId = get('userId');
    if (userId) filters.userId = userId;

    const brandId = get('brandId');
    if (brandId) filters.brandId = brandId;

    const eventType = get('eventType');
    if (eventType && Object.values(AuditEventType).includes(eventType as AuditEventType)) {
      filters.eventType = eventType as AuditEventType;
    }

    const resourceType = get('resourceType');
    if (resourceType) filters.resourceType = resourceType;

    const resourceId = get('resourceId');
    if (resourceId) filters.resourceId = resourceId;

    const success = get('success');
    if (success !== undefined) {
      const normalized = success.toLowerCase();
      if (normalized === 'true' || normalized === '1') {
        filters.success = true;
      } else if (normalized === 'false' || normalized === '0') {
        filters.success = false;
      }
    }

    const startDate = get('startDate');
    if (startDate) {
      const date = new Date(startDate);
      if (!Number.isNaN(date.getTime())) {
        filters.startDate = date;
      }
    }

    const endDate = get('endDate');
    if (endDate) {
      const date = new Date(endDate);
      if (!Number.isNaN(date.getTime())) {
        filters.endDate = date;
      }
    }

    const limit = get('limit');
    if (limit) {
      const parsed = Number(limit);
      if (!Number.isNaN(parsed)) {
        filters.limit = parsed;
      }
    }

    const offset = get('offset');
    if (offset) {
      const parsed = Number(offset);
      if (!Number.isNaN(parsed)) {
        filters.offset = parsed;
      }
    }

    return filters;
  }

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
    @Body() body: { role: Role },
  ) {
    await this.rbacService.assignRole(userId, body.role);
    return { success: true, userId, role: body.role };
  }

  @Get('users/:userId/permissions')
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
  @ApiOperation({ summary: 'Get role statistics' })
  @ApiResponse({ status: 200, description: 'Stats retrieved' })
  async getRoleStats(@Query('brandId') brandId?: string) {
    return this.rbacService.getRoleStats(brandId);
  }

  // ==================== AUDIT LOGS ====================

  @Get('audit/search')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.AUDIT_READ)
  @ApiOperation({ summary: 'Search audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved' })
  async searchAuditLogs(@Query() query: Record<string, string | string[] | undefined>) {
    const filters = this.parseAuditQuery(query);
    if (filters.limit === undefined) {
      filters.limit = 100;
    }
    if (filters.offset === undefined) {
      filters.offset = 0;
    }

    return this.auditLogs.search(filters);
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
    @Query('brandId') brandId?: string,
    @Query('days') days?: string,
  ) {
    return this.auditLogs.getStats(brandId, days ? parseInt(days, 10) : 30);
  }

  @Get('audit/export/csv')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.AUDIT_EXPORT)
  @ApiOperation({ summary: 'Export audit logs to CSV' })
  @ApiResponse({ status: 200, description: 'CSV exported' })
  async exportAuditLogsCSV(@Query() query: Record<string, string | string[] | undefined>) {
    const filters = this.parseAuditQuery(query);
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

  @Get('gdpr/export/:userId')
  @ApiOperation({ summary: 'Export all user data (GDPR Right to Access)' })
  @ApiResponse({ status: 200, description: 'User data exported' })
  async exportUserData(@Param('userId') userId: string) {
    return this.gdprService.exportUserData(userId);
  }

  @Delete('gdpr/delete/:userId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.USER_DELETE)
  @ApiOperation({ summary: 'Delete all user data (GDPR Right to Erasure)' })
  @ApiResponse({ status: 200, description: 'User data deleted' })
  async deleteUserData(
    @Param('userId') userId: string,
    @Body() body: { reason?: string },
  ) {
    return this.gdprService.deleteUserData(userId, body.reason);
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
  @ApiOperation({ summary: 'Record user consent' })
  @ApiResponse({ status: 201, description: 'Consent recorded' })
  async recordConsent(
    @Body() body: { userId: string; consentType: string; given: boolean },
  ) {
    await this.gdprService.recordConsent(
      body.userId,
      body.consentType,
      body.given,
    );
    return { success: true };
  }

  @Get('gdpr/consent/:userId')
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
  async scheduleDataRetention(@Body() body: { days?: number }) {
    return this.gdprService.scheduleDataRetention(body.days);
  }

  // ==================== RATE LIMITING ====================

  @Get('rate-limit/status/:tenantId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.AUDIT_READ)
  @ApiOperation({ summary: 'Get rate limit status for a tenant' })
  @ApiResponse({ status: 200, description: 'Rate limit status retrieved' })
  async getRateLimitStatus(@Param('tenantId') tenantId: string) {
    return this.rateLimiter.getRateLimitStatus(tenantId);
  }

  @Post('rate-limit/reset/:tenantId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.SETTINGS_UPDATE)
  @ApiOperation({ summary: 'Reset rate limit for a tenant' })
  @ApiResponse({ status: 200, description: 'Rate limit reset' })
  async resetRateLimit(@Param('tenantId') tenantId: string) {
    await this.rateLimiter.resetRateLimit(tenantId);
    return { success: true, tenantId };
  }

  // ==================== JWT ROTATION ====================

  @Post('jwt/rotation/plan')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.SETTINGS_UPDATE)
  @ApiOperation({ summary: 'Create JWT rotation plan' })
  @ApiResponse({ status: 201, description: 'Rotation plan created' })
  async createRotationPlan() {
    const plan = await this.jwtRotation.createRotationPlan();
    return {
      success: true,
      plan: {
        rotationStartAt: plan.rotationStartAt,
        gracePeriodEndAt: plan.gracePeriodEndAt,
        rotationCompleteAt: plan.rotationCompleteAt,
        // Don't expose secrets in response
      },
    };
  }

  @Get('jwt/rotation/status')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.AUDIT_READ)
  @ApiOperation({ summary: 'Get current JWT rotation plan status' })
  @ApiResponse({ status: 200, description: 'Rotation status retrieved' })
  async getRotationStatus() {
    const plan = await this.jwtRotation.getRotationPlanStatus();
    if (!plan) {
      return { active: false };
    }
    return {
      active: true,
      rotationStartAt: plan.rotationStartAt,
      gracePeriodEndAt: plan.gracePeriodEndAt,
      rotationCompleteAt: plan.rotationCompleteAt,
      inGracePeriod: new Date() < plan.gracePeriodEndAt,
    };
  }

  @Post('jwt/rotation/complete')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.SETTINGS_UPDATE)
  @ApiOperation({ summary: 'Complete JWT rotation (after grace period)' })
  @ApiResponse({ status: 200, description: 'Rotation completed' })
  async completeRotation() {
    await this.jwtRotation.completeRotation();
    return { success: true };
  }

  @Post('jwt/embed-key/rotate')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.SETTINGS_UPDATE)
  @ApiOperation({ summary: 'Rotate embed key for a brand/shop' })
  @ApiResponse({ status: 200, description: 'Embed key rotated' })
  async rotateEmbedKey(
    @Body() body: { brandId: string; shopDomain?: string },
  ) {
    const result = await this.jwtRotation.rotateEmbedKey(body.brandId, body.shopDomain);
    return {
      success: true,
      oldKeyId: result.oldKeyId,
      newKeyId: result.newKeyId,
      expiresAt: result.expiresAt,
      // Token is returned but should be stored securely by client
    };
  }

  @Post('jwt/embed-key/expire')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.SETTINGS_UPDATE)
  @ApiOperation({ summary: 'Expire/revoke embed keys for a brand' })
  @ApiResponse({ status: 200, description: 'Embed keys expired' })
  async expireEmbedKeys(
    @Body() body: { brandId: string; shopDomain?: string },
  ) {
    const count = await this.jwtRotation.expireEmbedKeys(body.brandId, body.shopDomain);
    return {
      success: true,
      expiredCount: count,
      brandId: body.brandId,
    };
  }
}

