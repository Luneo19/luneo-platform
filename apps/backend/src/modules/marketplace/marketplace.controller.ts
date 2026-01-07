import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Roles } from '@/common/guards/roles.guard';
import { ArtisanOnboardingService } from './services/artisan-onboarding.service';
import { OrderRoutingService } from './services/order-routing.service';
import { StripeConnectService } from './services/stripe-connect.service';
import { SLAEnforcementService } from './services/sla-enforcement.service';
import { QCSystemService } from './services/qc-system.service';
import { CreateArtisanDto } from './dto/create-artisan.dto';
import { SubmitKYCDocumentsDto } from './dto/submit-kyc.dto';
import { VerifyArtisanDto } from './dto/verify-artisan.dto';
import { AddCapabilityDto } from './dto/add-capability.dto';
import { RoutingCriteriaDto, RouteOrderDto } from './dto/route-order.dto';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { CreateQCReportDto } from './dto/create-qc-report.dto';

@ApiTags('Marketplace')
@Controller('marketplace')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MarketplaceController {
  constructor(
    private readonly artisanOnboarding: ArtisanOnboardingService,
    private readonly orderRouting: OrderRoutingService,
    private readonly stripeConnect: StripeConnectService,
    private readonly slaEnforcement: SLAEnforcementService,
    private readonly qcSystem: QCSystemService,
  ) {}

  // ========================================
  // ARTISAN ONBOARDING
  // ========================================

  @Post('artisans')
  @ApiOperation({ summary: 'Crée un artisan et démarre l\'onboarding' })
  @ApiResponse({ status: 201, description: 'Artisan créé' })
  async createArtisan(@Body() dto: CreateArtisanDto) {
    return this.artisanOnboarding.createArtisan(dto as any);
  }

  @Post('artisans/:artisanId/kyc')
  @ApiOperation({ summary: 'Soumet des documents KYC' })
  @ApiResponse({ status: 200, description: 'Documents soumis' })
  async submitKYCDocuments(
    @Param('artisanId') artisanId: string,
    @Body() dto: SubmitKYCDocumentsDto,
  ) {
    return this.artisanOnboarding.submitKYCDocuments(artisanId, dto.documents.map(doc => ({ ...doc, verified: false })));
  }

  @Put('artisans/:artisanId/verify')
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Vérifie un artisan (admin)' })
  @ApiResponse({ status: 200, description: 'Artisan vérifié' })
  async verifyArtisan(
    @Param('artisanId') artisanId: string,
    @Body() dto: VerifyArtisanDto,
  ) {
    return this.artisanOnboarding.verifyArtisan(artisanId, dto.verified, dto.reason);
  }

  @Post('artisans/:artisanId/capabilities')
  @ApiOperation({ summary: 'Ajoute une capacité à un artisan' })
  @ApiResponse({ status: 201, description: 'Capacité ajoutée' })
  async addCapability(@Param('artisanId') artisanId: string, @Body() dto: AddCapabilityDto) {
    return this.artisanOnboarding.addCapability(
      artisanId,
      dto.material,
      dto.technique,
      dto.options,
    );
  }

  // ========================================
  // ORDER ROUTING
  // ========================================

  @Post('orders/:orderId/routing')
  @ApiOperation({ summary: 'Trouve les meilleurs artisans pour une commande' })
  @ApiResponse({ status: 200, description: 'Artisans trouvés' })
  async findBestArtisans(
    @Param('orderId') orderId: string,
    @Body() dto: RoutingCriteriaDto,
    @Query('limit') limit: number = 3,
  ) {
    return this.orderRouting.findBestArtisans({ ...dto, orderId }, limit);
  }

  @Post('orders/:orderId/route')
  @ApiOperation({ summary: 'Route une commande vers un artisan' })
  @ApiResponse({ status: 201, description: 'Commande routée' })
  async routeOrder(@Param('orderId') orderId: string, @Body() dto: RouteOrderDto) {
    return this.orderRouting.routeOrder(orderId, dto.artisanId, {
      ...dto.quote,
      breakdown: dto.quote.breakdown || {},
    });
  }

  // ========================================
  // STRIPE CONNECT
  // ========================================

  @Post('payouts')
  @ApiOperation({ summary: 'Crée un payout pour un artisan' })
  @ApiResponse({ status: 201, description: 'Payout créé' })
  async createPayout(@Body() dto: CreatePayoutDto) {
    return this.stripeConnect.createPayout(dto.artisanId, dto.workOrderIds);
  }

  // ========================================
  // SLA ENFORCEMENT
  // ========================================

  @Post('sla/:workOrderId/evaluate')
  @ApiOperation({ summary: 'Évalue le SLA d\'un work order' })
  @ApiResponse({ status: 200, description: 'SLA évalué' })
  async evaluateSLA(@Param('workOrderId') workOrderId: string) {
    return this.slaEnforcement.evaluateSLA(workOrderId);
  }

  @Post('payouts/:payoutId/apply-sla')
  @ApiOperation({ summary: 'Applique les pénalités/bonus SLA au payout' })
  @ApiResponse({ status: 200, description: 'SLA appliqué' })
  async applySLAToPayout(@Param('payoutId') payoutId: string) {
    return this.slaEnforcement.applySLAToPayout(payoutId);
  }

  // ========================================
  // QC SYSTEM
  // ========================================

  @Post('qc/reports')
  @ApiOperation({ summary: 'Crée un rapport QC' })
  @ApiResponse({ status: 201, description: 'Rapport QC créé' })
  async createQCReport(@Body() dto: CreateQCReportDto) {
    return this.qcSystem.createQCReport(dto as any);
  }

  @Get('artisans/:artisanId/qc-stats')
  @ApiOperation({ summary: 'Récupère les statistiques QC d\'un artisan' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées' })
  async getArtisanQCStats(@Param('artisanId') artisanId: string) {
    return this.qcSystem.getArtisanQCStats(artisanId);
  }
}
































