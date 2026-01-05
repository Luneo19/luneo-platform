import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { StripeConnectService } from '../services/stripe-connect.service';
import { SLAEnforcementService } from '../services/sla-enforcement.service';

@Injectable()
export class MarketplaceScheduler {
  private readonly logger = new Logger(MarketplaceScheduler.name);

  constructor(
    private readonly stripeConnect: StripeConnectService,
    private readonly slaEnforcement: SLAEnforcementService,
  ) {}

  /**
   * Traite les payouts automatiques (tous les jours à 2h du matin)
   */
  @Cron('0 2 * * *')
  async processScheduledPayouts() {
    this.logger.log('Processing scheduled payouts...');
    try {
      await this.stripeConnect.processScheduledPayouts();
      this.logger.log('Scheduled payouts processed successfully');
    } catch (error) {
      this.logger.error('Failed to process scheduled payouts:', error);
    }
  }

  /**
   * Évalue tous les SLA actifs (toutes les heures)
   */
  @Cron('0 * * * *')
  async evaluateAllActiveSLAs() {
    this.logger.log('Evaluating all active SLAs...');
    try {
      await this.slaEnforcement.evaluateAllActiveSLAs();
      this.logger.log('Active SLAs evaluated successfully');
    } catch (error) {
      this.logger.error('Failed to evaluate active SLAs:', error);
    }
  }
}






























