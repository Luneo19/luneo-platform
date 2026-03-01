import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JOB_TYPES, QUEUE_NAMES } from '@/libs/queues';
import { WebhooksService } from './webhooks.service';

interface RetryWebhookPayload {
  queueType: 'webhook_delivery';
  failedJobId: string;
  organizationId?: string;
  webhookId: string;
  event: string;
  payload: Record<string, unknown>;
  attempts: number;
}

@Processor(QUEUE_NAMES.DLQ)
export class WebhooksDlqProcessor {
  private readonly logger = new Logger(WebhooksDlqProcessor.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Process(JOB_TYPES.DLQ.RETRY_FAILED)
  async retryFailed(job: Job<RetryWebhookPayload>) {
    const data = job.data;
    if (data.queueType !== 'webhook_delivery') {
      return { skipped: true };
    }

    this.logger.log(
      `Retrying failed webhook delivery failedJobId=${data.failedJobId} attempt=${data.attempts}`,
    );
    await this.webhooksService.retryFromDlq({
      failedJobId: data.failedJobId,
      organizationId: data.organizationId,
      webhookId: data.webhookId,
      event: data.event,
      payload: data.payload,
      attempts: data.attempts,
    });
    return { retried: true };
  }
}
