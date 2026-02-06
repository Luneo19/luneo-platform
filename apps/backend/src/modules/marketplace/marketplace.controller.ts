import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Roles } from '@/common/guards/roles.guard';
import { CurrentUser } from '@/common/types/user.types';
import { ArtisanOnboardingService } from './services/artisan-onboarding.service';
import { OrderRoutingService } from './services/order-routing.service';
import { StripeConnectService } from './services/stripe-connect.service';
import { SLAEnforcementService } from './services/sla-enforcement.service';
import { QCSystemService } from './services/qc-system.service';
import { CreatorProfileService } from './services/creator-profile.service'; // ✅ PHASE 7
import { MarketplaceTemplateService } from './services/marketplace-template.service'; // ✅ PHASE 7
import { RevenueSharingService } from './services/revenue-sharing.service'; // ✅ PHASE 7
import { EngagementService } from './services/engagement.service'; // ✅ PHASE 7
import { CreateArtisanDto } from './dto/create-artisan.dto';
import { SubmitKYCDocumentsDto } from './dto/submit-kyc.dto';
import { VerifyArtisanDto } from './dto/verify-artisan.dto';
import { AddCapabilityDto } from './dto/add-capability.dto';
import { RoutingCriteriaDto, RouteOrderDto } from './dto/route-order.dto';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { CreateQCReportDto } from './dto/create-qc-report.dto';
import { CreateSellerConnectDto } from './dto/create-seller-connect.dto';
import { CreateCreatorProfileDto } from './dto/create-creator-profile.dto';
import { UpdateCreatorProfileDto } from './dto/update-creator-profile.dto';
import { VerifyCreatorDto } from './dto/verify-creator.dto';
import { CreateMarketplaceTemplateDto } from './dto/create-marketplace-template.dto';
import { SearchTemplatesDto } from './dto/search-templates.dto';
import { PurchaseTemplateDto } from './dto/purchase-template.dto';
import { CreateCreatorPayoutDto } from './dto/create-creator-payout.dto';
import { CreateReviewDto } from './dto/create-review.dto';

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
    private readonly creatorProfile: CreatorProfileService, // ✅ PHASE 7
    private readonly marketplaceTemplate: MarketplaceTemplateService, // ✅ PHASE 7
    private readonly revenueSharing: RevenueSharingService, // ✅ PHASE 7
    private readonly engagement: EngagementService, // ✅ PHASE 7
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

  @Post('seller/connect')
  @ApiOperation({ summary: 'Crée un compte Stripe Connect pour un seller' })
  @ApiResponse({ status: 201, description: 'Compte Connect créé' })
  async createSellerConnect(
    @Body() dto: CreateSellerConnectDto,
    @Request() req: ExpressRequest & { user: { id: string; email?: string } },
  ) {
    return this.stripeConnect.createSellerConnectAccount(
      req.user.id,
      req.user.email || '',
      dto,
    );
  }

  @Get('seller/connect')
  @ApiOperation({ summary: 'Récupère le statut du compte Connect d\'un seller' })
  @ApiResponse({ status: 200, description: 'Statut récupéré' })
  async getSellerConnectStatus(@Request() req: ExpressRequest & { user: { id: string } }) {
    return this.stripeConnect.getSellerConnectStatus(req.user.id);
  }

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
  // CREATOR PROFILES (PHASE 7)
  // ========================================

  @Post('creators')
  @ApiOperation({ summary: 'Crée un profil créateur' })
  @ApiResponse({ status: 201, description: 'Profil créateur créé' })
  async createCreatorProfile(@Body() dto: CreateCreatorProfileDto) {
    return this.creatorProfile.createProfile(dto);
  }

  @Get('creators/:userId')
  @ApiOperation({ summary: 'Obtient un profil créateur par userId' })
  @ApiResponse({ status: 200, description: 'Profil créateur récupéré' })
  async getCreatorProfile(@Param('userId') userId: string) {
    return this.creatorProfile.getProfileByUserId(userId);
  }

  @Get('creators/username/:username')
  @ApiOperation({ summary: 'Obtient un profil créateur par username' })
  @ApiResponse({ status: 200, description: 'Profil créateur récupéré' })
  async getCreatorProfileByUsername(@Param('username') username: string) {
    return this.creatorProfile.getProfileByUsername(username);
  }

  @Put('creators/:userId')
  @ApiOperation({ summary: 'Met à jour un profil créateur' })
  @ApiResponse({ status: 200, description: 'Profil créateur mis à jour' })
  async updateCreatorProfile(@Param('userId') userId: string, @Body() dto: UpdateCreatorProfileDto) {
    return this.creatorProfile.updateProfile(userId, dto);
  }

  @Post('creators/:userId/verify')
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Vérifie un créateur (admin)' })
  @ApiResponse({ status: 200, description: 'Créateur vérifié' })
  async verifyCreator(@Param('userId') userId: string, @Body() dto: VerifyCreatorDto) {
    return this.creatorProfile.verifyCreator(userId, dto.verified);
  }

  // ========================================
  // MARKETPLACE TEMPLATES (PHASE 7)
  // ========================================

  @Post('templates')
  @ApiOperation({ summary: 'Crée un template marketplace' })
  @ApiResponse({ status: 201, description: 'Template créé' })
  async createTemplate(@Body() dto: CreateMarketplaceTemplateDto) {
    return this.marketplaceTemplate.createTemplate(dto);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Recherche des templates marketplace' })
  @ApiResponse({ status: 200, description: 'Templates récupérés' })
  async searchTemplates(@Query() dto: SearchTemplatesDto) {
    // Cast DTO to SearchTemplatesOptions for proper type alignment
    return this.marketplaceTemplate.searchTemplates(dto as any);
  }

  @Get('templates/:slug')
  @ApiOperation({ summary: 'Obtient un template par slug' })
  @ApiResponse({ status: 200, description: 'Template récupéré' })
  async getTemplate(@Param('slug') slug: string) {
    return this.marketplaceTemplate.getTemplateBySlug(slug);
  }

  @Post('templates/:templateId/publish')
  @ApiOperation({ summary: 'Publie un template' })
  @ApiResponse({ status: 200, description: 'Template publié' })
  async publishTemplate(@Param('templateId') templateId: string) {
    return this.marketplaceTemplate.publishTemplate(templateId);
  }

  // ========================================
  // REVENUE SHARING (PHASE 7)
  // ========================================

  @Post('templates/:templateId/purchase')
  @ApiOperation({ summary: 'Achète un template' })
  @ApiResponse({ status: 201, description: 'Achat traité' })
  async purchaseTemplate(@Param('templateId') templateId: string, @Body() dto: PurchaseTemplateDto) {
    return this.revenueSharing.purchaseTemplate({
      templateId,
      buyerId: dto.buyerId,
      priceCents: dto.priceCents,
      stripePaymentIntentId: dto.stripePaymentIntentId,
    });
  }

  @Post('purchases/:purchaseId/confirm')
  @ApiOperation({ summary: 'Confirme un achat (webhook Stripe)' })
  @ApiResponse({ status: 200, description: 'Achat confirmé' })
  async confirmPurchase(
    @Param('purchaseId') purchaseId: string,
    @Body() body: { stripePaymentIntentId: string },
  ) {
    await this.revenueSharing.confirmPurchase(purchaseId, body.stripePaymentIntentId);
    return { success: true };
  }

  @Post('creators/:creatorId/payouts')
  @ApiOperation({ summary: 'Crée un payout pour un créateur' })
  @ApiResponse({ status: 201, description: 'Payout créé' })
  async createCreatorPayout(@Param('creatorId') creatorId: string, @Body() dto: CreateCreatorPayoutDto) {
    return this.revenueSharing.createPayout({
      creatorId,
      periodStart: new Date(dto.periodStart),
      periodEnd: new Date(dto.periodEnd),
    });
  }

  @Post('creator-payouts/:payoutId/process')
  @ApiOperation({ summary: 'Traite un payout créateur via Stripe Connect' })
  @ApiResponse({ status: 200, description: 'Payout traité' })
  async processCreatorPayout(
    @Param('payoutId') payoutId: string,
    @Body() body: { stripeConnectAccountId: string },
  ) {
    return this.revenueSharing.processPayout(payoutId, body.stripeConnectAccountId);
  }

  // ========================================
  // ENGAGEMENT (PHASE 7)
  // ========================================

  @Post('templates/:templateId/like')
  @ApiOperation({ summary: 'Like/unlike un template' })
  @ApiResponse({ status: 200, description: 'Like toggled' })
  async toggleLike(@Param('templateId') templateId: string, @Request() req: ExpressRequest & { user: CurrentUser }) {
    return this.engagement.toggleLike(templateId, req.user.id);
  }

  @Post('creators/:creatorId/follow')
  @ApiOperation({ summary: 'Follow/unfollow un créateur' })
  @ApiResponse({ status: 200, description: 'Follow toggled' })
  async toggleFollow(@Param('creatorId') creatorId: string, @Request() req: ExpressRequest & { user: CurrentUser }) {
    return this.engagement.toggleFollow(req.user.id, creatorId);
  }

  @Post('templates/:templateId/reviews')
  @ApiOperation({ summary: 'Crée ou met à jour une review' })
  @ApiResponse({ status: 201, description: 'Review créée/mise à jour' })
  async createOrUpdateReview(@Param('templateId') templateId: string, @Body() dto: CreateReviewDto, @Request() req: ExpressRequest & { user: CurrentUser }) {
    return this.engagement.createOrUpdateReview({
      templateId,
      userId: req.user.id,
      rating: dto.rating,
      comment: dto.comment,
      purchaseId: dto.purchaseId,
    });
  }

  @Post('templates/:templateId/favorite')
  @ApiOperation({ summary: 'Ajoute/retire un template des favoris' })
  @ApiResponse({ status: 200, description: 'Favorite toggled' })
  async toggleFavorite(@Param('templateId') templateId: string, @Request() req: ExpressRequest & { user: CurrentUser }) {
    return this.engagement.toggleFavorite(templateId, req.user.id);
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

































