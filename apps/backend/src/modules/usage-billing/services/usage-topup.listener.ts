import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import Stripe from 'stripe';

import { UsageTopUpService } from './usage-topup.service';

@Injectable()
export class UsageTopUpListener {
  private readonly logger = new Logger(UsageTopUpListener.name);

  constructor(private readonly topUpService: UsageTopUpService) {}

  @OnEvent('billing.topup.completed', { async: true })
  async handleTopUpCompleted(session: Stripe.Checkout.Session) {
    try {
      await this.topUpService.handleCheckoutSessionCompleted(session);
    } catch (error) {
      this.logger.error(
        `Failed to finalize top-up ${session.metadata?.topupId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  @OnEvent('billing.topup.failed', { async: true })
  async handleTopUpFailed(payload: { session: Stripe.Checkout.Session; reason?: string }) {
    try {
      const checkoutId = payload.session.id;
      await this.topUpService.markTopUpFailed(checkoutId, payload.reason);
    } catch (error) {
      this.logger.error(
        `Failed to mark top-up ${payload.session.metadata?.topupId} as failed`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}

