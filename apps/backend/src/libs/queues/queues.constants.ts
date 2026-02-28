/**
 * Noms des queues BullMQ et types de jobs associés.
 *
 * Convention : les noms de queues utilisent le format kebab-case
 * pour rester cohérent avec les queues existantes du projet
 * (ai-generation, design-generation, render-processing, etc.).
 */

export const QUEUE_NAMES = {
  CONVERSATION: 'conversation',
  KNOWLEDGE_INDEXING: 'knowledge-indexing',
  INTEGRATION_SYNC: 'integration-sync',
  EMAIL_INBOUND: 'email-inbound',
  ESCALATION: 'escalation',
  ANALYTICS_AGGREGATION: 'analytics-aggregation',
  LEARNING: 'learning',
  SUMMARIZATION: 'summarization',
  DLQ: 'dead-letter-queue',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const ALL_QUEUE_NAMES = Object.values(QUEUE_NAMES);

export const JOB_TYPES = {
  CONVERSATION: {
    PROCESS_MESSAGE: 'process-message',
    ROUTE_TO_AGENT: 'route-to-agent',
    GENERATE_REPLY: 'generate-reply',
    CLOSE_INACTIVE: 'close-inactive',
  },
  KNOWLEDGE_INDEXING: {
    INDEX_DOCUMENT: 'index-document',
    REINDEX_COLLECTION: 'reindex-collection',
    DELETE_EMBEDDINGS: 'delete-embeddings',
    SYNC_KNOWLEDGE_BASE: 'sync-knowledge-base',
  },
  INTEGRATION_SYNC: {
    SYNC_SHOPIFY: 'sync-shopify',
    SYNC_WOOCOMMERCE: 'sync-woocommerce',
    SYNC_PRESTASHOP: 'sync-prestashop',
    SYNC_WEBHOOK_INBOUND: 'sync-webhook-inbound',
    FULL_CATALOG_SYNC: 'full-catalog-sync',
  },
  EMAIL_INBOUND: {
    PARSE_EMAIL: 'parse-email',
    CLASSIFY_INTENT: 'classify-intent',
    CREATE_TICKET: 'create-ticket',
    SEND_AUTO_REPLY: 'send-auto-reply',
  },
  ESCALATION: {
    ESCALATE_TO_HUMAN: 'escalate-to-human',
    NOTIFY_AGENT: 'notify-agent',
    SLA_BREACH_CHECK: 'sla-breach-check',
    REASSIGN_TICKET: 'reassign-ticket',
  },
  ANALYTICS_AGGREGATION: {
    AGGREGATE_DAILY: 'aggregate-daily',
    AGGREGATE_WEEKLY: 'aggregate-weekly',
    COMPUTE_CSAT: 'compute-csat',
    GENERATE_REPORT: 'generate-report',
    SYNC_BILLING_USAGE: 'sync-billing-usage',
    GENERATE_SCORECARD_REPORT: 'generate-scorecard-report',
  },
  LEARNING: {
    ANALYZE_SIGNALS: 'analyze-signals',
    AGGREGATE_VERTICAL: 'aggregate-vertical',
  },
  SUMMARIZATION: {
    SUMMARIZE_CONVERSATION: 'summarize-conversation',
  },
  DLQ: {
    RETRY_FAILED: 'retry-failed',
    ARCHIVE_DEAD: 'archive-dead',
  },
} as const;

export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2_000 },
  removeOnComplete: 100,
  removeOnFail: 200,
};
