import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { Public } from '@/common/decorators/public.decorator';
import { PCE_EVENTS } from '../pce.constants';

/**
 * Handles incoming webhooks from external fulfillment/shipping providers.
 * Public routes (no JWT) - secured by HMAC signature verification.
 * Rate limiting is skipped for these paths in GlobalRateLimitGuard.
 */
@Public()
@ApiTags('PCE Webhooks')
@Controller('pce/webhooks')
export class PCEWebhooksController {
  private readonly logger = new Logger(PCEWebhooksController.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {}

  @Post('fulfillment')
  @ApiOperation({ summary: 'Handle fulfillment provider webhooks' })
  async handleFulfillmentWebhook(
    @Body() body: Record<string, unknown>,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    this.verifyWebhookSignature(body, signature, 'fulfillment');

    this.logger.log(`Received fulfillment webhook: ${body.event ?? 'unknown'}`);

    const event = body.event as string | undefined;
    const orderId = body.orderId as string | undefined;

    if (!orderId) {
      return { received: true, processed: false };
    }

    switch (event) {
      case 'shipment.created':
      case 'shipment.shipped':
        this.eventEmitter.emit('fulfillment.shipped', {
          orderId,
          trackingNumber: body.trackingNumber,
          trackingUrl: body.trackingUrl,
        });
        break;

      case 'shipment.delivered':
        this.eventEmitter.emit('fulfillment.delivered', { orderId });
        break;

      default:
        this.logger.debug(`Unhandled fulfillment webhook event: ${event}`);
    }

    return { received: true, processed: true };
  }

  @Post('production')
  @ApiOperation({ summary: 'Handle production provider webhooks (POD)' })
  async handleProductionWebhook(
    @Body() body: Record<string, unknown>,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    this.verifyWebhookSignature(body, signature, 'production');

    this.logger.log(`Received production webhook: ${body.event ?? 'unknown'}`);

    const event = body.event as string | undefined;
    const orderId = body.orderId as string | undefined;

    if (!orderId) {
      return { received: true, processed: false };
    }

    switch (event) {
      case 'order.completed':
        this.eventEmitter.emit('production.order.completed', { orderId });
        break;

      case 'order.shipped':
        this.eventEmitter.emit('production.order.shipped', {
          orderId,
          trackingNumber: body.trackingNumber,
        });
        break;

      case 'order.failed':
        this.eventEmitter.emit('production.order.failed', {
          orderId,
          error: body.error ?? 'Production failed',
        });
        break;

      default:
        this.logger.debug(`Unhandled production webhook event: ${event}`);
    }

    return { received: true, processed: true };
  }

  /**
   * Verifies HMAC-SHA256 webhook signature. Throws UnauthorizedException if invalid or missing.
   * Expects header x-webhook-signature: sha256=<hex> or raw hex.
   */
  private verifyWebhookSignature(
    body: Record<string, unknown>,
    signature: string | undefined,
    provider: 'fulfillment' | 'production',
  ): void {
    const secretKey =
      provider === 'fulfillment'
        ? 'PCE_WEBHOOK_FULFILLMENT_SECRET'
        : 'PCE_WEBHOOK_PRODUCTION_SECRET';
    const secret = this.configService.get<string>(secretKey);

    if (!secret) {
      this.logger.warn(`Webhook secret not configured (${secretKey})`);
      throw new UnauthorizedException('Webhook verification not configured');
    }

    if (!signature || typeof signature !== 'string') {
      throw new UnauthorizedException('Missing webhook signature');
    }

    const payload = JSON.stringify(body);
    const expectedHmac = createHmac('sha256', secret).update(payload).digest('hex');

    let receivedDigest = signature.trim();
    if (receivedDigest.startsWith('sha256=')) {
      receivedDigest = receivedDigest.slice(7);
    }

    if (
      expectedHmac.length !== receivedDigest.length ||
      !timingSafeEqual(Buffer.from(expectedHmac, 'hex'), Buffer.from(receivedDigest, 'hex'))
    ) {
      this.logger.warn('Invalid webhook signature', { provider });
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }
}
