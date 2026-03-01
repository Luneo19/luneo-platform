import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ScheduledMessagesService } from './scheduled-messages.service';

@Injectable()
export class ScheduledMessagesScheduler {
  private readonly logger = new Logger(ScheduledMessagesScheduler.name);

  constructor(
    private readonly scheduledMessagesService: ScheduledMessagesService,
  ) {}

  @Cron('*/1 * * * *')
  async processDueMessages() {
    try {
      const result = await this.scheduledMessagesService.processDueBatch();
      if (result.scanned > 0) {
        this.logger.log(
          `Scheduled messages processed: scanned=${result.scanned} sent=${result.sent} failed=${result.failed}`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Failed to process scheduled messages batch',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
