import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { User } from '@/common/decorators/user.decorator';
import type { CurrentUser } from '@/common/types/user.types';
import { Configurator3DPricingService } from '../services/configurator-3d-pricing.service';
import { ConfiguratorPermission } from '../decorators/configurator-permissions.decorator';
import { ConfiguratorPublicAccess } from '../decorators/configurator-permissions.decorator';
import { ConfiguratorRateLimit } from '../decorators/rate-limit-configurator.decorator';
import { ConfiguratorLoggingInterceptor } from '../interceptors';
import { CONFIGURATOR_3D_PERMISSIONS } from '../configurator-3d.constants';
import { CalculatePriceDto } from '../dto/pricing';

@ApiTags('configurator-3d-pricing')
@Controller('configurator-3d')
@UseInterceptors(ConfiguratorLoggingInterceptor)
export class Configurator3DPricingController {
  constructor(
    private readonly pricingService: Configurator3DPricingService,
  ) {}

  @Post('configurations/:configurationId/calculate-price')
  @HttpCode(HttpStatus.OK)
  @ConfiguratorPublicAccess()
  @ConfiguratorRateLimit('PUBLIC_PRICE_CALCULATE')
  @ApiOperation({ summary: 'Calculate price (public)' })
  @ApiParam({ name: 'configurationId', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Price calculated' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async calculatePrice(
    @Param('configurationId') configurationId: string,
    @Body() dto: CalculatePriceDto,
  ) {
    const selections = (dto.selections ?? {}) as Record<string, string>;
    return this.pricingService.calculate(configurationId, selections);
  }

  @Get('configurations/:configurationId/pricing/breakdown')
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.PRICING_READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pricing breakdown (optional selections in query)' })
  @ApiParam({ name: 'configurationId', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Pricing breakdown' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async getBreakdown(
    @Param('configurationId') configurationId: string,
    @Query('selections') selectionsJson?: string,
  ) {
    let selections: Record<string, string> = {};
    if (selectionsJson) {
      try {
        selections = JSON.parse(decodeURIComponent(selectionsJson)) as Record<string, string>;
      } catch {
        // ignore invalid JSON
      }
    }
    return this.pricingService.getBreakdown(configurationId, selections);
  }

  @Put('configurations/:configurationId/pricing')
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.PRICING_UPDATE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update pricing settings' })
  @ApiParam({ name: 'configurationId', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Pricing updated' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async updatePricing(
    @Param('configurationId') configurationId: string,
    @User() user: CurrentUser,
    @Body() data: { basePrice?: number; currency?: string; taxRate?: number; [k: string]: unknown },
  ) {
    const brandId = user.brandId ?? '';
    return this.pricingService.updateSettings(configurationId, brandId, data);
  }

  @Post('configurations/:configurationId/pricing/simulate')
  @HttpCode(HttpStatus.OK)
  @ConfiguratorPermission(CONFIGURATOR_3D_PERMISSIONS.PRICING_READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Simulate price for selections' })
  @ApiParam({ name: 'configurationId', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Simulated price' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async simulate(
    @Param('configurationId') configurationId: string,
    @Body() body: { selections: Record<string, string> },
  ) {
    const results = await this.pricingService.simulate(
      configurationId,
      body.selections ? [body.selections] : [],
    );
    return results[0] ?? null;
  }
}
