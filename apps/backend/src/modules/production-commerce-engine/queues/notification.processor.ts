import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PCE_QUEUES } from '../pce.constants';

type NotificationJobType = 'send-email' | 'send-push' | 'send-sms';

interface NotificationPayload {
  channel: 'email' | 'push' | 'sms';
  recipient: string;
  subject?: string;
  body?: string;
  templateId?: string;
  data?: Record<string, unknown>;
}

@Processor(PCE_QUEUES.NOTIFICATIONS)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  async process(job: Job<NotificationPayload>): Promise<void> {
    const { name, data } = job;
    this.logger.log(`Processing notification job: ${name} to ${data.recipient}`);

    try {
      switch (name as NotificationJobType) {
        case 'send-email':
          this.logger.log(`[Notification] Email to ${data.recipient}: ${data.subject ?? '(no subject)'}`);
          break;
        case 'send-push':
          this.logger.log(`[Notification] Push to ${data.recipient}`);
          break;
        case 'send-sms':
          this.logger.log(`[Notification] SMS to ${data.recipient}`);
          break;
        default:
          this.logger.warn(`Unknown notification job type: ${name}`);
      }
      // For now: log and mark as sent (no actual provider call)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Notification job failed: ${name} - ${message}`);
      throw err;
    }
  }
}
