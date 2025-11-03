import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WebhookService } from './webhooks.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('Webhooks')
@Controller('webhooks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook test completed' })
  async testWebhook(
    @Body('url') url: string,
    @Body('secret') secret?: string,
  ) {
    const brandId = this.getCurrentBrandId();
    return this.webhookService.testWebhook(brandId, url, secret);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get webhook delivery history' })
  @ApiResponse({ status: 200, description: 'Webhook history retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getHistory(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const brandId = this.getCurrentBrandId();
    return this.webhookService.getWebhookHistory(brandId, page, limit);
  }

  @Post(':id/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retry failed webhook' })
  @ApiResponse({ status: 200, description: 'Webhook retry completed' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async retryWebhook(@Param('id') id: string) {
    return this.webhookService.retryWebhook(id);
  }

  private getCurrentBrandId(): string {
    return (global as any).currentBrandId || 'default-brand-id';
  }
}
