import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PrintOnDemandService } from './print-on-demand.service';
import { CreatePrintOrderDto } from './dto/create-print-order.dto';
import { MockupDto } from './dto/mockup.dto';
import { CalculatePricingDto } from './dto/calculate-pricing.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { BrandOwnershipGuard } from '@/common/guards/brand-ownership.guard';
import { UseGuards } from '@nestjs/common';

@ApiTags('print-on-demand')
@Controller('print-on-demand')
@UseGuards(JwtAuthGuard, BrandOwnershipGuard)
@ApiBearerAuth()
export class PrintOnDemandController {
  constructor(private readonly printOnDemandService: PrintOnDemandService) {}

  @Get('providers')
  @ApiOperation({ summary: 'List available print-on-demand providers' })
  @ApiResponse({ status: 200, description: 'List of provider names' })
  getProviders() {
    return { providers: this.printOnDemandService.getAvailableProviders() };
  }

  @Get('products')
  @ApiOperation({ summary: 'List products from a provider' })
  @ApiQuery({ name: 'provider', required: true, enum: ['printful', 'printify', 'gelato'] })
  @ApiResponse({ status: 200, description: 'List of products' })
  async getProducts(@Query('provider') provider: string) {
    return this.printOnDemandService.getAvailableProducts(provider);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product details' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiQuery({ name: 'provider', required: true, enum: ['printful', 'printify', 'gelato'] })
  @ApiResponse({ status: 200, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductById(@Param('id') id: string, @Query('provider') provider: string) {
    const product = await this.printOnDemandService.getProductById(provider, id);
    if (!product) {
      return { product: null };
    }
    return { product };
  }

  @Post('mockup')
  @ApiOperation({ summary: 'Generate mockup image URL' })
  @ApiResponse({ status: 201, description: 'Mockup URL' })
  async getMockup(@Body() dto: MockupDto) {
    const mockupUrl = await this.printOnDemandService.getMockup(
      dto.provider,
      dto.productId,
      dto.designUrl,
    );
    return { mockupUrl };
  }

  @Post('orders')
  @ApiOperation({ summary: 'Create a print order' })
  @ApiResponse({ status: 201, description: 'Print order created' })
  @ApiResponse({ status: 400, description: 'Invalid request or unknown provider' })
  async createOrder(@Body() dto: CreatePrintOrderDto) {
    const { printOrder, providerResult } = await this.printOnDemandService.createPrintOrder(
      dto.brandId,
      dto.orderId,
      dto.provider,
      dto.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
        designUrl: i.designUrl,
      })),
      {
        name: dto.shippingAddress.name,
        address1: dto.shippingAddress.address1,
        address2: dto.shippingAddress.address2,
        city: dto.shippingAddress.city,
        state: dto.shippingAddress.state,
        country: dto.shippingAddress.country,
        zip: dto.shippingAddress.zip,
      },
      dto.brandMarginPercent,
    );
    return {
      id: printOrder.id,
      orderId: printOrder.orderId,
      providerOrderId: providerResult.providerOrderId,
      status: providerResult.status,
      estimatedDelivery: providerResult.estimatedDelivery,
      totalPrice: printOrder.totalPrice,
    };
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get print order status' })
  @ApiParam({ name: 'id', description: 'Order ID (Luneo order ID)' })
  @ApiResponse({ status: 200, description: 'Order status and tracking' })
  @ApiResponse({ status: 404, description: 'Print order not found' })
  async getOrderStatus(@Param('id') id: string) {
    return this.printOnDemandService.getOrderStatus(id);
  }

  @Post('orders/:id/cancel')
  @ApiOperation({ summary: 'Cancel a print order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  @ApiResponse({ status: 404, description: 'Print order not found' })
  async cancelOrder(@Param('id') id: string) {
    const cancelled = await this.printOnDemandService.cancelOrder(id);
    return { cancelled };
  }

  @Get('pricing')
  @ApiOperation({ summary: 'Calculate pricing for items (query params)' })
  @ApiQuery({ name: 'provider', required: true })
  @ApiResponse({ status: 200, description: 'Pricing breakdown' })
  async getPricingQuery(
    @Query('provider') provider: string,
    @Query('items') itemsJson?: string,
    @Query('brandMarginPercent') brandMarginPercent?: string,
  ) {
    let items: Array<{ productId: string; variantId: string; quantity: number; unitPriceCents?: number }>;
    try {
      items = itemsJson ? JSON.parse(itemsJson) : [];
    } catch {
      items = [];
    }
    return this.printOnDemandService.calculatePricing(
      items,
      provider,
      brandMarginPercent != null ? Number(brandMarginPercent) : undefined,
    );
  }

  @Post('pricing')
  @ApiOperation({ summary: 'Calculate pricing for items (body)' })
  @ApiResponse({ status: 200, description: 'Pricing breakdown' })
  async calculatePricing(@Body() dto: CalculatePricingDto) {
    return this.printOnDemandService.calculatePricing(
      dto.items,
      dto.provider,
      dto.brandMarginPercent,
    );
  }
}
