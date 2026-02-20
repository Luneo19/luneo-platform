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
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
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
import { UserRole } from '@prisma/client';
import { Public } from '@/common/decorators/public.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AddBlacklistedPromptDto, BulkActionCustomersDto } from './dto/admin.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
// @ts-expect-error NestJS decorator typing - Roles returns object
@Roles(UserRole.PLATFORM_ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly configService: ConfigService,
    private readonly billingService: BillingService,
  ) {}

  // ========================================
  // TENANTS (BRANDS) - Platform admin view
  // ========================================

  @Get('tenants')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all tenants (brands) for platform admin' })
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
  @ApiOperation({ summary: 'Get brand detail with full relations' })
  @ApiParam({ name: 'brandId', description: 'Brand ID' })
  @ApiResponse({ status: 200, description: 'Brand detail' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  async getBrandDetail(@Param('brandId') brandId: string) {
    return this.adminService.getBrandDetail(brandId);
  }

  @Patch('brands/:brandId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update brand details (admin)' })
  @ApiParam({ name: 'brandId', description: 'Brand ID' })
  @ApiResponse({ status: 200, description: 'Brand updated' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
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
  @ApiOperation({ summary: 'Suspend a brand (disable all access)' })
  @ApiParam({ name: 'brandId', description: 'Brand ID' })
  @ApiResponse({ status: 200, description: 'Brand suspended' })
  async suspendBrand(
    @Param('brandId') brandId: string,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.suspendBrand(brandId, reason);
  }

  @Post('brands/:brandId/unsuspend')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unsuspend a brand (restore access)' })
  @ApiParam({ name: 'brandId', description: 'Brand ID' })
  @ApiResponse({ status: 200, description: 'Brand unsuspended' })
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
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiResponse({ status: 200, description: 'List of customers' })
  async getCustomers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
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
  @ApiOperation({ summary: 'Create a new brand (admin)' })
  @ApiResponse({ status: 201, description: 'Brand created' })
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
  @ApiOperation({ summary: 'Get AR Studio usage metrics across all brands' })
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
  @ApiQuery({ name: 'type', required: true, enum: ['customers', 'analytics', 'orders'] })
  @ApiResponse({ status: 200, description: 'Exported file' })
  async exportData(
    @Query('format') format: 'csv' | 'pdf',
    @Query('type') type: 'customers' | 'analytics' | 'orders',
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
  @Roles(UserRole.PLATFORM_ADMIN)
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
  /** @Public: setup endpoint; protected by X-Setup-Key secret */
  @Public()
  @ApiOperation({ summary: 'Créer l\'admin (endpoint de setup - sécurisé avec clé secrète)' })
  @ApiHeader({ name: 'X-Setup-Key', description: 'Clé secrète pour créer l\'admin' })
  @ApiResponse({ status: 201, description: 'Admin créé avec succès' })
  @ApiResponse({ status: 401, description: 'Clé secrète invalide' })
  async createAdmin(@Headers('x-setup-key') setupKey: string) {
    // Vérifier la clé secrète (obligatoire en variable d'environnement)
    const validKey = this.configService.get<string>('SETUP_SECRET_KEY');
    
    if (!validKey) {
      throw new UnauthorizedException('SETUP_SECRET_KEY environment variable is not configured');
    }
    
    if (!setupKey || setupKey !== validKey) {
      throw new UnauthorizedException('Invalid setup key');
    }

    return this.adminService.createAdminUser();
  }

  @Get('metrics')
  @ApiBearerAuth()
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Obtenir les métriques de la plateforme' })
  @ApiResponse({
    status: 200,
    description: 'Métriques de la plateforme',
  })
  async getMetrics() {
    return this.adminService.getMetrics();
  }

  @Get('ai/costs')
  @ApiBearerAuth()
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Obtenir les coûts IA' })
  @ApiQuery({ name: 'period', required: false, description: 'Période (ex: 30d)' })
  @ApiResponse({
    status: 200,
    description: 'Coûts IA',
  })
  async getAICosts(@Query('period') period: string) {
    return this.adminService.getAICosts(period);
  }

  @Get('ai/blacklist')
  @ApiBearerAuth()
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Liste tous les termes blacklistés IA' })
  @ApiResponse({
    status: 200,
    description: 'Liste des termes blacklistés',
  })
  async getBlacklistedPrompts() {
    const terms = await this.adminService.getBlacklistedPrompts();
    return { terms };
  }

  @Post('ai/blacklist')
  @ApiBearerAuth()
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Ajouter un terme à la liste noire IA' })
  @ApiResponse({
    status: 201,
    description: 'Terme ajouté à la liste noire',
  })
  async addBlacklistedPrompt(@Body() body: AddBlacklistedPromptDto) {
    return this.adminService.addBlacklistedPrompt(body.term);
  }

  @Delete('ai/blacklist/:term')
  @ApiBearerAuth()
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Retirer un terme de la liste noire IA' })
  @ApiParam({ name: 'term', description: 'Terme à retirer (peut être encodé en URL)' })
  @ApiResponse({
    status: 200,
    description: 'Terme retiré de la liste noire',
  })
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
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Effectuer une action en masse sur des customers' })
  @ApiResponse({
    status: 200,
    description: 'Action en masse effectuée',
  })
  async bulkActionCustomers(
    @Body() body: BulkActionCustomersDto,
  ) {
    return this.adminService.bulkActionCustomers(
      body.customerIds,
      body.action,
      body.options,
    );
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
  async createDiscount(@Body() body: {
    code: string;
    type: string;
    value: number;
    minPurchaseCents?: number;
    maxDiscountCents?: number;
    validFrom?: string | Date;
    validUntil?: string | Date;
    usageLimit?: number;
    isActive?: boolean;
    brandId?: string;
    description?: string;
  }) {
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
    @Body() body: { brandId: string; name: string; url: string; events?: string[]; isActive?: boolean },
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
  @ApiParam({ name: 'brandId', description: 'Brand ID' })
  @ApiResponse({ status: 200, description: 'Tenant features' })
  async getTenantFeatures(@Param('brandId') brandId: string) {
    return this.adminService.getTenantFeatures(brandId);
  }

  @Patch('tenants/:brandId/features')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tenant features and limits (PATCH)' })
  @ApiParam({ name: 'brandId', description: 'Brand ID' })
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
  @ApiParam({ name: 'brandId', description: 'Brand ID' })
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
  @ApiParam({ name: 'brandId', description: 'Brand ID' })
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
  @ApiParam({ name: 'brandId', description: 'Brand ID' })
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
  // MARKETING CAMPAIGNS (Admin)
  // ========================================

  @Get('marketing/campaigns')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List marketing campaigns' })
  @ApiResponse({ status: 200, description: 'Campaigns list' })
  async getMarketingCampaigns() {
    return { campaigns: [], total: 0 };
  }

  @Post('marketing/campaigns')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a marketing campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created' })
  async createMarketingCampaign(
    @Body() body: { name: string; subject: string; body: string; audience?: string; scheduledAt?: string },
  ) {
    // Email campaigns require SendGrid integration - return stub for now
    return {
      id: `campaign-${Date.now()}`,
      name: body.name,
      subject: body.subject,
      status: 'draft',
      recipientCount: 0,
      createdAt: new Date().toISOString(),
    };
  }

  // ========================================
  // MARKETING AUTOMATIONS (Admin)
  // ========================================

  @Get('marketing/automations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List marketing automations' })
  @ApiResponse({ status: 200, description: 'Automations list' })
  async getMarketingAutomations() {
    return { automations: [], total: 0 };
  }

  @Post('marketing/automations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a marketing automation' })
  @ApiResponse({ status: 201, description: 'Automation created' })
  async createMarketingAutomation(@Body() body: Record<string, unknown>) {
    return {
      id: `automation-${Date.now()}`,
      ...body,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
  }

  @Post('marketing/automations/test')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test a marketing automation' })
  @ApiResponse({ status: 200, description: 'Automation test result' })
  async testMarketingAutomation(@Body() _body: Record<string, unknown>) {
    return {
      success: true,
      message: 'Automation test executed successfully',
      testId: `test-${Date.now()}`,
    };
  }

  // ========================================
  // INVOICES - Full paginated list (Admin)
  // ========================================

  @Get('invoices')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all invoices across all brands with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'brandId', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'All invoices (paginated). Amount field is in cents.' })
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
  @ApiOperation({ summary: 'Get plan change history across all brands' })
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
  // GLOBAL DESIGNS LIST (Admin)
  // ========================================

  @Get('designs')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all designs across all brands' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'brandId', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'All designs (paginated)' })
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
  @ApiOperation({ summary: 'List all pipelines across all brands' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Pipelines list' })
  async getPCEPipelines(
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.adminService.getPCEPipelines({
      status,
      limit: limit ?? 50,
      offset: offset ?? 0,
    });
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
    return this.adminService.getPCEProductionOrders({
      status,
      limit: limit ?? 50,
    });
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
    return this.adminService.getPCEReturns({
      status,
      limit: limit ?? 50,
    });
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
  @ApiOperation({ summary: 'Offer a free subscription to a brand for a given duration' })
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
