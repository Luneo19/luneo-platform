/**
 * WooCommerce Integration Controller
 * REST API under /integrations/woocommerce
 */
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentBrand } from '@/common/decorators/current-brand.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { WooCommerceService } from './woocommerce.service';
import { WooCommerceConnectDto, WooCommercePushProductDto } from './woocommerce.dto';

@ApiTags('Integrations - WooCommerce')
@Controller('integrations/woocommerce')
@UseGuards(JwtAuthGuard)
export class WooCommerceController {
  private readonly logger = new Logger(WooCommerceController.name);

  constructor(private readonly wooCommerceService: WooCommerceService) {}

  @Post('connect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Connect WooCommerce store' })
  @ApiResponse({ status: 201, description: 'Store connected' })
  @ApiResponse({ status: 400, description: 'Invalid credentials' })
  async connect(
    @CurrentBrand() brand: { id: string } | null,
    @Body() body: WooCommerceConnectDto,
  ) {
    if (!brand) {
      throw new BadRequestException('Brand not found');
    }
    return this.wooCommerceService.connect(brand.id, {
      siteUrl: body.siteUrl,
      consumerKey: body.consumerKey,
      consumerSecret: body.consumerSecret,
    });
  }

  @Post('sync/products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync products from WooCommerce' })
  @ApiResponse({ status: 200, description: 'Sync queued' })
  async syncProducts(@CurrentBrand() brand: { id: string } | null) {
    if (!brand) {
      throw new BadRequestException('Brand not found');
    }
    await this.wooCommerceService.syncProducts(brand.id);
    return { success: true, message: 'Product sync queued' };
  }

  @Post('sync/orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync orders from WooCommerce' })
  @ApiResponse({ status: 200, description: 'Sync queued' })
  async syncOrders(@CurrentBrand() brand: { id: string } | null) {
    if (!brand) {
      throw new BadRequestException('Brand not found');
    }
    await this.wooCommerceService.syncOrders(brand.id);
    return { success: true, message: 'Order sync queued' };
  }

  @Post('push-product')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Push a Luneo design as WooCommerce product' })
  @ApiResponse({ status: 201, description: 'Product created/updated on WooCommerce' })
  async pushProduct(
    @CurrentBrand() brand: { id: string } | null,
    @Body() body: WooCommercePushProductDto,
  ) {
    if (!brand) {
      throw new BadRequestException('Brand not found');
    }
    const productData = { ...body } as Record<string, unknown>;
    if (body.luneoProductId) productData.luneoProductId = body.luneoProductId;
    return this.wooCommerceService.pushProduct(brand.id, productData);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get WooCommerce connection status' })
  @ApiResponse({ status: 200, description: 'Connection status' })
  async getStatus(@CurrentBrand() brand: { id: string } | null) {
    if (!brand) {
      throw new BadRequestException('Brand not found');
    }
    return this.wooCommerceService.getConnectionStatus(brand.id);
  }

  @Post('webhooks')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive WooCommerce webhooks (Public)' })
  @ApiResponse({ status: 200, description: 'Webhook received' })
  async webhooks(
    @Body() body: Record<string, unknown>,
    @Headers('x-wc-webhook-topic') topic: string,
    @Headers('x-wc-webhook-signature') signature?: string,
  ) {
    const webhookTopic = topic || (body as { topic?: string }).topic;
    if (!webhookTopic) {
      this.logger.warn('WooCommerce webhook missing topic');
      return { received: true };
    }
    await this.wooCommerceService.handleWebhook(webhookTopic, body, signature);
    return { received: true };
  }

  @Delete('disconnect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove WooCommerce integration' })
  @ApiResponse({ status: 204, description: 'Disconnected' })
  async disconnect(@CurrentBrand() brand: { id: string } | null) {
    if (!brand) {
      throw new BadRequestException('Brand not found');
    }
    await this.wooCommerceService.disconnect(brand.id);
  }
}
