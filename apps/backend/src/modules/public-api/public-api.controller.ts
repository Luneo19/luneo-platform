import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PublicApiService } from './public-api.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import { RateLimitGuard } from './rate-limit/rate-limit.guard';
import { CreateDesignDto, CreateOrderDto, GetAnalyticsDto, TestWebhookDto, GetProductsQueryDto, GetOrdersQueryDto } from './dto';
import { Public } from '@/common/decorators/public.decorator';
import { BrandId } from './decorators/brand-id.decorator';

/**
 * API-04: Tous les endpoints utilisent maintenant @BrandId() decorator
 * au lieu de (global as any).currentBrandId
 */
@ApiTags('Public API')
@Controller() // Empty controller path - will use global prefix /api/v1
@UseGuards(ApiKeyGuard, RateLimitGuard)
@ApiBearerAuth('api-key')
export class PublicApiController {
  constructor(private readonly publicApiService: PublicApiService) {}

  @Get('health')
  @Public() // Make health endpoint public (no API key required)
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'API is healthy' })
  async health() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  @Get('brand')
  @ApiOperation({ summary: 'Get brand information' })
  @ApiResponse({ status: 200, description: 'Brand information retrieved successfully' })
  async getBrand(@BrandId() brandId: string) {
    return this.publicApiService.getBrandInfo(brandId);
  }

  @Get('products')
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async getProducts(
    @BrandId() brandId: string,
    @Query() query: GetProductsQueryDto
  ) {
    const { page = 1, limit = 10 } = query;
    return this.publicApiService.getProducts(brandId, page, limit);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProduct(@BrandId() brandId: string, @Param('id') id: string) {
    return this.publicApiService.getProduct(brandId, id);
  }

  @Post('designs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new design' })
  @ApiResponse({ status: 201, description: 'Design created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid design data' })
  async createDesign(@BrandId() brandId: string, @Body() createDesignDto: CreateDesignDto) {
    return this.publicApiService.createDesign(brandId, createDesignDto);
  }

  @Get('designs/:id')
  @ApiOperation({ summary: 'Get design by ID' })
  @ApiResponse({ status: 200, description: 'Design retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Design not found' })
  async getDesign(@BrandId() brandId: string, @Param('id') id: string) {
    return this.publicApiService.getDesign(brandId, id);
  }

  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid order data' })
  async createOrder(@BrandId() brandId: string, @Body() createOrderDto: CreateOrderDto) {
    return this.publicApiService.createOrder(brandId, createOrderDto);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrder(@BrandId() brandId: string, @Param('id') id: string) {
    return this.publicApiService.getOrder(brandId, id);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get orders with filters' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async getOrders(
    @BrandId() brandId: string,
    @Query() query: GetOrdersQueryDto
  ) {
    const { page = 1, limit = 10, status } = query;
    return this.publicApiService.getOrders(brandId, page, limit, status);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get analytics data' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getAnalytics(@BrandId() brandId: string, @Query() query: GetAnalyticsDto) {
    return this.publicApiService.getAnalytics(brandId, query);
  }

  @Post('webhooks/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook test successful' })
  async testWebhook(@BrandId() brandId: string, @Body() payload: TestWebhookDto) {
    return this.publicApiService.testWebhook(brandId, payload);
  }
}


