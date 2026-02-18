/**
 * AR Studio - E-Commerce AR Controller
 * Product AR config, variants, overlay, add-to-cart
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ARPlanGuard } from '@/common/guards/ar-plan.guard';
import { User } from '@/common/decorators/user.decorator';
import { CurrentUser } from '@/common/types/user.types';
import { ProductARConfigService } from '../ecommerce/product-ar-config.service';
import { VariantSwitcherService } from '../ecommerce/variant-switcher.service';
import { PriceOverlayService } from '../ecommerce/price-overlay.service';
import { AddToCartService } from '../ecommerce/add-to-cart.service';
import {
  CreateProductARConfigDto,
  UpdateProductARConfigDto,
  MapVariantDto,
  AddToCartFromARDto,
} from '../dto/ar-ecommerce.dto';

@ApiTags('AR Studio E-Commerce')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ARPlanGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
@Controller('ar-studio/ecommerce')
export class ArEcommerceController {
  private readonly logger = new Logger(ArEcommerceController.name);

  constructor(
    private readonly productARConfig: ProductARConfigService,
    private readonly variantSwitcher: VariantSwitcherService,
    private readonly priceOverlay: PriceOverlayService,
    private readonly addToCart: AddToCartService,
  ) {}

  @Post('config')
  @ApiOperation({ summary: 'Create product AR config' })
  async createConfig(@User() user: CurrentUser, @Body() dto: CreateProductARConfigDto) {
    if (!user.brandId) throw new BadRequestException('User must be associated with a brand');
    return this.productARConfig.createConfig(dto.productId, dto.primaryModelId, {
      defaultScale: dto.defaultScale,
      defaultRotation: dto.defaultRotation,
      placementMode: dto.placementMode as 'GROUND_PLANE' | 'TABLE_TOP' | 'WALL' | 'WRIST' | 'FACE',
      showPriceInAR: dto.showPriceInAR,
      showBuyButton: dto.showBuyButton,
      showVariantPicker: dto.showVariantPicker,
      overlayPosition: dto.overlayPosition,
      trackingType: dto.trackingType as 'WORLD' | 'IMAGE' | 'BODY' | 'FACE',
      imageTargetId: dto.imageTargetId,
    });
  }

  @Get('config/:productId')
  @ApiOperation({ summary: 'Get AR config for product' })
  async getConfig(@User() user: CurrentUser, @Param('productId') productId: string) {
    if (!user.brandId) throw new BadRequestException('User must be associated with a brand');
    return this.productARConfig.getConfig(productId);
  }

  @Put('config/:productId')
  @ApiOperation({ summary: 'Update AR config' })
  async updateConfig(
    @User() user: CurrentUser,
    @Param('productId') productId: string,
    @Body() dto: UpdateProductARConfigDto,
  ) {
    if (!user.brandId) throw new BadRequestException('User must be associated with a brand');
    return this.productARConfig.updateConfig(productId, {
      primaryModelId: dto.primaryModelId,
      defaultScale: dto.defaultScale,
      defaultRotation: dto.defaultRotation,
      placementMode: dto.placementMode as 'GROUND_PLANE' | 'TABLE_TOP' | 'WALL' | 'WRIST' | 'FACE',
      showPriceInAR: dto.showPriceInAR,
      showBuyButton: dto.showBuyButton,
      showVariantPicker: dto.showVariantPicker,
      overlayPosition: dto.overlayPosition,
      trackingType: dto.trackingType as 'WORLD' | 'IMAGE' | 'BODY' | 'FACE',
      imageTargetId: dto.imageTargetId,
    });
  }

  @Post('variants/:productId')
  @ApiOperation({ summary: 'Map variant to 3D model' })
  async mapVariant(
    @User() user: CurrentUser,
    @Param('productId') productId: string,
    @Body() dto: MapVariantDto,
  ) {
    if (!user.brandId) throw new BadRequestException('User must be associated with a brand');
    return this.variantSwitcher.mapVariant(productId, dto.variantKey, dto.modelId);
  }

  @Get('variants/:productId')
  @ApiOperation({ summary: 'List variant-model mappings' })
  async listVariantMappings(@User() user: CurrentUser, @Param('productId') productId: string) {
    if (!user.brandId) throw new BadRequestException('User must be associated with a brand');
    return this.variantSwitcher.listVariantMappings(productId);
  }

  @Get('overlay/:productId')
  @ApiOperation({ summary: 'Get overlay config' })
  async getOverlayConfig(@User() user: CurrentUser, @Param('productId') productId: string) {
    if (!user.brandId) throw new BadRequestException('User must be associated with a brand');
    return this.priceOverlay.getOverlayConfig(productId);
  }

  @Put('overlay/:productId')
  @ApiOperation({ summary: 'Update overlay config' })
  async updateOverlayConfig(
    @User() user: CurrentUser,
    @Param('productId') productId: string,
    @Body() body: { showPriceInAR?: boolean; showBuyButton?: boolean; showVariantPicker?: boolean; overlayPosition?: string },
  ) {
    if (!user.brandId) throw new BadRequestException('User must be associated with a brand');
    return this.priceOverlay.updateOverlayConfig(productId, body);
  }

  @Post('cart')
  @ApiOperation({ summary: 'Add to cart from AR session' })
  async addToCartFromAR(@Body() dto: AddToCartFromARDto, @User() user: CurrentUser) {
    return this.addToCart.addToCartFromAR(
      dto.sessionId,
      dto.productId,
      dto.variantId ?? null,
      user?.id,
      dto.quantity ?? 1,
    );
  }

  @Get('configs')
  @ApiOperation({ summary: 'List all AR-configured products' })
  async listConfigs(@User() user: CurrentUser, @Query('brandId') brandId?: string) {
    const bid = brandId ?? user.brandId;
    if (!bid) throw new BadRequestException('brandId required');
    return this.productARConfig.listConfigs(bid);
  }
}
