/**
 * WooCommerce Webhook Controller
 * Handles incoming webhooks from WooCommerce
 */

import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WooCommerceWebhookService } from '../services/woocommerce-webhook.service';
import { WooCommerceWebhookPayloadDto } from '../dto/woocommerce-webhook.dto';
import { Public } from '@/common/decorators/public.decorator';
import * as crypto from 'crypto';
import { Request as ExpressRequest } from 'express';

type WooCommerceProductPayload = Parameters<WooCommerceWebhookService['handleProductCreate']>[1];
type WooCommerceOrderPayload = Parameters<WooCommerceWebhookService['handleOrderCreate']>[1];

/** @Public: WooCommerce webhooks; verified by signature in handler */
@ApiTags('ecommerce')
@Controller('ecommerce/woocommerce/webhook')
@Public()
export class WooCommerceWebhookController {
  private readonly logger = new Logger(WooCommerceWebhookController.name);

  constructor(
    private readonly webhookService: WooCommerceWebhookService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Verify WooCommerce webhook signature
   */
  private verifySignature(
    body: string,
    signature: string | undefined,
    secret: string | undefined,
  ): boolean {
    if (!secret || !signature) {
      return false;
    }

    try {
      const hash = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('base64');

      return crypto.timingSafeEqual(
        Buffer.from(hash),
        Buffer.from(signature),
      );
    } catch (error) {
      this.logger.error('Error verifying webhook signature', error);
      return false;
    }
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle WooCommerce webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Body() payload: WooCommerceWebhookPayloadDto,
    @Req() req: ExpressRequest & { rawBody?: Buffer },
    @Headers('x-wc-webhook-signature') signature: string | undefined,
    @Headers('x-wc-webhook-topic') topic: string | undefined,
    @Headers('x-wc-webhook-source') source: string | undefined,
  ) {
    try {
      // Validate required headers
      if (!topic || !source) {
        throw new BadRequestException('Missing required webhook headers');
      }

      // Get integration ID from source (format: integration_<id>)
      const integrationIdMatch = source.match(/^integration_(.+)$/);
      if (!integrationIdMatch) {
        throw new BadRequestException('Invalid webhook source format');
      }

      const integrationId = integrationIdMatch[1];

      // Verify webhook signature using raw body for accurate HMAC
      const webhookSecret = this.configService.get<string>('WOOCOMMERCE_WEBHOOK_SECRET');
      if (webhookSecret) {
        // Prefer raw body for HMAC verification (avoids JSON.stringify ordering issues)
        const bodyString = req.rawBody
          ? req.rawBody.toString('utf8')
          : JSON.stringify(payload);
        const isValid = this.verifySignature(bodyString, signature, webhookSecret);
        
        if (!isValid) {
          this.logger.warn('Invalid WooCommerce webhook signature', {
            integrationId,
            topic,
          });
          throw new UnauthorizedException('Invalid webhook signature');
        }
      }

      this.logger.log(`Processing WooCommerce webhook: ${topic}`, {
        integrationId,
        topic,
      });

      // Route to appropriate handler
      switch (topic) {
        case 'product.created':
          await this.webhookService.handleProductCreate(integrationId, payload as unknown as WooCommerceProductPayload);
          break;

        case 'product.updated':
          await this.webhookService.handleProductUpdate(integrationId, payload as unknown as WooCommerceProductPayload);
          break;

        case 'product.deleted':
          await this.webhookService.handleProductDelete(integrationId, payload as unknown as WooCommerceProductPayload);
          break;

        case 'order.created':
          await this.webhookService.handleOrderCreate(integrationId, payload as unknown as WooCommerceOrderPayload);
          break;

        case 'order.updated':
          await this.webhookService.handleOrderUpdate(integrationId, payload as unknown as WooCommerceOrderPayload);
          break;

        case 'order.deleted':
          await this.webhookService.handleOrderDelete(integrationId, payload as unknown as WooCommerceOrderPayload);
          break;

        default:
          this.logger.warn(`Unhandled WooCommerce webhook topic: ${topic}`, {
            integrationId,
          });
      }

      return { success: true, received: true };
    } catch (error) {
      this.logger.error('WooCommerce webhook processing error', error);
      
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }

      throw new BadRequestException('Webhook processing failed');
    }
  }
}

