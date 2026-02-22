/**
 * @fileoverview Controller V2 Shopify - Connexion manuelle pour Agents IA
 * @module ShopifyIntegrationController
 *
 * Endpoints pour connect/disconnect avec shopDomain + accessToken.
 */

import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentBrand } from '@/common/decorators/current-brand.decorator';
import { ShopifyIntegrationService } from './shopify-integration.service';

class ConnectShopifyDto {
  shopDomain!: string;
  accessToken!: string;
}

@ApiTags('Integrations - Shopify V2')
@Controller('integrations/shopify-v2')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShopifyIntegrationController {
  constructor(
    private readonly shopifyIntegrationService: ShopifyIntegrationService,
  ) {}

  @Post('connect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connect Shopify with shop domain and access token' })
  async connect(
    @CurrentBrand() brand: { id: string } | null,
    @Body() dto: ConnectShopifyDto,
  ) {
    if (!brand?.id) throw new BadRequestException('Brand not found');
    await this.shopifyIntegrationService.connect(
      brand.id,
      dto.shopDomain,
      dto.accessToken,
    );
    return { success: true, message: 'Shopify connected successfully' };
  }

  @Delete('disconnect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disconnect Shopify integration' })
  async disconnect(@CurrentBrand() brand: { id: string } | null) {
    if (!brand?.id) throw new BadRequestException('Brand not found');
    await this.shopifyIntegrationService.disconnect(brand.id);
    return { success: true, message: 'Shopify disconnected' };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get Shopify V2 connection status' })
  async getStatus(@CurrentBrand() brand: { id: string } | null) {
    if (!brand?.id) throw new BadRequestException('Brand not found');
    return this.shopifyIntegrationService.getStatus(brand.id);
  }
}
