import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PublicApiService } from './public-api.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import { RateLimitGuard } from './rate-limit/rate-limit.guard';
import { CreateDesignDto, CreateOrderDto, GetAnalyticsDto } from './dto';

@ApiTags('Public API')
@Controller('api/v1')
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
  async getBrand() {
    return this.publicApiService.getBrandInfo();
  }

  @Get('products')
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getProducts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    return this.publicApiService.getProducts(page, limit);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProduct(@Param('id') id: string) {
    return this.publicApiService.getProduct(id);
  }

  @Post('designs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new design' })
  @ApiResponse({ status: 201, description: 'Design created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid design data' })
  async createDesign(@Body() createDesignDto: CreateDesignDto) {
    return this.publicApiService.createDesign(createDesignDto);
  }

  @Get('designs/:id')
  @ApiOperation({ summary: 'Get design by ID' })
  @ApiResponse({ status: 200, description: 'Design retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Design not found' })
  async getDesign(@Param('id') id: string) {
    return this.publicApiService.getDesign(id);
  }

  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid order data' })
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.publicApiService.createOrder(createOrderDto);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrder(@Param('id') id: string) {
    return this.publicApiService.getOrder(id);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get orders with filters' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getOrders(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string
  ) {
    return this.publicApiService.getOrders(page, limit, status);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get analytics data' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getAnalytics(@Query() query: GetAnalyticsDto) {
    return this.publicApiService.getAnalytics(query);
  }

  @Post('webhooks/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook test successful' })
  async testWebhook(@Body() payload: any) {
    return this.publicApiService.testWebhook(payload);
  }
}


