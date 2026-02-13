-- Migration: Add OrionAgent, CustomerHealthScore, WebhookDelivery, ProcessedWebhookEvent
-- All changes use IF NOT EXISTS / DO blocks for idempotency.

-- ============================================================
-- 1) Enums for Orion & Health Score models
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrionAgentType') THEN
    CREATE TYPE "OrionAgentType" AS ENUM ('ACQUISITION', 'ONBOARDING', 'COMMUNICATION', 'RETENTION', 'REVENUE', 'ANALYTICS', 'GENERAL');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrionAgentStatus') THEN
    CREATE TYPE "OrionAgentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'MAINTENANCE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ChurnRisk') THEN
    CREATE TYPE "ChurnRisk" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GrowthPotential') THEN
    CREATE TYPE "GrowthPotential" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
  END IF;
END $$;

-- ============================================================
-- 2) OrionAgent table (orion_agents)
-- ============================================================

CREATE TABLE IF NOT EXISTS "orion_agents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "type" "OrionAgentType" NOT NULL DEFAULT 'GENERAL',
  "description" TEXT,
  "status" "OrionAgentStatus" NOT NULL DEFAULT 'PAUSED',
  "config" JSONB NOT NULL DEFAULT '{}',
  "lastRunAt" TIMESTAMP(3),
  "tasksLast24h" INTEGER NOT NULL DEFAULT 0,
  "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "errorCount" INTEGER NOT NULL DEFAULT 0,
  "avgExecTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "orion_agents_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on name
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'orion_agents_name_key') THEN
    CREATE UNIQUE INDEX "orion_agents_name_key" ON "orion_agents"("name");
  END IF;
END $$;

-- ============================================================
-- 3) CustomerHealthScore table (customer_health_scores)
-- ============================================================

CREATE TABLE IF NOT EXISTS "customer_health_scores" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "healthScore" INTEGER NOT NULL DEFAULT 50,
  "churnRisk" "ChurnRisk" NOT NULL DEFAULT 'LOW',
  "activationScore" INTEGER NOT NULL DEFAULT 0,
  "engagementScore" INTEGER NOT NULL DEFAULT 0,
  "adoptionScore" INTEGER NOT NULL DEFAULT 0,
  "growthPotential" "GrowthPotential" NOT NULL DEFAULT 'MEDIUM',
  "lastActivityAt" TIMESTAMP(3),
  "signals" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "customer_health_scores_pkey" PRIMARY KEY ("id")
);

-- Unique index on userId
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'customer_health_scores_userId_key') THEN
    CREATE UNIQUE INDEX "customer_health_scores_userId_key" ON "customer_health_scores"("userId");
  END IF;
END $$;

-- Foreign key to User
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'customer_health_scores_userId_fkey' AND table_name = 'customer_health_scores') THEN
    ALTER TABLE "customer_health_scores" ADD CONSTRAINT "customer_health_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 4) WebhookDelivery table
-- ============================================================

CREATE TABLE IF NOT EXISTS "WebhookDelivery" (
  "id" TEXT NOT NULL,
  "webhookId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "statusCode" INTEGER,
  "responseCode" INTEGER,
  "responseBody" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastAttemptAt" TIMESTAMP(3),
  "nextRetryAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'WebhookDelivery_webhookId_idx') THEN
    CREATE INDEX "WebhookDelivery_webhookId_idx" ON "WebhookDelivery"("webhookId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'WebhookDelivery_status_idx') THEN
    CREATE INDEX "WebhookDelivery_status_idx" ON "WebhookDelivery"("status");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'WebhookDelivery_eventType_idx') THEN
    CREATE INDEX "WebhookDelivery_eventType_idx" ON "WebhookDelivery"("eventType");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'WebhookDelivery_createdAt_idx') THEN
    CREATE INDEX "WebhookDelivery_createdAt_idx" ON "WebhookDelivery"("createdAt");
  END IF;
END $$;

-- ============================================================
-- 5) ProcessedWebhookEvent table (webhook_events)
-- ============================================================

CREATE TABLE IF NOT EXISTS "webhook_events" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "processed" BOOLEAN NOT NULL DEFAULT false,
  "result" JSONB,
  "error" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),

  CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'webhook_events_eventId_key') THEN
    CREATE UNIQUE INDEX "webhook_events_eventId_key" ON "webhook_events"("eventId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'webhook_events_eventType_idx') THEN
    CREATE INDEX "webhook_events_eventType_idx" ON "webhook_events"("eventType");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'webhook_events_processed_idx') THEN
    CREATE INDEX "webhook_events_processed_idx" ON "webhook_events"("processed");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'webhook_events_createdAt_idx') THEN
    CREATE INDEX "webhook_events_createdAt_idx" ON "webhook_events"("createdAt");
  END IF;
END $$;
