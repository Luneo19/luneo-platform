import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { JobsOptions, Queue } from 'bullmq';
import {
  QUEUE_NAMES,
  JOB_TYPES,
  DEFAULT_JOB_OPTIONS,
  type QueueName,
} from './queues.constants';

type ConversationJobType =
  (typeof JOB_TYPES.CONVERSATION)[keyof typeof JOB_TYPES.CONVERSATION];
type KnowledgeIndexingJobType =
  (typeof JOB_TYPES.KNOWLEDGE_INDEXING)[keyof typeof JOB_TYPES.KNOWLEDGE_INDEXING];
type IntegrationSyncJobType =
  (typeof JOB_TYPES.INTEGRATION_SYNC)[keyof typeof JOB_TYPES.INTEGRATION_SYNC];
type EmailInboundJobType =
  (typeof JOB_TYPES.EMAIL_INBOUND)[keyof typeof JOB_TYPES.EMAIL_INBOUND];
type EscalationJobType =
  (typeof JOB_TYPES.ESCALATION)[keyof typeof JOB_TYPES.ESCALATION];
type AnalyticsAggregationJobType =
  (typeof JOB_TYPES.ANALYTICS_AGGREGATION)[keyof typeof JOB_TYPES.ANALYTICS_AGGREGATION];
type DLQJobType = (typeof JOB_TYPES.DLQ)[keyof typeof JOB_TYPES.DLQ];

@Injectable()
export class QueuesService implements OnModuleInit {
  private readonly logger = new Logger(QueuesService.name);
  private readonly queueMap: Map<QueueName, Queue>;

  constructor(
    @InjectQueue(QUEUE_NAMES.CONVERSATION)
    private readonly conversationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.KNOWLEDGE_INDEXING)
    private readonly knowledgeIndexingQueue: Queue,
    @InjectQueue(QUEUE_NAMES.INTEGRATION_SYNC)
    private readonly integrationSyncQueue: Queue,
    @InjectQueue(QUEUE_NAMES.EMAIL_INBOUND)
    private readonly emailInboundQueue: Queue,
    @InjectQueue(QUEUE_NAMES.ESCALATION)
    private readonly escalationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.ANALYTICS_AGGREGATION)
    private readonly analyticsAggregationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.DLQ)
    private readonly dlqQueue: Queue,
  ) {
    this.queueMap = new Map<QueueName, Queue>([
      [QUEUE_NAMES.CONVERSATION, this.conversationQueue],
      [QUEUE_NAMES.KNOWLEDGE_INDEXING, this.knowledgeIndexingQueue],
      [QUEUE_NAMES.INTEGRATION_SYNC, this.integrationSyncQueue],
      [QUEUE_NAMES.EMAIL_INBOUND, this.emailInboundQueue],
      [QUEUE_NAMES.ESCALATION, this.escalationQueue],
      [QUEUE_NAMES.ANALYTICS_AGGREGATION, this.analyticsAggregationQueue],
      [QUEUE_NAMES.DLQ, this.dlqQueue],
    ]);
  }

  onModuleInit(): void {
    this.logger.log(
      `QueuesService initialized with ${this.queueMap.size} queues`,
    );
  }

  getQueue(name: QueueName): Queue {
    const queue = this.queueMap.get(name);
    if (!queue) {
      throw new Error(`Queue "${name}" not registered`);
    }
    return queue;
  }

  // ── Conversation ──────────────────────────────────────────────

  async addConversationJob<T extends Record<string, unknown>>(
    jobType: ConversationJobType,
    data: T,
    opts?: JobsOptions,
  ) {
    return this.addJob(QUEUE_NAMES.CONVERSATION, jobType, data, opts);
  }

  // ── Knowledge Indexing ────────────────────────────────────────

  async addKnowledgeIndexingJob<T extends Record<string, unknown>>(
    jobType: KnowledgeIndexingJobType,
    data: T,
    opts?: JobsOptions,
  ) {
    return this.addJob(QUEUE_NAMES.KNOWLEDGE_INDEXING, jobType, data, opts);
  }

  // ── Integration Sync ─────────────────────────────────────────

  async addIntegrationSyncJob<T extends Record<string, unknown>>(
    jobType: IntegrationSyncJobType,
    data: T,
    opts?: JobsOptions,
  ) {
    return this.addJob(QUEUE_NAMES.INTEGRATION_SYNC, jobType, data, opts);
  }

  // ── Email Inbound ─────────────────────────────────────────────

  async addEmailInboundJob<T extends Record<string, unknown>>(
    jobType: EmailInboundJobType,
    data: T,
    opts?: JobsOptions,
  ) {
    return this.addJob(QUEUE_NAMES.EMAIL_INBOUND, jobType, data, opts);
  }

  // ── Escalation ────────────────────────────────────────────────

  async addEscalationJob<T extends Record<string, unknown>>(
    jobType: EscalationJobType,
    data: T,
    opts?: JobsOptions,
  ) {
    return this.addJob(QUEUE_NAMES.ESCALATION, jobType, data, opts);
  }

  // ── Analytics Aggregation ─────────────────────────────────────

  async addAnalyticsAggregationJob<T extends Record<string, unknown>>(
    jobType: AnalyticsAggregationJobType,
    data: T,
    opts?: JobsOptions,
  ) {
    return this.addJob(QUEUE_NAMES.ANALYTICS_AGGREGATION, jobType, data, opts);
  }

  // ── Dead Letter Queue ─────────────────────────────────────────

  async addDLQJob<T extends Record<string, unknown>>(
    jobType: DLQJobType,
    data: T,
    opts?: JobsOptions,
  ) {
    return this.addJob(QUEUE_NAMES.DLQ, jobType, data, opts);
  }

  // ── Generic ───────────────────────────────────────────────────

  async addJob<T extends Record<string, unknown>>(
    queueName: QueueName,
    jobType: string,
    data: T,
    opts?: JobsOptions,
  ) {
    const queue = this.getQueue(queueName);
    const mergedOpts: JobsOptions = { ...DEFAULT_JOB_OPTIONS, ...opts };

    try {
      const job = await queue.add(jobType, data, mergedOpts);
      this.logger.debug(
        `Job added: queue=${queueName} type=${jobType} id=${job.id}`,
      );
      return job;
    } catch (error) {
      this.logger.error(
        `Failed to add job: queue=${queueName} type=${jobType}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
