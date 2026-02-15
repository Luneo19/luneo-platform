import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpStatus, HttpCode, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { WebhookService } from './webhooks.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/types/user.types';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';

@ApiTags('Webhooks')
@Controller('public-api/webhooks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  private isPlatformAdmin(req: Request & { user: CurrentUser }): boolean {
    return req.user?.role === 'PLATFORM_ADMIN';
  }

  private getBrandId(req: Request & { user: CurrentUser }): string | null {
    return req.user?.brandId || null;
  }

  private requireBrandId(req: Request & { user: CurrentUser }): string {
    const brandId = req.user?.brandId;
    if (!brandId) {
      throw new BadRequestException('Brand ID required. Please complete your brand setup first.');
    }
    return brandId;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new webhook' })
  @ApiResponse({ status: 201, description: 'Webhook created successfully' })
  async create(
    @Request() req: Request & { user: CurrentUser },
    @Body() createWebhookDto: CreateWebhookDto,
  ) {
    const brandId = this.requireBrandId(req);
    return this.webhookService.create(brandId, createWebhookDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all webhooks' })
  @ApiResponse({ status: 200, description: 'Webhooks retrieved successfully' })
  async findAll(@Request() req: Request & { user: CurrentUser }) {
    // PLATFORM_ADMIN can see all webhooks across all brands
    if (this.isPlatformAdmin(req)) {
      return this.webhookService.findAllAdmin();
    }
    const brandId = this.requireBrandId(req);
    return this.webhookService.findAll(brandId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get webhook by ID' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async findOne(@Param('id') id: string, @Request() req: Request & { user: CurrentUser }) {
    if (this.isPlatformAdmin(req)) {
      return this.webhookService.findOneAdmin(id);
    }
    const brandId = this.requireBrandId(req);
    return this.webhookService.findOne(id, brandId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update webhook' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 200, description: 'Webhook updated successfully' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async update(
    @Param('id') id: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
    @Request() req: Request & { user: CurrentUser },
  ) {
    if (this.isPlatformAdmin(req)) {
      return this.webhookService.updateAdmin(id, updateWebhookDto);
    }
    const brandId = this.requireBrandId(req);
    return this.webhookService.update(id, brandId, updateWebhookDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete webhook' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiResponse({ status: 204, description: 'Webhook deleted successfully' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async remove(@Param('id') id: string, @Request() req: Request & { user: CurrentUser }) {
    if (this.isPlatformAdmin(req)) {
      return this.webhookService.removeAdmin(id);
    }
    const brandId = this.requireBrandId(req);
    return this.webhookService.remove(id, brandId);
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook test completed' })
  async testWebhook(
    @Request() req: Request & { user: CurrentUser },
    @Body('url') url: string,
    @Body('secret') secret?: string,
  ) {
    const brandId = this.getBrandId(req) || 'admin';
    return this.webhookService.testWebhook(brandId, url, secret);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get webhook logs' })
  @ApiParam({ name: 'id', description: 'Webhook ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Webhook logs retrieved successfully' })
  async getLogs(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Request() req: Request & { user: CurrentUser },
  ) {
    if (this.isPlatformAdmin(req)) {
      return this.webhookService.getWebhookLogsAdmin(id, page, limit);
    }
    const brandId = this.requireBrandId(req);
    return this.webhookService.getWebhookLogs(id, brandId, page, limit);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get webhook delivery history' })
  @ApiResponse({ status: 200, description: 'Webhook history retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getHistory(
    @Request() req: Request & { user: CurrentUser },
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    if (this.isPlatformAdmin(req)) {
      return this.webhookService.getWebhookHistoryAdmin(page, limit);
    }
    const brandId = this.requireBrandId(req);
    return this.webhookService.getWebhookHistory(brandId, page, limit);
  }

  @Post(':id/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retry failed webhook' })
  @ApiParam({ name: 'id', description: 'Webhook log ID' })
  @ApiResponse({ status: 200, description: 'Webhook retry completed' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async retryWebhook(
    @Param('id') id: string,
    @Request() req: Request & { user: CurrentUser },
  ) {
    if (this.isPlatformAdmin(req)) {
      return this.webhookService.retryWebhook(id);
    }
    const brandId = this.requireBrandId(req);
    return this.webhookService.retryWebhook(id, brandId);
  }
}
