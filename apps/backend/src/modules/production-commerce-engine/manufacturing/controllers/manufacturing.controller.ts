import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { CurrentBrand } from '@/common/decorators/current-brand.decorator';
import { UserRole } from '@prisma/client';

import { ManufacturingOrchestratorService } from '../services/manufacturing-orchestrator.service';
import { ProviderManagerService } from '../services/provider-manager.service';
import { QualityControlService } from '../services/quality-control.service';
import {
  GetQuotesDto,
  CreateProductionOrderDto,
  ListProductionOrdersQueryDto,
  RegisterProviderDto,
  RejectQualityDto,
} from '../dto/manufacturing.dto';

@ApiTags('PCE - Manufacturing / POD')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pce/manufacturing')
export class ManufacturingController {
  constructor(
    private readonly orchestrator: ManufacturingOrchestratorService,
    private readonly providerManager: ProviderManagerService,
    private readonly qualityControl: QualityControlService,
  ) {}

  @Get('providers')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'List POD providers for the current brand' })
  async listProviders(@CurrentBrand() brand: { id: string }) {
    if (!brand?.id) {
      return [];
    }
    return this.providerManager.listProviders(brand.id);
  }

  @Post('providers')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Register a POD provider' })
  async registerProvider(
    @CurrentBrand() brand: { id: string },
    @Body() dto: RegisterProviderDto,
  ) {
    if (!brand?.id) {
      throw new Error('Brand context required');
    }
    return this.providerManager.registerProvider({
      brandId: brand.id,
      name: dto.name,
      slug: dto.slug,
      providerType: dto.providerType,
      credentials: dto.credentials,
      settings: dto.settings,
      priority: dto.priority,
      capabilities: dto.capabilities,
      metadata: dto.metadata,
    });
  }

  @Get('production-orders')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'List production orders' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async listProductionOrders(
    @CurrentBrand() brand: { id: string },
    @Query() query: ListProductionOrdersQueryDto,
  ) {
    if (!brand?.id) {
      return { items: [], total: 0 };
    }
    return this.orchestrator.listProductionOrders(brand.id, {
      status: query.status,
      limit: query.limit,
      offset: query.offset,
    });
  }

  @Get('production-orders/:id')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get production order status' })
  async getProductionOrder(
    @CurrentBrand() brand: { id: string },
    @Param('id') id: string,
  ) {
    if (!brand?.id) {
      throw new Error('Brand context required');
    }
    return this.orchestrator.getProductionOrderStatus(id);
  }

  @Post('production-orders')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Create a production order' })
  async createProductionOrder(
    @CurrentBrand() brand: { id: string },
    @Body() dto: CreateProductionOrderDto,
  ) {
    if (!brand?.id) {
      throw new Error('Brand context required');
    }
    return this.orchestrator.createProductionOrder({
      brandId: brand.id,
      orderId: dto.orderId,
      items: dto.items,
      shippingAddress: dto.shippingAddress,
      providerId: dto.providerId,
      metadata: dto.metadata,
    });
  }

  @Put('production-orders/:id/cancel')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Cancel a production order' })
  async cancelProductionOrder(
    @CurrentBrand() brand: { id: string },
    @Param('id') id: string,
  ) {
    if (!brand?.id) {
      throw new Error('Brand context required');
    }
    return this.orchestrator.cancelProductionOrder(id);
  }

  @Post('quotes')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get production + shipping quotes' })
  async getQuotes(
    @CurrentBrand() brand: { id: string },
    @Body() dto: GetQuotesDto,
  ) {
    if (!brand?.id) {
      throw new Error('Brand context required');
    }
    return this.orchestrator.getQuotes({
      brandId: brand.id,
      items: dto.items,
      shippingAddress: dto.shippingAddress,
      providerId: dto.providerId,
    });
  }

  @Post('production-orders/:id/quality/submit')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Submit production order for quality review' })
  async submitForReview(
    @Param('id') id: string,
    @CurrentBrand() brand: { id: string },
  ) {
    return this.qualityControl.submitForReview(id, brand.id);
  }

  @Post('production-orders/:id/quality/approve')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Approve quality' })
  async approveQuality(
    @Param('id') id: string,
    @CurrentBrand() brand: { id: string },
  ) {
    return this.qualityControl.approveQuality(id, brand.id);
  }

  @Post('production-orders/:id/quality/reject')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Reject quality' })
  async rejectQuality(
    @Param('id') id: string,
    @Body() dto: RejectQualityDto,
    @CurrentBrand() brand: { id: string },
  ) {
    return this.qualityControl.rejectQuality(id, brand.id, dto.reason);
  }

  @Get('production-orders/:id/quality')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get quality report' })
  async getQualityReport(
    @Param('id') id: string,
    @CurrentBrand() brand: { id: string },
  ) {
    return this.qualityControl.getQualityReport(id, brand.id);
  }
}
