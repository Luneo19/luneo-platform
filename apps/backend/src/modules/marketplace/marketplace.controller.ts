import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Roles } from '@/common/guards/roles.guard';
import { CurrentUser } from '@/common/types/user.types';
import { ArtisanOnboardingService, type ArtisanOnboardingRequest } from './services/artisan-onboarding.service';
import { OrderRoutingService } from './services/order-routing.service';
import { StripeConnectService } from './services/stripe-connect.service';
import { SLAEnforcementService } from './services/sla-enforcement.service';
import { QCSystemService, type QCReport } from './services/qc-system.service';
import { CreatorProfileService } from './services/creator-profile.service'; // ✅ PHASE 7
import { MarketplaceTemplateService, type SearchTemplatesOptions } from './services/marketplace-template.service'; // ✅ PHASE 7
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
import { ConfirmPurchaseDto } from './dto/confirm-purchase.dto';
import { ProcessCreatorPayoutDto } from './dto/process-creator-payout.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { MarketplaceService } from './marketplace.service';
import { CreateMarketplaceItemDto } from './dto/create-marketplace-item.dto';
import { UpdateMarketplaceItemDto } from './dto/update-marketplace-item.dto';
import { ReviewItemDto } from './dto/review-item.dto';
import { CacheTTL } from '@/common/interceptors/cache-control.interceptor';

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
    private readonly marketplaceService: MarketplaceService, // ✅ PHASE 8 - Brand-to-brand marketplace
  ) {}

  // ========================================
  // PHASE 8: Marketplace items (templates & assets between brands)
  // ========================================

  @Get()
  @CacheTTL(300)
  @ApiOperation({ summary: 'List marketplace items with filters' })
  @ApiResponse({ status: 200, description: 'Items list' })
  async listItems(
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sort') sort?: 'newest' | 'popular' | 'price-asc' | 'price-desc' | 'rating',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketplaceService.listItems({
      type,
      category,
      search,
      minPrice: minPrice !== undefined ? Number(minPrice) : undefined,
      maxPrice: maxPrice !== undefined ? Number(maxPrice) : undefined,
      sort,
      page: page !== undefined ? Number(page) : undefined,
      limit: limit !== undefined ? Number(limit) : undefined,
    });
  }

  @Get('seller/dashboard')
  @ApiOperation({ summary: 'Seller dashboard stats and items' })
  @ApiResponse({ status: 200, description: 'Seller dashboard' })
  async getSellerDashboard(@Request() req: ExpressRequest & { user: CurrentUser }) {
    const brandId = req.user.brandId;
    if (!brandId) throw new BadRequestException('User must have a brand context');
    return this.marketplaceService.getSellerDashboard(brandId);
  }

  @Get('seller/connect')
  @ApiOperation({ summary: 'Récupère le statut du compte Connect d\'un seller' })
  @ApiResponse({ status: 200, description: 'Statut récupéré' })
  async getSellerConnectStatus(@Request() req: ExpressRequest & { user: { id: string } }) {
    return this.stripeConnect.getSellerConnectStatus(req.user.id);
  }

  @Get('seller/stats')
  @ApiOperation({ summary: 'Get seller statistics' })
  @ApiResponse({ status: 200, description: 'Seller stats' })
  async getSellerStats(@Request() req: ExpressRequest & { user: CurrentUser }) {
    const brandId = req.user.brandId;
    if (!brandId) throw new BadRequestException('User must have a brand context');
    return this.marketplaceService.getSellerStats(brandId);
  }

  @Get('seller/products')
  @ApiOperation({ summary: 'Get seller products' })
  @ApiResponse({ status: 200, description: 'Seller products' })
  async getSellerProducts(@Request() req: ExpressRequest & { user: CurrentUser }) {
    const brandId = req.user.brandId;
    if (!brandId) throw new BadRequestException('User must have a brand context');
    return this.marketplaceService.getSellerProducts(brandId);
  }

  @Get('seller/orders')
  @ApiOperation({ summary: 'Get seller orders' })
  @ApiResponse({ status: 200, description: 'Seller orders' })
  async getSellerOrders(@Request() req: ExpressRequest & { user: CurrentUser }) {
    const brandId = req.user.brandId;
    if (!brandId) throw new BadRequestException('User must have a brand context');
    return this.marketplaceService.getSellerOrders(brandId);
  }

  @Get('seller/reviews')
  @ApiOperation({ summary: 'Get seller reviews' })
  @ApiResponse({ status: 200, description: 'Seller reviews' })
  async getSellerReviews(@Request() req: ExpressRequest & { user: CurrentUser }) {
    const brandId = req.user.brandId;
    if (!brandId) throw new BadRequestException('User must have a brand context');
    return this.marketplaceService.getSellerReviews(brandId);
  }

  @Get('seller/payouts')
  @ApiOperation({ summary: 'Get seller payouts' })
  @ApiResponse({ status: 200, description: 'Seller payouts' })
  async getSellerPayouts(@Request() req: ExpressRequest & { user: CurrentUser }) {
    const brandId = req.user.brandId;
    if (!brandId) throw new BadRequestException('User must have a brand context');
    return this.marketplaceService.getSellerPayouts(brandId);
  }

  @Get('templates')
  @CacheTTL(600)
  @ApiOperation({ summary: 'Recherche des templates marketplace' })
  @ApiResponse({ status: 200, description: 'Templates récupérés' })
  async searchTemplates(@Query() dto: SearchTemplatesDto) {
    return this.marketplaceTemplate.searchTemplates(dto as SearchTemplatesOptions);
  }

  @Get('templates/featured')
  @CacheTTL(600)
  @ApiOperation({ summary: 'Get featured marketplace templates' })
  @ApiResponse({ status: 200, description: 'Featured templates' })
  async getFeaturedTemplates(@Query('limit') limit?: string) {
    const result = await this.marketplaceTemplate.searchTemplates({
      featured: true,
      limit: limit !== undefined ? Number(limit) : 8,
    });
    return { items: result.templates };
  }

  @Get('collections')
  @ApiOperation({ summary: 'Get marketplace collections' })
  @ApiResponse({ status: 200, description: 'Collections' })
  async getCollections(@Query('featured') featured?: string) {
    return { items: [] };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get marketplace item by id' })
  @ApiResponse({ status: 200, description: 'Item details' })
  async getItem(@Param('id') id: string) {
    return this.marketplaceService.getItem(id);
  }

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Create marketplace item (seller)' })
  @ApiResponse({ status: 201, description: 'Item created' })
  async createItem(@Body() dto: CreateMarketplaceItemDto, @Request() req: ExpressRequest & { user: CurrentUser }) {
    const brandId = req.user.brandId;
    if (!brandId) throw new BadRequestException('User must have a brand context');
    return this.marketplaceService.createItem(brandId, dto);
  }

  @Patch(':id')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Update marketplace item (seller)' })
  @ApiResponse({ status: 200, description: 'Item updated' })
  async updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateMarketplaceItemDto,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user.brandId;
    if (!brandId) throw new BadRequestException('User must have a brand context');
    return this.marketplaceService.updateItem(id, brandId, dto);
  }

  @Delete(':id')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Delete marketplace item (seller, soft)' })
  @ApiResponse({ status: 200, description: 'Item deleted' })
  async deleteItem(@Param('id') id: string, @Request() req: ExpressRequest & { user: CurrentUser }) {
    const brandId = req.user.brandId;
    if (!brandId) throw new BadRequestException('User must have a brand context');
    return this.marketplaceService.deleteItem(id, brandId);
  }

  @Post(':id/purchase')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Purchase marketplace item' })
  @ApiResponse({ status: 201, description: 'Purchase completed' })
  async purchaseItem(@Param('id') id: string, @Request() req: ExpressRequest & { user: CurrentUser }) {
    const brandId = req.user.brandId;
    if (!brandId) throw new BadRequestException('User must have a brand context');
    return this.marketplaceService.purchaseItem(id, brandId);
  }

  @Post(':id/review')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Review marketplace item' })
  @ApiResponse({ status: 201, description: 'Review created/updated' })
  async reviewItem(
    @Param('id') id: string,
    @Body() dto: ReviewItemDto,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user.brandId;
    if (!brandId) throw new BadRequestException('User must have a brand context');
    return this.marketplaceService.reviewItem(id, brandId, dto.rating, dto.comment);
  }

  // ========================================
  // FILE UPLOAD & DOWNLOAD
  // ========================================

  @Post('upload')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Upload a file for marketplace item' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'File uploaded, URL returned' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string; size: number } | undefined,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    if (!file) throw new BadRequestException('File is required');
    if (file.size > 100 * 1024 * 1024) throw new BadRequestException('File too large (max 100MB)');
    return this.marketplaceService.uploadFile(file.buffer, file.mimetype, file.originalname);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Get download URL for a purchased marketplace item' })
  @ApiResponse({ status: 200, description: 'Download URL returned' })
  async getDownloadUrl(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user.brandId;
    if (!brandId) throw new BadRequestException('User must have a brand context');
    return this.marketplaceService.getDownloadUrl(id, brandId);
  }

  // ========================================
  // ARTISAN ONBOARDING
  // ========================================

  @Post('artisans')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Crée un artisan et démarre l\'onboarding' })
  @ApiResponse({ status: 201, description: 'Artisan créé' })
  async createArtisan(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() dto: CreateArtisanDto,
  ) {
    const request: ArtisanOnboardingRequest = {
      ...dto,
      userId: req.user.id,
      supportedMaterials: dto.supportedMaterials,
      supportedTechniques: dto.supportedTechniques,
    };
    return this.artisanOnboarding.createArtisan(request);
  }

  @Post('artisans/:artisanId/kyc')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
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
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Vérifie un artisan (admin)' })
  @ApiResponse({ status: 200, description: 'Artisan vérifié' })
  async verifyArtisan(
    @Param('artisanId') artisanId: string,
    @Body() dto: VerifyArtisanDto,
  ) {
    return this.artisanOnboarding.verifyArtisan(artisanId, dto.verified, dto.reason);
  }

  @Post('artisans/:artisanId/capabilities')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
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
  @Throttle({ default: { limit: 20, ttl: 60000 } })
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
  @Throttle({ default: { limit: 20, ttl: 60000 } })
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
  @Throttle({ default: { limit: 10, ttl: 60000 } })
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

  @Post('payouts')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Crée un payout pour un artisan' })
  @ApiResponse({ status: 201, description: 'Payout créé' })
  async createPayout(@Body() dto: CreatePayoutDto) {
    return this.stripeConnect.createPayout(dto.artisanId, dto.workOrderIds);
  }

  // ========================================
  // SLA ENFORCEMENT
  // ========================================

  @Post('sla/:workOrderId/evaluate')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Évalue le SLA d\'un work order' })
  @ApiResponse({ status: 200, description: 'SLA évalué' })
  async evaluateSLA(@Param('workOrderId') workOrderId: string) {
    return this.slaEnforcement.evaluateSLA(workOrderId);
  }

  @Post('payouts/:payoutId/apply-sla')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Applique les pénalités/bonus SLA au payout' })
  @ApiResponse({ status: 200, description: 'SLA appliqué' })
  async applySLAToPayout(@Param('payoutId') payoutId: string) {
    return this.slaEnforcement.applySLAToPayout(payoutId);
  }

  // ========================================
  // CREATOR PROFILES (PHASE 7)
  // ========================================

  @Post('creators')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
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
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Met à jour un profil créateur' })
  @ApiResponse({ status: 200, description: 'Profil créateur mis à jour' })
  async updateCreatorProfile(@Param('userId') userId: string, @Body() dto: UpdateCreatorProfileDto) {
    return this.creatorProfile.updateProfile(userId, dto);
  }

  @Post('creators/:userId/verify')
  @Roles('PLATFORM_ADMIN')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Vérifie un créateur (admin)' })
  @ApiResponse({ status: 200, description: 'Créateur vérifié' })
  async verifyCreator(@Param('userId') userId: string, @Body() dto: VerifyCreatorDto) {
    return this.creatorProfile.verifyCreator(userId, dto.verified);
  }

  // ========================================
  // MARKETPLACE TEMPLATES (PHASE 7)
  // ========================================

  @Post('templates')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Crée un template marketplace' })
  @ApiResponse({ status: 201, description: 'Template créé' })
  async createTemplate(@Body() dto: CreateMarketplaceTemplateDto) {
    return this.marketplaceTemplate.createTemplate(dto);
  }

  @Get('templates/:slug')
  @ApiOperation({ summary: 'Obtient un template par slug' })
  @ApiResponse({ status: 200, description: 'Template récupéré' })
  async getTemplate(@Param('slug') slug: string) {
    return this.marketplaceTemplate.getTemplateBySlug(slug);
  }

  @Post('templates/:templateId/publish')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Publie un template' })
  @ApiResponse({ status: 200, description: 'Template publié' })
  async publishTemplate(@Param('templateId') templateId: string) {
    return this.marketplaceTemplate.publishTemplate(templateId);
  }

  // ========================================
  // REVENUE SHARING (PHASE 7)
  // ========================================

  @Post('templates/:templateId/purchase')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
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
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  @ApiOperation({ summary: 'Confirme un achat (webhook Stripe)' })
  @ApiResponse({ status: 200, description: 'Achat confirmé' })
  async confirmPurchase(
    @Param('purchaseId') purchaseId: string,
    @Body() body: ConfirmPurchaseDto,
  ) {
    await this.revenueSharing.confirmPurchase(purchaseId, body.stripePaymentIntentId);
    const confirmedAt = new Date();
    return {
      success: true,
      purchaseId,
      status: 'CONFIRMED',
      confirmedAt: confirmedAt.toISOString(),
    };
  }

  @Post('creators/:creatorId/payouts')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
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
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Traite un payout créateur via Stripe Connect' })
  @ApiResponse({ status: 200, description: 'Payout traité' })
  async processCreatorPayout(
    @Param('payoutId') payoutId: string,
    @Body() body: ProcessCreatorPayoutDto,
  ) {
    return this.revenueSharing.processPayout(payoutId, body.stripeConnectAccountId);
  }

  // ========================================
  // ENGAGEMENT (PHASE 7)
  // ========================================

  @Post('templates/:templateId/like')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Like/unlike un template' })
  @ApiResponse({ status: 200, description: 'Like toggled' })
  async toggleLike(@Param('templateId') templateId: string, @Request() req: ExpressRequest & { user: CurrentUser }) {
    return this.engagement.toggleLike(templateId, req.user.id);
  }

  @Post('creators/:creatorId/follow')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Follow/unfollow un créateur' })
  @ApiResponse({ status: 200, description: 'Follow toggled' })
  async toggleFollow(@Param('creatorId') creatorId: string, @Request() req: ExpressRequest & { user: CurrentUser }) {
    return this.engagement.toggleFollow(req.user.id, creatorId);
  }

  @Post('templates/:templateId/reviews')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
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
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Ajoute/retire un template des favoris' })
  @ApiResponse({ status: 200, description: 'Favorite toggled' })
  async toggleFavorite(@Param('templateId') templateId: string, @Request() req: ExpressRequest & { user: CurrentUser }) {
    return this.engagement.toggleFavorite(templateId, req.user.id);
  }

  // ========================================
  // QC SYSTEM
  // ========================================

  @Post('qc/reports')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Crée un rapport QC' })
  @ApiResponse({ status: 201, description: 'Rapport QC créé' })
  async createQCReport(@Body() dto: CreateQCReportDto) {
    const report: QCReport = {
      workOrderId: dto.workOrderId,
      overallScore: (dto.qualityScore ?? 0) / 10,
      passed: dto.status === 'passed',
      issues: dto.issues
        ? Object.entries(dto.issues).map(([type, desc]) => ({
            type: type as QCReport['issues'][0]['type'],
            severity: 'minor' as const,
            description: typeof desc === 'string' ? desc : JSON.stringify(desc),
          }))
        : [],
      recommendations: dto.notes ? [dto.notes] : [],
    };
    return this.qcSystem.createQCReport(report);
  }

  @Get('artisans/:artisanId/qc-stats')
  @ApiOperation({ summary: 'Récupère les statistiques QC d\'un artisan' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées' })
  async getArtisanQCStats(@Param('artisanId') artisanId: string) {
    return this.qcSystem.getArtisanQCStats(artisanId);
  }

}

































