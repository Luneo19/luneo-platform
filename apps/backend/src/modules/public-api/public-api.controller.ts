import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiHeader } from '@nestjs/swagger';
import { PublicApiService } from './public-api.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ApiQuotaGuard } from './guards/api-quota.guard';
import { ApiPermissionGuard, RequireApiPermission } from './guards/api-permission.guard';
import { RateLimitGuard } from './rate-limit/rate-limit.guard';
import { CreateDesignDto, UpdateDesignDto, CreateOrderDto, GetAnalyticsDto, TestWebhookDto, GetProductsQueryDto, GetDesignsQueryDto, GetOrdersQueryDto } from './dto';
import { Public } from '@/common/decorators/public.decorator';
import { BrandId } from './decorators/brand-id.decorator';

/**
 * Public REST API with API key authentication.
 * Base path: /api/v1/public
 * Authenticate via x-api-key header.
 * FIX-1: ApiPermissionGuard enforces scoped permissions per endpoint.
 */
@ApiTags('Public API')
@Controller('public')
@UseGuards(ApiKeyGuard, RateLimitGuard, ApiQuotaGuard, ApiPermissionGuard)
@ApiHeader({ name: 'x-api-key', description: 'API key (lun_...)', required: true })
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
  @RequireApiPermission('products:read')
  @ApiOperation({ summary: 'List products' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async getProducts(
    @BrandId() brandId: string,
    @Query() query: GetProductsQueryDto
  ) {
    const { page = 1, limit = 10 } = query;
    return this.publicApiService.getProducts(brandId, page, limit);
  }

  @Get('products/:id')
  @RequireApiPermission('products:read')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProduct(@BrandId() brandId: string, @Param('id') id: string) {
    return this.publicApiService.getProduct(brandId, id);
  }

  @Get('designs')
  @RequireApiPermission('designs:read')
  @ApiOperation({ summary: 'List designs for the brand' })
  @ApiResponse({ status: 200, description: 'Designs retrieved successfully' })
  async getDesigns(
    @BrandId() brandId: string,
    @Query() query: GetDesignsQueryDto
  ) {
    const { page = 1, limit = 10, status } = query;
    return this.publicApiService.listDesigns(brandId, page, limit, status);
  }

  @Get('designs/:id')
  @RequireApiPermission('designs:read')
  @ApiOperation({ summary: 'Get design by ID' })
  @ApiParam({ name: 'id', description: 'Design ID' })
  @ApiResponse({ status: 200, description: 'Design retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Design not found' })
  async getDesign(@BrandId() brandId: string, @Param('id') id: string) {
    return this.publicApiService.getDesign(brandId, id);
  }

  @Post('designs')
  @RequireApiPermission('designs:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a design' })
  @ApiResponse({ status: 201, description: 'Design created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid design data' })
  async createDesign(@BrandId() brandId: string, @Body() createDesignDto: CreateDesignDto) {
    return this.publicApiService.createDesign(brandId, createDesignDto);
  }

  @Put('designs/:id')
  @RequireApiPermission('designs:write')
  @ApiOperation({ summary: 'Update a design' })
  @ApiParam({ name: 'id', description: 'Design ID' })
  @ApiResponse({ status: 200, description: 'Design updated successfully' })
  @ApiResponse({ status: 404, description: 'Design not found' })
  async updateDesign(
    @BrandId() brandId: string,
    @Param('id') id: string,
    @Body() updateDesignDto: UpdateDesignDto
  ) {
    return this.publicApiService.updateDesign(brandId, id, updateDesignDto);
  }

  @Delete('designs/:id')
  @RequireApiPermission('designs:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a design' })
  @ApiParam({ name: 'id', description: 'Design ID' })
  @ApiResponse({ status: 204, description: 'Design deleted successfully' })
  @ApiResponse({ status: 404, description: 'Design not found' })
  async deleteDesign(@BrandId() brandId: string, @Param('id') id: string) {
    return this.publicApiService.deleteDesign(brandId, id);
  }

  @Get('orders')
  @RequireApiPermission('orders:read')
  @ApiOperation({ summary: 'List orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async getOrders(
    @BrandId() brandId: string,
    @Query() query: GetOrdersQueryDto
  ) {
    const { page = 1, limit = 10, status } = query;
    return this.publicApiService.getOrders(brandId, page, limit, status);
  }

  @Get('orders/:id')
  @RequireApiPermission('orders:read')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrder(@BrandId() brandId: string, @Param('id') id: string) {
    return this.publicApiService.getOrder(brandId, id);
  }

  @Post('orders')
  @RequireApiPermission('orders:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid order data' })
  async createOrder(@BrandId() brandId: string, @Body() createOrderDto: CreateOrderDto) {
    return this.publicApiService.createOrder(brandId, createOrderDto);
  }

  @Get('analytics')
  @RequireApiPermission('analytics:read')
  @ApiOperation({ summary: 'Get analytics data' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getAnalytics(@BrandId() brandId: string, @Query() query: GetAnalyticsDto) {
    return this.publicApiService.getAnalytics(brandId, query);
  }

  @Post('webhooks/test')
  @RequireApiPermission('webhooks:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook test successful' })
  async testWebhook(@BrandId() brandId: string, @Body() payload: TestWebhookDto) {
    return this.publicApiService.testWebhook(brandId, payload);
  }
}


