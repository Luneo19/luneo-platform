import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  Headers,
  Res,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiHeader,
  ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AdminService } from './admin.service';
import { BillingService } from '@/modules/billing/billing.service';
import { Roles } from '@/common/guards/roles.guard';
import { PlatformRole } from '@prisma/client';
import { Public } from '@/common/decorators/public.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { AddBlacklistedPromptDto, BulkActionCustomersDto } from './dto/admin.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@Roles(PlatformRole.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly configService: ConfigService,
    private readonly billingService: BillingService,
  ) {}

  // ========================================
  // TENANTS (ORGANIZATIONS) - Platform admin view
  // ========================================

  @Get('tenants')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all tenants (organizations) for platform admin' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'plan', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'List of tenants' })
  async getTenants(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('plan') plan?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.adminService.getTenants({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      plan,
      status,
      sortBy,
      sortOrder,
    });
  }

  @Get('brands/:brandId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get organization detail with full relations' })
  @ApiParam({ name: 'brandId', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Organization detail' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getBrandDetail(@Param('brandId') brandId: string) {
    return this.adminService.getBrandDetail(brandId);
  }

  @Patch('brands/:brandId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update organization details (admin)' })
  @ApiParam({ name: 'brandId', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Organization updated' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async updateBrand(
    @Param('brandId') brandId: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      website?: string;
      industry?: string;
      status?: string;
      plan?: string;
      subscriptionPlan?: string;
      subscriptionStatus?: string;
      maxProducts?: number;
      maxMonthlyGenerations?: number;
      aiCostLimitCents?: number;
      companyName?: string;
      vatNumber?: string;
      address?: string;
      city?: string;
      country?: string;
      phone?: string;
      syncStripe?: boolean;
    },
  ) {
    return this.adminService.updateBrand(brandId, body);
  }

  @Post('brands/:brandId/suspend')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suspend an organization (disable all access)' })
  @ApiParam({ name: 'brandId', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Organization suspended' })
  async suspendBrand(
    @Param('brandId') brandId: string,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.suspendBrand(brandId, reason);
  }

  @Post('brands/:brandId/unsuspend')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unsuspend an organization (restore access)' })
  @ApiParam({ name: 'brandId', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Organization unsuspended' })
  async unsuspendBrand(@Param('brandId') brandId: string) {
    return this.adminService.unsuspendBrand(brandId);
  }

  // ========================================
  // CUSTOMER MANAGEMENT
  // ========================================

  @Get('customers')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all customers with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of customers' })
  async getCustomers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.adminService.getCustomers({ page, limit, search, role, sortBy, sortOrder });
  }

  @Get('customers/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer details by ID' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer details' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getCustomerById(@Param('id') id: string) {
    return this.adminService.getCustomerById(id);
  }

  @Post('customers')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new user (admin)' })
  @ApiResponse({ status: 201, description: 'User created' })
  async createCustomer(
    @Body() body: { email: string; name?: string; role?: string; brandId?: string; password?: string },
  ) {
    return this.adminService.createCustomer(body);
  }

  @Patch('customers/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a user (admin)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated' })
  async updateCustomer(
    @Param('id') id: string,
    @Body() body: { name?: string; role?: string; brandId?: string; isActive?: boolean },
  ) {
    return this.adminService.updateCustomer(id, body);
  }

  @Post('brands')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new organization (admin)' })
  @ApiResponse({ status: 201, description: 'Organization created' })
  async createBrand(
    @Body() body: { name: string; slug: string; userId: string },
  ) {
    return this.adminService.createBrand(body);
  }

  @Post('customers/:id/ban')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ban a user (disable account)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User banned' })
  async banUser(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.banUser(id, reason);
  }

  @Post('customers/:id/unban')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unban a user (restore account)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User unbanned' })
  async unbanUser(@Param('id') id: string) {
    return this.adminService.unbanUser(id);
  }

  // ========================================
  // ANALYTICS
  // ========================================

  @Get('analytics/overview')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get analytics overview (MRR, customers, churn)' })
  @ApiResponse({ status: 200, description: 'Analytics overview' })
  async getAnalyticsOverview() {
    return this.adminService.getAnalyticsOverview();
  }

  @Get('analytics/ar-studio')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get AR Studio usage metrics across all organizations' })
  @ApiQuery({ name: 'period', required: false, description: 'Period in days (default: 30)' })
  @ApiResponse({ status: 200, description: 'AR Studio metrics' })
  async getARStudioMetrics(@Query('period') period?: string) {
    return this.adminService.getARStudioMetrics(parseInt(period || '30', 10));
  }

  @Get('analytics/revenue')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get revenue metrics' })
  @ApiQuery({ name: 'period', required: false, description: 'Period (e.g., 30d, 90d)' })
  @ApiResponse({ status: 200, description: 'Revenue metrics' })
  async getRevenueMetrics(@Query('period') period?: string) {
    return this.adminService.getRevenueMetrics(period);
  }

  @Get('analytics/export')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export data to CSV or PDF' })
  @ApiQuery({ name: 'format', required: true, enum: ['csv', 'pdf'] })
  @ApiQuery({ name: 'type', required: true, enum: ['customers', 'analytics', 'conversations'] })
  @ApiResponse({ status: 200, description: 'Exported file' })
  async exportData(
    @Query('format') format: 'csv' | 'pdf',
    @Query('type') type: 'customers' | 'analytics' | 'conversations',
    @Res() res: Response,
  ) {
    const result = await this.adminService.exportData(format, type);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.send(result.content);
  }

  // ========================================
  // BILLING
  // ========================================

  @Get('billing/overview')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get billing/subscription overview' })
  @ApiResponse({ status: 200, description: 'Billing overview' })
  async getBillingOverview() {
    return this.adminService.getBillingOverview();
  }

  @Post('billing/:subscriptionId/refund')
  @ApiBearerAuth()
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({
    summary: 'Refund a subscription payment',
    description: 'Issues a Stripe refund on the latest paid invoice of the given subscription. Platform admin only.',
  })
  @ApiParam({ name: 'subscriptionId', description: 'Stripe subscription ID (e.g. sub_xxx)' })
  @ApiResponse({ status: 200, description: 'Refund result' })
  @ApiResponse({ status: 400, description: 'Invalid subscription or no paid invoice' })
  async refundSubscription(
    @Param('subscriptionId') subscriptionId: string,
    @Body('reason') reason?: string,
  ) {
    if (!subscriptionId || !subscriptionId.startsWith('sub_')) {
      throw new BadRequestException('Invalid subscription ID format');
    }
    return this.billingService.refundSubscription(subscriptionId, reason);
  }

  @Post('create-admin')
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Create the admin (setup endpoint - secured with secret key)' })
  @ApiHeader({ name: 'X-Setup-Key', description: 'Secret key for admin creation' })
  @ApiResponse({ status: 201, description: 'Admin created successfully' })
  @ApiResponse({ status: 401, description: 'Invalid secret key' })
  async createAdmin(@Headers('x-setup-key') setupKey: string) {
    const nodeEnv = this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV ?? 'development';
    const bootstrapAllowed = this.configService.get<string>('ENABLE_ADMIN_SETUP_ENDPOINT') === 'true';
    const hasActiveAdmin = await this.adminService.hasActiveAdmin();

    // In production, this endpoint must be explicitly enabled and only before first admin bootstrap.
    if (nodeEnv === 'production') {
      if (!bootstrapAllowed || hasActiveAdmin) {
        throw new NotFoundException('Not Found');
      }
    }

    const validKey = this.configService.get<string>('SETUP_SECRET_KEY');
    if (!validKey) {
      throw new UnauthorizedException('SETUP_SECRET_KEY environment variable is not configured');
    }
    const isValid = setupKey &&
      Buffer.byteLength(setupKey) === Buffer.byteLength(validKey) &&
      timingSafeEqual(Buffer.from(setupKey), Buffer.from(validKey));
    if (!isValid) {
      throw new UnauthorizedException('Invalid setup key');
    }
    return this.adminService.createAdminUser();
  }

  @Get('metrics')
  @ApiBearerAuth()
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Get platform metrics' })
  @ApiResponse({ status: 200, description: 'Platform metrics' })
  async getMetrics() {
    return this.adminService.getMetrics();
  }

  @Get('ai/costs')
  @ApiBearerAuth()
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Get AI costs' })
  @ApiQuery({ name: 'period', required: false, description: 'Period (e.g., 30d)' })
  @ApiResponse({ status: 200, description: 'AI costs' })
  async getAICosts(@Query('period') period: string) {
    return this.adminService.getAICosts(period);
  }

  @Get('ai/blacklist')
  @ApiBearerAuth()
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'List all AI blacklisted terms' })
  @ApiResponse({ status: 200, description: 'Blacklisted terms list' })
  async getBlacklistedPrompts() {
    const terms = await this.adminService.getBlacklistedPrompts();
    return { terms };
  }

  @Post('ai/blacklist')
  @ApiBearerAuth()
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Add a term to the AI blacklist' })
  @ApiResponse({ status: 201, description: 'Term added to blacklist' })
  async addBlacklistedPrompt(@Body() body: AddBlacklistedPromptDto) {
    return this.adminService.addBlacklistedPrompt(body.term);
  }

  @Delete('ai/blacklist/:term')
  @ApiBearerAuth()
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Remove a term from the AI blacklist' })
  @ApiParam({ name: 'term', description: 'Term to remove (can be URL-encoded)' })
  @ApiResponse({ status: 200, description: 'Term removed from blacklist' })
  async removeBlacklistedPrompt(@Param('term') term: string) {
    return this.adminService.removeBlacklistedPrompt(decodeURIComponent(term));
  }

  // ========================================
  // SETTINGS
  // ========================================

  @Get('settings')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get platform settings' })
  @ApiResponse({ status: 200, description: 'Platform settings' })
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Put('settings')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update platform settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async updateSettings(@Body() body: UpdateSettingsDto) {
    return this.adminService.updateSettings(body as unknown as Record<string, unknown>);
  }

  @Post('customers/bulk-action')
  @ApiBearerAuth()
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Perform bulk action on customers' })
  @ApiResponse({ status: 200, description: 'Bulk action performed' })
  async bulkActionCustomers(@Body() body: BulkActionCustomersDto) {
    return this.adminService.bulkActionCustomers(body.customerIds, body.action, body.options);
  }

  // ========================================
  // DISCOUNT CODES MANAGEMENT
  // ========================================

  @Get('discounts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all discount codes' })
  @ApiResponse({ status: 200, description: 'Discount codes list' })
  async getDiscounts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isActive') isActive?: string,
  ) {
    return this.adminService.getDiscounts({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Post('discounts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a discount code' })
  @ApiResponse({ status: 201, description: 'Discount code created' })
  async createDiscount(@Body() body: Record<string, unknown>) {
    return this.adminService.createDiscount(body);
  }

  @Put('discounts/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a discount code' })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiResponse({ status: 200, description: 'Discount code updated' })
  async updateDiscount(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.adminService.updateDiscount(id, body);
  }

  @Delete('discounts/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a discount code' })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiResponse({ status: 200, description: 'Discount code deleted' })
  async deleteDiscount(@Param('id') id: string) {
    return this.adminService.deleteDiscount(id);
  }

  // ========================================
  // REFERRAL / COMMISSIONS MANAGEMENT
  // ========================================

  @Get('referrals')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all referrals' })
  @ApiResponse({ status: 200, description: 'Referrals list' })
  async getReferrals(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getReferrals({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
    });
  }

  @Get('commissions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all commissions' })
  @ApiResponse({ status: 200, description: 'Commissions list' })
  async getCommissions(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getCommissions({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
    });
  }

  @Post('commissions/:id/approve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a commission for payout' })
  @ApiParam({ name: 'id', description: 'Commission ID' })
  @ApiResponse({ status: 200, description: 'Commission approved' })
  async approveCommission(@Param('id') id: string) {
    return this.adminService.approveCommission(id);
  }

  @Post('commissions/:id/pay')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark commission as paid' })
  @ApiParam({ name: 'id', description: 'Commission ID' })
  @ApiResponse({ status: 200, description: 'Commission marked as paid' })
  async markCommissionPaid(@Param('id') id: string) {
    return this.adminService.markCommissionPaid(id);
  }

  @Post('commissions/:id/reject')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a commission' })
  @ApiParam({ name: 'id', description: 'Commission ID' })
  @ApiResponse({ status: 200, description: 'Commission rejected' })
  async rejectCommission(@Param('id') id: string) {
    return this.adminService.rejectCommission(id);
  }

  // ========================================
  // SUPPORT - ADMIN TICKET MANAGEMENT
  // ========================================

  @Get('support/tickets')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all support tickets (admin view)' })
  @ApiResponse({ status: 200, description: 'All tickets list' })
  async getAllTickets(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.adminService.getAllTickets({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      assignedTo,
    });
  }

  @Post('support/tickets/:id/assign')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign a ticket to an agent' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Ticket assigned' })
  async assignTicket(@Param('id') id: string, @Body('agentId') agentId: string) {
    return this.adminService.assignTicket(id, agentId);
  }

  @Post('support/tickets/:id/reply')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a staff reply to a ticket' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Reply added' })
  async addAgentReply(
    @Param('id') id: string,
    @Body('agentId') agentId: string,
    @Body('content') content: string,
  ) {
    return this.adminService.addAgentReply(id, agentId, content);
  }

  @Put('support/tickets/:id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ticket status' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateTicketStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('agentId') agentId: string,
  ) {
    return this.adminService.updateTicketStatus(id, status, agentId);
  }

  // ========================================
  // WEBHOOKS MANAGEMENT (Admin)
  // ========================================

  @Get('webhooks')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all webhooks (admin view)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'brandId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Webhooks list' })
  async getWebhooks(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('brandId') brandId?: string,
  ) {
    return this.adminService.getWebhooks({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      brandId,
    });
  }

  @Get('webhooks/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get webhook detail' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook detail' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async getWebhookById(@Param('id') id: string) {
    return this.adminService.getWebhookById(id);
  }

  @Post('webhooks')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a webhook' })
  @ApiResponse({ status: 201, description: 'Webhook created' })
  async createWebhook(
    @Body() body: { brandId: string; name?: string; url: string; events?: string[]; isActive?: boolean },
  ) {
    return this.adminService.createWebhook(body);
  }

  @Patch('webhooks/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a webhook' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook updated' })
  async updateWebhook(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.adminService.updateWebhook(id, body);
  }

  @Delete('webhooks/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a webhook' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook deleted' })
  async deleteWebhook(@Param('id') id: string) {
    return this.adminService.deleteWebhook(id);
  }

  @Post('webhooks/:id/test')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test a webhook' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook test result' })
  async testWebhook(@Param('id') id: string) {
    return this.adminService.testWebhook(id);
  }

  // ========================================
  // EVENTS (Admin)
  // ========================================

  @Get('events')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List platform events' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Events list' })
  async getEvents(
    @Query('days') days?: number,
    @Query('type') type?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getEvents({
      days: days ? Number(days) : undefined,
      type,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  // ========================================
  // TENANT FEATURES (Admin)
  // ========================================

  @Get('tenants/:brandId/features')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tenant features and limits' })
  @ApiParam({ name: 'brandId', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Tenant features' })
  async getTenantFeatures(@Param('brandId') brandId: string) {
    return this.adminService.getTenantFeatures(brandId);
  }

  @Patch('tenants/:brandId/features')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tenant features and limits (PATCH)' })
  @ApiParam({ name: 'brandId', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Tenant features updated' })
  async updateTenantFeatures(
    @Param('brandId') brandId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.adminService.updateTenantFeatures(brandId, body);
  }

  @Post('tenants/:brandId/features')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable/add a feature for a tenant' })
  @ApiParam({ name: 'brandId', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Tenant feature enabled' })
  async addTenantFeature(
    @Param('brandId') brandId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.adminService.updateTenantFeatures(brandId, body);
  }

  @Put('tenants/:brandId/features')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk update tenant features' })
  @ApiParam({ name: 'brandId', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Tenant features updated' })
  async bulkUpdateTenantFeatures(
    @Param('brandId') brandId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.adminService.updateTenantFeatures(brandId, body);
  }

  @Delete('tenants/:brandId/features')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a feature from a tenant' })
  @ApiParam({ name: 'brandId', description: 'Organization ID' })
  @ApiQuery({ name: 'feature', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Tenant feature removed' })
  async removeTenantFeature(
    @Param('brandId') brandId: string,
    @Query('feature') feature: string,
  ) {
    return this.adminService.updateTenantFeatures(brandId, {
      features: { [feature]: false },
    });
  }

  // ========================================
  // ORION (Admin)
  // ========================================

  @Get('orion/overview')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Orion overview dashboard' })
  @ApiResponse({ status: 200, description: 'Orion overview' })
  async getOrionOverview() {
    return this.adminService.getOrionOverview();
  }

  @Get('orion/insights')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List Orion insights' })
  async getOrionInsights(@Query('limit') limit?: number, @Query('isRead') isRead?: string) {
    return this.adminService.getOrionInsights({
      limit: limit ? Number(limit) : undefined,
      isRead: isRead == null ? undefined : isRead === 'true',
    });
  }

  @Get('orion/actions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List Orion actions' })
  async getOrionActions(@Query('limit') limit?: number, @Query('status') status?: string) {
    return this.adminService.getOrionActions({
      limit: limit ? Number(limit) : undefined,
      status,
    });
  }

  @Post('orion/actions/:id/execute')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Execute Orion action' })
  async executeOrionAction(@Param('id') id: string) {
    return this.adminService.executeOrionAction(id);
  }

  @Get('orion/activity-feed')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List Orion activity feed' })
  async getOrionActivityFeed(@Query('limit') limit?: number) {
    return this.adminService.getOrionActivityFeed(limit ? Number(limit) : undefined);
  }

  @Get('orion/metrics/kpis')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Orion KPI metrics' })
  @ApiResponse({ status: 200, description: 'Orion KPI metrics' })
  async getOrionKpis() {
    return this.adminService.getOrionKpis();
  }

  @Get('orion/revenue/overview')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Orion revenue overview' })
  async getOrionRevenueOverview() {
    return this.adminService.getOrionRevenueOverview();
  }

  @Get('orion/revenue/leads')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Orion leads metrics' })
  async getOrionRevenueLeads() {
    return this.adminService.getOrionRevenueLeads();
  }

  @Get('orion/revenue/upsell')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Orion upsell metrics' })
  async getOrionRevenueUpsell() {
    return this.adminService.getOrionRevenueUpsell();
  }

  @Get('orion/retention/dashboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Orion retention dashboard' })
  async getOrionRetentionDashboard() {
    return this.adminService.getOrionRetentionDashboard();
  }

  @Get('orion/retention/at-risk')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get at-risk users for Orion retention' })
  async getOrionAtRisk(@Query('limit') limit?: number) {
    return this.adminService.getOrionAtRiskUsers(limit ? Number(limit) : undefined);
  }

  @Get('orion/retention/health/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Orion retention health score for a user' })
  async getOrionRetentionHealth(@Param('id') id: string) {
    return this.adminService.getOrionRetentionHealth(id);
  }

  @Post('orion/retention/calculate/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recalculate Orion retention health score for a user' })
  async calculateOrionRetentionHealth(@Param('id') id: string) {
    return this.adminService.calculateOrionRetentionHealth(id);
  }

  @Get('orion/retention/win-back')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List Orion retention win-back campaigns' })
  async getOrionRetentionWinBackCampaigns() {
    return this.adminService.getOrionRetentionWinBackCampaigns();
  }

  @Post('orion/retention/win-back/trigger')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trigger Orion retention win-back campaigns' })
  async triggerOrionRetentionWinBack(@Body('userIds') userIds: string[]) {
    return this.adminService.triggerOrionRetentionWinBack(userIds);
  }

  @Get('orion/agents')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List agents for Orion admin' })
  async getOrionAgents(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getOrionAgents({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      status,
    });
  }

  @Post('orion/seed')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seed default ORION agents' })
  async seedOrionAgents() {
    return this.adminService.seedOrionAgents();
  }

  @Get('orion/segments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List Orion segments' })
  async getOrionSegments() {
    return this.adminService.getOrionSegments();
  }

  @Post('orion/segments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Orion segment' })
  async createOrionSegment(@Body() body: Record<string, unknown>) {
    return this.adminService.createOrionSegment(body);
  }

  @Delete('orion/segments/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete Orion segment' })
  async deleteOrionSegment(@Param('id') id: string) {
    return this.adminService.deleteOrionSegment(id);
  }

  @Get('orion/experiments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List Orion experiments' })
  async getOrionExperiments() {
    return this.adminService.getOrionExperiments();
  }

  @Post('orion/experiments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Orion experiment' })
  async createOrionExperiment(@Body() body: Record<string, unknown>) {
    return this.adminService.createOrionExperiment(body);
  }

  @Get('orion/agents/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Orion agent details' })
  async getOrionAgent(@Param('id') id: string) {
    return this.adminService.getOrionAgent(id);
  }

  @Patch('orion/agents/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update Orion agent' })
  async updateOrionAgent(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.adminService.updateOrionAgent(id, body);
  }

  @Get('orion/quick-wins/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Orion quick wins status' })
  async getOrionQuickWinsStatus() {
    return this.adminService.getOrionQuickWinsStatus();
  }

  @Post('orion/quick-wins/welcome-setup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Setup Orion welcome communication quick win' })
  async setupOrionWelcomeQuickWin() {
    return this.adminService.setupOrionWelcomeQuickWin();
  }

  @Get('orion/quick-wins/low-credits')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get low credits organizations/users for Orion quick win' })
  async getOrionLowCreditsQuickWin() {
    return this.adminService.getOrionLowCreditsQuickWin();
  }

  @Get('orion/quick-wins/inactive')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get inactive users for Orion quick win' })
  async getOrionInactiveQuickWin(@Query('days') days?: number) {
    return this.adminService.getOrionInactiveQuickWin(days ? Number(days) : undefined);
  }

  @Get('orion/quick-wins/trial-ending')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get organizations close to trial ending' })
  async getOrionTrialEndingQuickWin() {
    return this.adminService.getOrionTrialEndingQuickWin();
  }

  @Get('orion/communications/templates')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List Orion communication templates' })
  async getOrionCommunicationTemplates() {
    return this.adminService.getOrionCommunicationTemplates();
  }

  @Post('orion/communications/templates')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Orion communication template' })
  async createOrionCommunicationTemplate(@Body() body: Record<string, unknown>) {
    return this.adminService.createOrionCommunicationTemplate(body);
  }

  @Get('orion/communications/templates/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Orion communication template' })
  async getOrionCommunicationTemplate(@Param('id') id: string) {
    return this.adminService.getOrionCommunicationTemplate(id);
  }

  @Put('orion/communications/templates/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update Orion communication template' })
  async updateOrionCommunicationTemplate(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.adminService.updateOrionCommunicationTemplate(id, body);
  }

  @Delete('orion/communications/templates/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete Orion communication template' })
  async deleteOrionCommunicationTemplate(@Param('id') id: string) {
    return this.adminService.deleteOrionCommunicationTemplate(id);
  }

  @Get('orion/communications/logs')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Orion communications logs' })
  async getOrionCommunicationLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getOrionCommunicationLogs({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('orion/communications/stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Orion communications stats' })
  async getOrionCommunicationStats() {
    return this.adminService.getOrionCommunicationStats();
  }

  @Get('orion/automations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List Orion automations' })
  async getOrionAutomations() {
    return this.adminService.getOrionAutomations();
  }

  @Post('orion/automations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Orion automation' })
  async createOrionAutomation(@Body() body: Record<string, unknown>) {
    return this.adminService.createOrionAutomation(body);
  }

  @Get('orion/automations/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Orion automation' })
  async getOrionAutomation(@Param('id') id: string) {
    return this.adminService.getOrionAutomation(id);
  }

  @Put('orion/automations/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update Orion automation' })
  async updateOrionAutomation(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.adminService.updateOrionAutomation(id, body);
  }

  @Delete('orion/automations/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete Orion automation' })
  async deleteOrionAutomation(@Param('id') id: string) {
    return this.adminService.deleteOrionAutomation(id);
  }

  @Get('orion/analytics/dashboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Orion analytics dashboard' })
  async getOrionAnalyticsDashboard() {
    return this.adminService.getOrionAnalyticsDashboard();
  }

  @Get('orion/audit-log')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Orion audit log' })
  async getOrionAuditLog(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminService.getOrionAuditLog({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      action,
      userId,
      dateFrom,
      dateTo,
    });
  }

  @Get('orion/notifications')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List Orion notifications' })
  async getOrionNotifications(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('type') type?: string,
    @Query('read') read?: string,
  ) {
    return this.adminService.getOrionNotifications({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      type,
      read: read != null ? read === 'true' : undefined,
    });
  }

  @Get('orion/notifications/count')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Orion unread notifications count' })
  async getOrionNotificationsCount() {
    return this.adminService.getOrionNotificationsCount();
  }

  @Put('orion/notifications/:id/read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark Orion notification as read' })
  async markOrionNotificationRead(@Param('id') id: string) {
    return this.adminService.markOrionNotificationRead(id);
  }

  @Put('orion/notifications/read-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all Orion notifications as read' })
  async markAllOrionNotificationsRead() {
    return this.adminService.markAllOrionNotificationsRead();
  }

  @Get('orion/prometheus/stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Prometheus admin stats' })
  async getOrionPrometheusStats() {
    return this.adminService.getOrionPrometheusStats();
  }

  @Get('orion/prometheus/review-queue')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List Prometheus review queue' })
  async getOrionPrometheusReviewQueue(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getOrionPrometheusReviewQueue({
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('orion/zeus/dashboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Zeus dashboard' })
  async getOrionZeusDashboard() {
    return this.adminService.getOrionZeusDashboard();
  }

  @Get('orion/zeus/alerts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Zeus alerts' })
  async getOrionZeusAlerts() {
    return this.adminService.getOrionZeusAlerts();
  }

  @Get('orion/zeus/decisions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Zeus decisions' })
  async getOrionZeusDecisions() {
    return this.adminService.getOrionZeusDecisions();
  }

  @Post('orion/zeus/override/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Override Zeus decision' })
  async overrideOrionZeusDecision(
    @Param('id') id: string,
    @Body() body?: { approved?: boolean },
  ) {
    return this.adminService.overrideOrionZeusDecision(id, body?.approved !== false);
  }

  @Get('orion/athena/dashboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Athena dashboard' })
  async getOrionAthenaDashboard() {
    return this.adminService.getOrionAthenaDashboard();
  }

  @Get('orion/athena/distribution')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Athena distribution' })
  async getOrionAthenaDistribution() {
    return this.adminService.getOrionAthenaDistribution();
  }

  @Get('orion/athena/customer/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Athena customer health' })
  async getOrionAthenaCustomer(@Param('id') id: string) {
    return this.adminService.getOrionAthenaCustomerHealth(id);
  }

  @Post('orion/athena/calculate/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculate Athena customer health' })
  async calculateOrionAthenaCustomer(@Param('id') id: string) {
    return this.adminService.calculateOrionAthenaHealth(id);
  }

  @Post('orion/athena/insights/generate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate Athena insights' })
  async generateOrionAthenaInsights() {
    return this.adminService.generateOrionAthenaInsights();
  }

  @Get('orion/apollo/dashboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Apollo dashboard' })
  async getOrionApolloDashboard() {
    return this.adminService.getOrionApolloDashboard();
  }

  @Get('orion/apollo/services')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Apollo services status' })
  async getOrionApolloServices() {
    return this.adminService.getOrionApolloServices();
  }

  @Get('orion/apollo/incidents')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Apollo incidents' })
  async getOrionApolloIncidents(@Query('status') status?: string) {
    return this.adminService.getOrionApolloIncidents(status);
  }

  @Get('orion/apollo/metrics')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Apollo metrics' })
  async getOrionApolloMetrics(@Query('hours') hours?: number) {
    return this.adminService.getOrionApolloMetrics(hours ? Number(hours) : undefined);
  }

  @Get('orion/artemis/dashboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Artemis dashboard' })
  async getOrionArtemisDashboard() {
    return this.adminService.getOrionArtemisDashboard();
  }

  @Get('orion/artemis/threats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Artemis threats' })
  async getOrionArtemisThreats() {
    return this.adminService.getOrionArtemisThreats();
  }

  @Post('orion/artemis/threats/:id/resolve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolve Artemis threat' })
  async resolveOrionArtemisThreat(@Param('id') id: string) {
    return this.adminService.resolveOrionArtemisThreat(id);
  }

  @Get('orion/artemis/blocked-ips')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List Artemis blocked IPs' })
  async getOrionArtemisBlockedIps() {
    return this.adminService.getOrionArtemisBlockedIps();
  }

  @Post('orion/artemis/block-ip')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Block IP in Artemis' })
  async blockOrionArtemisIp(@Body() body: { ipAddress: string; reason: string; expiresAt?: string }) {
    return this.adminService.blockOrionArtemisIp(body);
  }

  @Delete('orion/artemis/blocked-ips/:ipAddress')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unblock IP in Artemis' })
  async unblockOrionArtemisIp(@Param('ipAddress') ipAddress: string) {
    return this.adminService.unblockOrionArtemisIp(ipAddress);
  }

  @Get('orion/artemis/fraud-checks')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List Artemis fraud checks' })
  async getOrionArtemisFraudChecks() {
    return this.adminService.getOrionArtemisFraudChecks();
  }

  @Get('orion/hermes/dashboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Hermes dashboard' })
  async getOrionHermesDashboard() {
    return this.adminService.getOrionHermesDashboard();
  }

  @Get('orion/hermes/pending')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List Hermes pending actions' })
  async getOrionHermesPending() {
    return this.adminService.getOrionHermesPending();
  }

  @Get('orion/hermes/campaigns')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List Hermes campaigns' })
  async getOrionHermesCampaigns() {
    return this.adminService.getOrionHermesCampaigns();
  }

  @Get('orion/hermes/stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Hermes stats' })
  async getOrionHermesStats() {
    return this.adminService.getOrionHermesStats();
  }

  @Get('orion/hades/dashboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Hades dashboard' })
  async getOrionHadesDashboard() {
    return this.adminService.getOrionHadesDashboard();
  }

  @Get('orion/hades/at-risk')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List Hades at-risk accounts' })
  async getOrionHadesAtRisk() {
    return this.adminService.getOrionHadesAtRisk();
  }

  @Get('orion/hades/win-back')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List Hades win-back campaigns' })
  async getOrionHadesWinBack() {
    return this.adminService.getOrionHadesWinBack();
  }

  @Get('orion/hades/mrr-at-risk')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Hades MRR at risk' })
  async getOrionHadesMrrAtRisk() {
    return this.adminService.getOrionHadesMrrAtRisk();
  }

  @Get('orion/hades/actions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List Hades actions' })
  async getOrionHadesActions() {
    return this.adminService.getOrionHadesActions();
  }

  @Post('orion/prometheus/review-queue/:id/approve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve Prometheus generated response' })
  async approveOrionPrometheusResponse(
    @Param('id') id: string,
    @Body() body?: { notes?: string; editedContent?: string },
  ) {
    return this.adminService.approveOrionPrometheusResponse(id, body);
  }

  @Post('orion/prometheus/review-queue/:id/reject')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject Prometheus generated response' })
  async rejectOrionPrometheusResponse(@Param('id') id: string, @Body() body?: { notes?: string }) {
    return this.adminService.rejectOrionPrometheusResponse(id, body);
  }

  @Post('orion/prometheus/review-queue/bulk-approve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk approve Prometheus generated responses' })
  async bulkApproveOrionPrometheusResponses(@Body('responseIds') responseIds: string[]) {
    return this.adminService.bulkApproveOrionPrometheusResponses(responseIds);
  }

  @Post('orion/prometheus/tickets/:ticketId/analyze')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Analyze ticket with Prometheus assistant' })
  async analyzeOrionPrometheusTicket(@Param('ticketId') ticketId: string) {
    return this.adminService.analyzeOrionPrometheusTicket(ticketId);
  }

  @Post('orion/prometheus/tickets/:ticketId/generate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate ticket response with Prometheus assistant' })
  async generateOrionPrometheusTicketResponse(@Param('ticketId') ticketId: string) {
    return this.adminService.generateOrionPrometheusTicketResponse(ticketId);
  }

  // ========================================
  // MARKETING CAMPAIGNS (Admin)
  // ========================================

  @Get('marketing/campaigns')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List marketing campaigns' })
  @ApiResponse({ status: 200, description: 'Campaigns list' })
  async getMarketingCampaigns() {
    return this.adminService.getMarketingCampaigns();
  }

  @Post('marketing/campaigns')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a marketing campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created' })
  async createMarketingCampaign(@Body() body: Record<string, unknown>) {
    return this.adminService.createMarketingCampaign(body);
  }

  // ========================================
  // MARKETING AUTOMATIONS (Admin)
  // ========================================

  @Get('marketing/automations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List marketing automations' })
  @ApiResponse({ status: 200, description: 'Automations list' })
  async getMarketingAutomations() {
    return this.adminService.getMarketingAutomations();
  }

  @Post('marketing/automations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a marketing automation' })
  @ApiResponse({ status: 201, description: 'Automation created' })
  async createMarketingAutomation(@Body() body: Record<string, unknown>) {
    return this.adminService.createMarketingAutomation(body);
  }

  @Get('marketing/automations/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get marketing automation' })
  async getMarketingAutomation(@Param('id') id: string) {
    return this.adminService.getMarketingAutomation(id);
  }

  @Put('marketing/automations/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update marketing automation' })
  async updateMarketingAutomation(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.adminService.updateMarketingAutomation(id, body);
  }

  @Delete('marketing/automations/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete marketing automation' })
  async deleteMarketingAutomation(@Param('id') id: string) {
    return this.adminService.deleteMarketingAutomation(id);
  }

  @Post('marketing/automations/test')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test a marketing automation' })
  @ApiResponse({ status: 200, description: 'Automation test result' })
  async testMarketingAutomation(@Body() body: Record<string, unknown>) {
    return this.adminService.testMarketingAutomation(body);
  }

  // ========================================
  // MARKETING COMMUNICATIONS (Admin)
  // ========================================

  @Get('marketing/communications/stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get marketing communications stats' })
  async getMarketingCommunicationStats() {
    return this.adminService.getOrionCommunicationStats();
  }

  @Get('marketing/communications/logs')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get marketing communications logs' })
  async getMarketingCommunicationLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getOrionCommunicationLogs({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('marketing/communications/templates')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List marketing communication templates' })
  async getMarketingCommunicationTemplates() {
    return this.adminService.getOrionCommunicationTemplates();
  }

  @Post('marketing/communications/templates')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create marketing communication template' })
  async createMarketingCommunicationTemplate(@Body() body: Record<string, unknown>) {
    return this.adminService.createOrionCommunicationTemplate(body);
  }

  @Get('marketing/communications/templates/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get marketing communication template' })
  async getMarketingCommunicationTemplate(@Param('id') id: string) {
    return this.adminService.getOrionCommunicationTemplate(id);
  }

  @Put('marketing/communications/templates/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update marketing communication template' })
  async updateMarketingCommunicationTemplate(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.adminService.updateOrionCommunicationTemplate(id, body);
  }

  @Delete('marketing/communications/templates/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete marketing communication template' })
  async deleteMarketingCommunicationTemplate(@Param('id') id: string) {
    return this.adminService.deleteOrionCommunicationTemplate(id);
  }

  // ========================================
  // INVOICES (Admin)
  // ========================================

  @Get('invoices')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all invoices across all organizations with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'brandId', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'All invoices (paginated).' })
  async getAllInvoices(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('brandId') brandId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.adminService.getAllInvoices({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      status,
      brandId,
      sortBy,
      sortOrder,
    });
  }

  // ========================================
  // PLAN CHANGE HISTORY (Admin)
  // ========================================

  @Get('plan-history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get plan change history across all organizations' })
  @ApiQuery({ name: 'brandId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Plan change history' })
  async getPlanChangeHistory(
    @Query('brandId') brandId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getPlanChangeHistory({
      brandId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  // ========================================
  // UPDATE CUSTOMER EMAIL (Admin)
  // ========================================

  @Patch('customers/:id/email')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update customer email (admin)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Email updated' })
  @ApiResponse({ status: 400, description: 'Invalid email or duplicate' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateCustomerEmail(
    @Param('id') id: string,
    @Body('email') email: string,
  ) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    return this.adminService.updateCustomerEmail(id, email);
  }

  // ========================================
  // GLOBAL AGENTS LIST (Admin)
  // ========================================

  @Get('designs')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all agents across all organizations' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'brandId', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'All agents (paginated)' })
  async getAllDesigns(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('brandId') brandId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.adminService.getAllDesigns({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      brandId,
      sortBy,
      sortOrder,
    });
  }

  // ========================================
  // PCE (Production Commerce Engine) - Admin
  // ========================================

  @Get('pce/overview')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get PCE overview for admin' })
  @ApiResponse({ status: 200, description: 'PCE overview metrics' })
  async getPCEOverview() {
    return this.adminService.getPCEOverview();
  }

  @Get('pce/pipelines')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all pipelines across all organizations' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Pipelines list' })
  async getPCEPipelines(
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.adminService.getPCEPipelines({ status, limit: limit ?? 50, offset: offset ?? 0 });
  }

  @Get('pce/production-orders')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all production orders for admin' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Production orders list' })
  async getPCEProductionOrders(
    @Query('status') status?: string,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getPCEProductionOrders({ status, limit: limit ?? 50 });
  }

  @Get('pce/returns')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all returns for admin' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns list' })
  async getPCEReturns(
    @Query('status') status?: string,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getPCEReturns({ status, limit: limit ?? 50 });
  }

  @Get('pce/queue-health')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get PCE queue health (counts by status)' })
  @ApiResponse({ status: 200, description: 'Queue health' })
  async getPCEQueueHealth() {
    return this.adminService.getPCEQueueHealth();
  }

  // ========================================
  // ADMIN BILLING - Offer free subscriptions
  // ========================================

  @Post('billing/offer-subscription')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Offer a free subscription to an organization for a given duration' })
  @ApiResponse({ status: 200, description: 'Subscription offered' })
  async offerSubscription(
    @Body() body: { brandId: string; plan: string; durationMonths: number; reason?: string },
  ) {
    if (!body.brandId || !body.plan || !body.durationMonths) {
      throw new BadRequestException('brandId, plan, and durationMonths are required');
    }
    return this.adminService.offerFreeSubscription(
      body.brandId,
      body.plan,
      body.durationMonths,
      body.reason,
    );
  }
}
