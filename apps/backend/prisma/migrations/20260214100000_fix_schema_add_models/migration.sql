-- ============================================================
-- Migration: Fix schema mismatches + add missing models
-- Fixes the failed 20260214000000_repair_orion_schema migration
-- ============================================================

-- ============================================================
-- 1) Create EmailTemplateCategory enum
-- ============================================================

CREATE TYPE "EmailTemplateCategory" AS ENUM ('ONBOARDING', 'RETENTION', 'ENGAGEMENT', 'TRANSACTIONAL', 'UPSELL', 'WIN_BACK', 'OTHER');

-- ============================================================
-- 2) Add "category" column to EmailTemplate
-- ============================================================

ALTER TABLE "EmailTemplate" ADD COLUMN "category" "EmailTemplateCategory" NOT NULL DEFAULT 'OTHER';
CREATE INDEX "EmailTemplate_category_idx" ON "EmailTemplate"("category");

-- ============================================================
-- 3) Add "type" column to orion_agents
-- ============================================================

ALTER TABLE "orion_agents" ADD COLUMN "type" "OrionAgentType" NOT NULL DEFAULT 'GENERAL';

-- ============================================================
-- 4) Fix orion_agents.status: text -> OrionAgentStatus enum
--    Must drop default FIRST, then change type, then set new default
-- ============================================================

ALTER TABLE "orion_agents" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orion_agents" ALTER COLUMN "status" TYPE "OrionAgentStatus" USING "status"::"OrionAgentStatus";
ALTER TABLE "orion_agents" ALTER COLUMN "status" SET DEFAULT 'PAUSED'::"OrionAgentStatus";

-- ============================================================
-- 5) Fix customer_health_scores.churnRisk: text -> ChurnRisk enum
-- ============================================================

ALTER TABLE "customer_health_scores" ALTER COLUMN "churnRisk" DROP DEFAULT;
ALTER TABLE "customer_health_scores" ALTER COLUMN "churnRisk" TYPE "ChurnRisk" USING "churnRisk"::"ChurnRisk";
ALTER TABLE "customer_health_scores" ALTER COLUMN "churnRisk" SET DEFAULT 'LOW'::"ChurnRisk";

-- ============================================================
-- 6) Fix customer_health_scores.growthPotential: text -> GrowthPotential enum
-- ============================================================

ALTER TABLE "customer_health_scores" ALTER COLUMN "growthPotential" DROP DEFAULT;
ALTER TABLE "customer_health_scores" ALTER COLUMN "growthPotential" TYPE "GrowthPotential" USING "growthPotential"::"GrowthPotential";
ALTER TABLE "customer_health_scores" ALTER COLUMN "growthPotential" SET DEFAULT 'MEDIUM'::"GrowthPotential";

-- ============================================================
-- 7) Create marketing_spends table
-- ============================================================

CREATE TABLE "marketing_spends" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "channel" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_spends_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "marketing_spends_date_idx" ON "marketing_spends"("date");
CREATE INDEX "marketing_spends_channel_idx" ON "marketing_spends"("channel");

-- ============================================================
-- 8) Create nps_responses table
-- ============================================================

CREATE TABLE "nps_responses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "source" TEXT NOT NULL DEFAULT 'in_app',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nps_responses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "nps_responses_userId_idx" ON "nps_responses"("userId");
CREATE INDEX "nps_responses_createdAt_idx" ON "nps_responses"("createdAt");

-- Foreign key to User table
ALTER TABLE "nps_responses" ADD CONSTRAINT "nps_responses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
