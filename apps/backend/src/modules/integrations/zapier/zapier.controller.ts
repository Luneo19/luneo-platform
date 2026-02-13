import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { ApiKeyGuard } from '@/modules/public-api/guards/api-key.guard';
import { ZapierService, ZAPIER_ACTIONS, ZapierAction } from './zapier.service';

import { ZapierSubscribeDto, ZAPIER_TRIGGERS, type ZapierTrigger } from './dto/zapier-subscribe.dto';
import { ZapierCreateDesignDto, ZapierUpdateProductDto } from './dto/zapier-action.dto';

type RequestWithBrand = Request & { brandId?: string };

@ApiTags('Zapier Integration')
@Controller('integrations/zapier')
@UseGuards(ApiKeyGuard)
@ApiSecurity('api-key')
export class ZapierController {
  constructor(private readonly zapierService: ZapierService) {}

  private getBrandId(req: RequestWithBrand): string {
    const brandId = req.brandId;
    if (!brandId) throw new BadRequestException('Brand context required (x-api-key)');
    return brandId;
  }

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register a webhook subscription (Zapier subscribe)' })
  @ApiResponse({ status: 200, description: 'Webhook registered' })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  async subscribe(@Body() dto: ZapierSubscribeDto, @Req() req: RequestWithBrand) {
    const brandId = this.getBrandId(req);
    const sub = await this.zapierService.registerWebhook(brandId, dto.event, dto.targetUrl);
    return { id: sub.id, event: sub.event, targetUrl: sub.targetUrl };
  }

  @Delete('subscribe/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unsubscribe a webhook' })
  @ApiParam({ name: 'id', description: 'Webhook subscription ID' })
  @ApiResponse({ status: 204, description: 'Unsubscribed' })
  async unsubscribe(@Param('id') id: string, @Req() req: RequestWithBrand) {
    const brandId = this.getBrandId(req);
    await this.zapierService.unregisterWebhook(brandId, id);
  }

  @Get('triggers/:event/sample')
  @ApiOperation({ summary: 'Get sample data for a trigger (Zapier)' })
  @ApiParam({ name: 'event', enum: ZAPIER_TRIGGERS })
  @ApiResponse({ status: 200, description: 'Sample payload array for the trigger' })
  getTriggerSample(@Param('event') event: string) {
    if (!ZAPIER_TRIGGERS.includes(event as ZapierTrigger)) {
      throw new BadRequestException(`Invalid event. Must be one of: ${ZAPIER_TRIGGERS.join(', ')}`);
    }
    const data = this.zapierService.getTriggerSample(event as ZapierTrigger);
    return data;
  }

  @Post('actions/:action')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute a Zapier action' })
  @ApiParam({ name: 'action', enum: ZAPIER_ACTIONS })
  @ApiResponse({ status: 200, description: 'Action result' })
  @ApiResponse({ status: 400, description: 'Invalid action or payload' })
  async performAction(
    @Param('action') action: string,
    @Body() body: ZapierCreateDesignDto | ZapierUpdateProductDto,
    @Req() req: RequestWithBrand,
  ) {
    if (!ZAPIER_ACTIONS.includes(action as ZapierAction)) {
      throw new BadRequestException(`Invalid action. Must be one of: ${ZAPIER_ACTIONS.join(', ')}`);
    }
    const brandId = this.getBrandId(req);
    return this.zapierService.performAction(brandId, action as ZapierAction, body);
  }

  @Get('auth/test')
  @ApiOperation({ summary: 'Auth test (Zapier connection test)' })
  @ApiResponse({ status: 200, description: 'Returns brand/user info for the API key' })
  async authTest(@Req() req: RequestWithBrand) {
    const brandId = this.getBrandId(req);
    const brand = await this.zapierService.getBrandInfo(brandId);
    if (!brand) throw new BadRequestException('Brand not found');
    return { id: brand.id, name: brand.name, slug: brand.slug };
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'List webhook subscriptions for the brand' })
  @ApiResponse({ status: 200, description: 'List of subscriptions' })
  async listSubscriptions(@Req() req: RequestWithBrand) {
    const brandId = this.getBrandId(req);
    return this.zapierService.listSubscriptions(brandId);
  }
}
