import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpStatus, HttpCode, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WebhookService } from './webhooks.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/types/user.types';

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
    @Request() req: Request & { user: CurrentUser },
    @Body('url') url: string,
    @Body('secret') secret?: string,
  ) {
    const brandId = req.user.brandId || 'default-brand-id';
    return this.webhookService.testWebhook(brandId, url, secret);
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
    const brandId = req.user.brandId || 'default-brand-id';
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

}
