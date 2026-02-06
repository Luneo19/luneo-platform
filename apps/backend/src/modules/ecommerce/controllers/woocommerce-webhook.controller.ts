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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WooCommerceWebhookService } from '../services/woocommerce-webhook.service';
import { Public } from '@/common/decorators/public.decorator';
import * as crypto from 'crypto';

@ApiTags('ecommerce')
@Controller('ecommerce/woocommerce/webhook')
@Public()
export class WooCommerceWebhookController {
  private readonly logger = new Logger(WooCommerceWebhookController.name);

  constructor(
    private readonly webhookService: WooCommerceWebhookService,
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
    @Body() payload: any,
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

      // Verify webhook signature
      const webhookSecret = process.env.WOOCOMMERCE_WEBHOOK_SECRET;
      if (webhookSecret) {
        const bodyString = JSON.stringify(payload);
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
          await this.webhookService.handleProductCreate(integrationId, payload);
          break;

        case 'product.updated':
          await this.webhookService.handleProductUpdate(integrationId, payload);
          break;

        case 'product.deleted':
          await this.webhookService.handleProductDelete(integrationId, payload);
          break;

        case 'order.created':
          await this.webhookService.handleOrderCreate(integrationId, payload);
          break;

        case 'order.updated':
          await this.webhookService.handleOrderUpdate(integrationId, payload);
          break;

        case 'order.deleted':
          await this.webhookService.handleOrderDelete(integrationId, payload);
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

