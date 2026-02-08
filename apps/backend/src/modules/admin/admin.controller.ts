import {
  Controller,
  Get,
  Post,
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
import { AdminService } from './admin.service';
import { Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { Public } from '@/common/decorators/public.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AddBlacklistedPromptDto, BulkActionCustomersDto } from './dto/admin.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.PLATFORM_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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

  @Post('create-admin')
  /** @Public: setup endpoint; protected by X-Setup-Key secret */
  @Public()
  @ApiOperation({ summary: 'Créer l\'admin (endpoint de setup - sécurisé avec clé secrète)' })
  @ApiHeader({ name: 'X-Setup-Key', description: 'Clé secrète pour créer l\'admin' })
  @ApiResponse({ status: 201, description: 'Admin créé avec succès' })
  @ApiResponse({ status: 401, description: 'Clé secrète invalide' })
  async createAdmin(@Headers('x-setup-key') setupKey: string) {
    // Vérifier la clé secrète (obligatoire en variable d'environnement)
    const validKey = process.env.SETUP_SECRET_KEY;
    
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
}
