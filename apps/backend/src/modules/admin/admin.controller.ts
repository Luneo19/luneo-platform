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
import { Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { Public } from '@/common/decorators/public.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { SetupKeyGuard } from '@/common/guards/setup-key.guard';
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
  ) {}

  // ========================================
  // TENANTS (BRANDS) - Platform admin view
  // ========================================

  @Get('tenants')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all tenants (brands) for platform admin' })
  @ApiResponse({ status: 200, description: 'List of tenants' })
  async getTenants() {
    return this.adminService.getTenants();
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
}
