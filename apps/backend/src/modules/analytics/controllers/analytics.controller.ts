import { Controller, Get, Post, Body, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RequestWithUser, RequestWithOptionalUser, CurrentUser } from '@/common/types/user.types';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';
import { AnalyticsService } from '../services/analytics.service';
import { RecordWebVitalDto } from '../dto/record-web-vital.dto';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ 
    summary: 'Get dashboard analytics',
    description: 'Récupère les métriques complètes du dashboard pour une période donnée. Inclut les designs, renders, utilisateurs actifs, revenus, commandes, et graphiques temporels.',
  })
  @ApiQuery({ 
    name: 'period', 
    required: false, 
    enum: ['last_7_days', 'last_30_days', 'last_90_days', 'last_year'],
    description: 'Période d\'analyse. Par défaut: last_30_days',
    example: 'last_30_days',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard analytics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        metrics: {
          type: 'object',
          properties: {
            totalDesigns: { type: 'number', example: 150 },
            totalRenders: { type: 'number', example: 300 },
            activeUsers: { type: 'number', example: 45 },
            revenue: { type: 'number', example: 12500.50 },
            orders: { type: 'number', example: 25 },
            conversionChange: { type: 'number', example: 2.5 },
          },
        },
        charts: {
          type: 'object',
          properties: {
            designsOverTime: { type: 'array' },
            revenueOverTime: { type: 'array' },
            viewsOverTime: { type: 'array' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Non authentifié - Token JWT manquant ou invalide' })
  @ApiResponse({ status: 403, description: 'Non autorisé - Permissions insuffisantes' })
  @ApiResponse({ status: 500, description: 'Erreur serveur lors du calcul des métriques' })
  async getDashboard(
    @Query('period') period: string = 'last_30_days',
    @Request() req: { user?: CurrentUser },
  ) {
    // SECURITY FIX: Non-admin users must be scoped to their own brand
    const user = req.user;
    const brandId = user?.brandId;
    if (user && user.role !== 'PLATFORM_ADMIN' && !brandId) {
      throw new ForbiddenException('Brand ID required for non-admin users');
    }
    // For non-admins, always use their brandId (ignore query params)
    const scopedBrandId = user?.role === 'PLATFORM_ADMIN' ? undefined : (brandId || undefined);
    return this.analyticsService.getDashboard(period, scopedBrandId);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get usage analytics' })
  @ApiResponse({ status: 200, description: 'Usage analytics retrieved successfully' })
  async getUsage(
    @Query('brandId') brandId: string,
    @Request() req: { user?: CurrentUser },
  ) {
    // SECURITY FIX: Non-admin users can only see their own brand usage
    const user = req.user;
    if (user && user.role !== 'PLATFORM_ADMIN' && brandId !== user.brandId) {
      throw new ForbiddenException('Access denied: cannot view other brand analytics');
    }
    const scopedBrandId = user?.role === 'PLATFORM_ADMIN' ? brandId : (user?.brandId || brandId || undefined);
    return this.analyticsService.getUsage(scopedBrandId as string);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiResponse({ status: 200, description: 'Revenue analytics retrieved successfully' })
  async getRevenue(
    @Query('period') period: string = 'last_30_days',
    @Request() req: { user?: CurrentUser },
  ) {
    // SECURITY FIX: Non-admin users must be scoped to their brand
    const user = req.user;
    const brandId = user?.role === 'PLATFORM_ADMIN' ? undefined : (user?.brandId || undefined);
    return this.analyticsService.getRevenue(period, brandId);
  }

  @Post('web-vitals')
  @Public() // Web vitals are sent from all pages including unauthenticated ones
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: 'Record a web vital metric' })
  @ApiResponse({ status: 201, description: 'Web vital recorded successfully' })
  async recordWebVital(@Body() dto: RecordWebVitalDto, @Request() req: RequestWithOptionalUser) {
    const userId = req?.user?.id || null;
    const brandId = req?.user?.brandId || null;
    return this.analyticsService.recordWebVital(userId, brandId, {
      ...dto,
      timestamp: dto.timestamp ?? Date.now(),
    });
  }

  @Get('web-vitals')
  @ApiOperation({ summary: 'Get web vitals metrics' })
  @ApiQuery({ name: 'name', required: false, description: 'Filter by metric name' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter' })
  @ApiResponse({ status: 200, description: 'Web vitals retrieved successfully' })
  async getWebVitals(
    @Request() req: RequestWithUser,
    @Query('name') name?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getWebVitals(req.user.id, { name, startDate, endDate });
  }

  @Get('pages')
  @ApiOperation({ 
    summary: 'Get top pages analytics',
    description: 'Récupère les pages les plus visitées avec le nombre de vues pour chaque page. Les données proviennent des événements analytics enregistrés.',
  })
  @ApiQuery({ 
    name: 'period', 
    required: false, 
    enum: ['last_7_days', 'last_30_days', 'last_90_days'],
    description: 'Période d\'analyse. Par défaut: last_30_days',
    example: 'last_30_days',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Top pages retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string', example: '/dashboard' },
          views: { type: 'number', example: 1250 },
          percentage: { type: 'number', example: 35.5 },
        },
      },
      example: [
        { path: '/dashboard', views: 1250, percentage: 35.5 },
        { path: '/products', views: 890, percentage: 25.2 },
        { path: '/orders', views: 450, percentage: 12.8 },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 500, description: 'Erreur serveur' })
  async getTopPages(@Query('period') period: string = 'last_30_days') {
    return this.analyticsService.getTopPages(period);
  }

  @Get('countries')
  @ApiOperation({ 
    summary: 'Get top countries analytics',
    description: 'Récupère la répartition géographique des utilisateurs par pays. Utilise les données d\'attribution si disponibles, sinon estimation basée sur la distribution des utilisateurs.',
  })
  @ApiQuery({ 
    name: 'period', 
    required: false, 
    enum: ['last_7_days', 'last_30_days', 'last_90_days'],
    description: 'Période d\'analyse. Par défaut: last_30_days',
    example: 'last_30_days',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Top countries retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          country: { type: 'string', example: 'FR' },
          countryName: { type: 'string', example: 'France' },
          users: { type: 'number', example: 200 },
          percentage: { type: 'number', example: 44.4 },
        },
      },
      example: [
        { country: 'FR', countryName: 'France', users: 200, percentage: 44.4 },
        { country: 'US', countryName: 'United States', users: 150, percentage: 33.3 },
        { country: 'GB', countryName: 'United Kingdom', users: 100, percentage: 22.2 },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 500, description: 'Erreur serveur' })
  async getTopCountries(@Query('period') period: string = 'last_30_days') {
    return this.analyticsService.getTopCountries(period);
  }

  @Get('realtime')
  @ApiOperation({ 
    summary: 'Get realtime users analytics',
    description: 'Récupère la liste des utilisateurs actifs dans les 5 dernières minutes. Utile pour afficher l\'activité en temps réel sur le dashboard.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Realtime users retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'user_123' },
          email: { type: 'string', example: 'user@example.com' },
          lastLoginAt: { type: 'string', format: 'date-time' },
        },
      },
      example: [
        { id: 'user_123', email: 'user1@example.com', lastLoginAt: '2024-01-09T12:00:00Z' },
        { id: 'user_456', email: 'user2@example.com', lastLoginAt: '2024-01-09T11:58:00Z' },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 500, description: 'Erreur serveur' })
  async getRealtimeUsers() {
    return this.analyticsService.getRealtimeUsers();
  }

  @Get('designs')
  @ApiOperation({ summary: 'Get design analytics' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter' })
  @ApiResponse({ status: 200, description: 'Design analytics with counts by status and daily' })
  async getDesignsAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?: RequestWithOptionalUser,
  ) {
    const brandId = req?.user?.brandId ?? undefined;
    return this.analyticsService.getDesignsAnalytics(brandId, startDate, endDate);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get order analytics' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter' })
  @ApiResponse({ status: 200, description: 'Order analytics with counts by status and daily' })
  async getOrdersAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?: RequestWithOptionalUser,
  ) {
    const brandId = req?.user?.brandId ?? undefined;
    return this.analyticsService.getOrdersAnalytics(brandId, startDate, endDate);
  }
}


