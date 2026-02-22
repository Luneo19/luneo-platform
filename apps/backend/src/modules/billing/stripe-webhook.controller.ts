import { BadRequestException, Controller, Headers, HttpCode, HttpStatus, Post, RawBodyRequest, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { Public } from '@/common/decorators/public.decorator';
import { StripeService } from './stripe.service';

@ApiTags('Billing')
@Controller('billing/webhook')
export class StripeWebhookController {
  constructor(private readonly stripeService: StripeService) {}

  @Post()
  @Public()
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook handler' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ): Promise<{ received: boolean }> {
    if (!sig) {
      throw new BadRequestException('Missing Stripe signature header');
    }

    const payload = (req as unknown as { rawBody?: Buffer }).rawBody ?? req.body;
    if (!payload || (!Buffer.isBuffer(payload) && typeof payload !== 'string')) {
      throw new BadRequestException('Missing raw body for webhook verification. Ensure rawBody is enabled.');
    }

    const buffer = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');
    await this.stripeService.handleWebhookEvent(buffer, sig);

    return { received: true };
  }
}
