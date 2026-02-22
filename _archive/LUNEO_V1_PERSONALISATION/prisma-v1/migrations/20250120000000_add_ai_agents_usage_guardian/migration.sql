-- Migration: Add AI Agents, Usage Guardian & AI Monitor models
-- Created: 2025-01-20

-- ========================================
-- AI AGENTS
-- ========================================

-- Modèle pour définir les agents IA disponibles
CREATE TABLE IF NOT EXISTS "AIAgent" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "systemPrompt" TEXT NOT NULL,
  "model" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
  "maxTokens" INTEGER NOT NULL DEFAULT 2000,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "category" TEXT,
  "tools" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AIAgent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AIAgent_name_key" ON "AIAgent"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "AIAgent_slug_key" ON "AIAgent"("slug");
CREATE INDEX IF NOT EXISTS "AIAgent_slug_idx" ON "AIAgent"("slug");
CREATE INDEX IF NOT EXISTS "AIAgent_isActive_idx" ON "AIAgent"("isActive");

-- ========================================
-- AI USAGE LOGS
-- ========================================

CREATE TABLE IF NOT EXISTS "AIUsageLog" (
  "id" TEXT NOT NULL,
  "brandId" TEXT,
  "userId" TEXT,
  "agentId" TEXT,
  "model" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "inputTokens" INTEGER NOT NULL,
  "outputTokens" INTEGER NOT NULL,
  "totalTokens" INTEGER NOT NULL,
  "costCents" DECIMAL(10,4) NOT NULL,
  "latencyMs" INTEGER NOT NULL,
  "success" BOOLEAN NOT NULL,
  "errorMessage" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AIUsageLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AIUsageLog_brandId_idx" ON "AIUsageLog"("brandId");
CREATE INDEX IF NOT EXISTS "AIUsageLog_userId_idx" ON "AIUsageLog"("userId");
CREATE INDEX IF NOT EXISTS "AIUsageLog_agentId_idx" ON "AIUsageLog"("agentId");
CREATE INDEX IF NOT EXISTS "AIUsageLog_createdAt_idx" ON "AIUsageLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AIUsageLog_provider_idx" ON "AIUsageLog"("provider");
CREATE INDEX IF NOT EXISTS "AIUsageLog_operation_idx" ON "AIUsageLog"("operation");

-- ========================================
-- AI QUOTAS
-- ========================================

CREATE TABLE IF NOT EXISTS "AIQuota" (
  "id" TEXT NOT NULL,
  "brandId" TEXT,
  "userId" TEXT,
  "planId" TEXT,
  "monthlyTokens" INTEGER NOT NULL DEFAULT 100000,
  "usedTokens" INTEGER NOT NULL DEFAULT 0,
  "monthlyRequests" INTEGER NOT NULL DEFAULT 1000,
  "usedRequests" INTEGER NOT NULL DEFAULT 0,
  "resetAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AIQuota_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AIQuota_brandId_key" ON "AIQuota"("brandId");
CREATE UNIQUE INDEX IF NOT EXISTS "AIQuota_userId_key" ON "AIQuota"("userId");
CREATE INDEX IF NOT EXISTS "AIQuota_brandId_idx" ON "AIQuota"("brandId");
CREATE INDEX IF NOT EXISTS "AIQuota_userId_idx" ON "AIQuota"("userId");
CREATE INDEX IF NOT EXISTS "AIQuota_planId_idx" ON "AIQuota"("planId");

-- ========================================
-- AI RATE LIMITS
-- ========================================

CREATE TABLE IF NOT EXISTS "AIRateLimit" (
  "id" TEXT NOT NULL,
  "brandId" TEXT,
  "userId" TEXT,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "requestCount" INTEGER NOT NULL DEFAULT 0,
  "tokenCount" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "AIRateLimit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AIRateLimit_brandId_userId_windowStart_key" ON "AIRateLimit"("brandId", "userId", "windowStart");
CREATE INDEX IF NOT EXISTS "AIRateLimit_brandId_idx" ON "AIRateLimit"("brandId");
CREATE INDEX IF NOT EXISTS "AIRateLimit_userId_idx" ON "AIRateLimit"("userId");
CREATE INDEX IF NOT EXISTS "AIRateLimit_windowStart_idx" ON "AIRateLimit"("windowStart");

-- ========================================
-- AI ANALYTICS
-- ========================================

CREATE TABLE IF NOT EXISTS "AIAnalytics" (
  "id" TEXT NOT NULL,
  "brandId" TEXT,
  "agentId" TEXT,
  "date" DATE NOT NULL,
  "conversationCount" INTEGER NOT NULL DEFAULT 0,
  "messageCount" INTEGER NOT NULL DEFAULT 0,
  "totalTokens" INTEGER NOT NULL DEFAULT 0,
  "totalCostCents" DECIMAL(10,2) NOT NULL,
  "avgLatencyMs" INTEGER,
  "errorCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AIAnalytics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AIAnalytics_brandId_agentId_date_key" ON "AIAnalytics"("brandId", "agentId", "date");
CREATE INDEX IF NOT EXISTS "AIAnalytics_brandId_idx" ON "AIAnalytics"("brandId");
CREATE INDEX IF NOT EXISTS "AIAnalytics_agentId_idx" ON "AIAnalytics"("agentId");
CREATE INDEX IF NOT EXISTS "AIAnalytics_date_idx" ON "AIAnalytics"("date");

-- ========================================
-- FOREIGN KEYS
-- ========================================

-- AIUsageLog foreign keys
ALTER TABLE "AIUsageLog" ADD CONSTRAINT "AIUsageLog_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIUsageLog" ADD CONSTRAINT "AIUsageLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AIQuota foreign keys
ALTER TABLE "AIQuota" ADD CONSTRAINT "AIQuota_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIQuota" ADD CONSTRAINT "AIQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AIRateLimit foreign keys
ALTER TABLE "AIRateLimit" ADD CONSTRAINT "AIRateLimit_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIRateLimit" ADD CONSTRAINT "AIRateLimit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AIAnalytics foreign keys
ALTER TABLE "AIAnalytics" ADD CONSTRAINT "AIAnalytics_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIAnalytics" ADD CONSTRAINT "AIAnalytics_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
