import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { QueueNames } from '@/jobs/queue.constants';
import { JobNames } from '@/jobs/job.constants';
import { BaseQueueService } from '@/jobs/services/base-queue.service';
import { EcommerceWebhookJobPayload } from '../interfaces/ecommerce.interface';

@Injectable()
export class EcommerceWebhookQueueService extends BaseQueueService<EcommerceWebhookJobPayload> {
  constructor(
    @InjectQueue(QueueNames.ECOMMERCE_WEBHOOKS)
    webhookQueue: Queue<EcommerceWebhookJobPayload, any, string>,
  ) {
    super(EcommerceWebhookQueueService.name, webhookQueue);
  }

  async enqueueShopifyWebhook(payload: EcommerceWebhookJobPayload): Promise<string> {
    const job = await this.enqueue(JobNames.ECOMMERCE_WEBHOOKS.PROCESS_SHOPIFY, payload);
    return job.id?.toString() ?? `${payload.integrationId}:shopify:${payload.topic}`;
  }

  async enqueueWooCommerceWebhook(payload: EcommerceWebhookJobPayload): Promise<string> {
    const job = await this.enqueue(JobNames.ECOMMERCE_WEBHOOKS.PROCESS_WOOCOMMERCE, payload);
    return job.id?.toString() ?? `${payload.integrationId}:woocommerce:${payload.topic}`;
  }
}

