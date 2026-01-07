-- Migration: Add RLS and Outbox Pattern
-- Date: 2025-12-18
-- Description: Adds Row Level Security and Outbox pattern for event sourcing

-- ========================================
-- OUTBOX PATTERN
-- ========================================

-- Create OutboxEvent table
CREATE TABLE IF NOT EXISTS "OutboxEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- Create indexes for OutboxEvent
CREATE INDEX IF NOT EXISTS "OutboxEvent_status_createdAt_idx" ON "OutboxEvent"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "OutboxEvent_eventType_idx" ON "OutboxEvent"("eventType");

-- ========================================
-- WEBHOOK IDEMPOTENCY
-- ========================================

-- Add idempotency fields to Webhook table
ALTER TABLE "Webhook" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "Webhook" ADD COLUMN IF NOT EXISTS "timestamp" TIMESTAMP(3);

-- Create unique index for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS "Webhook_idempotencyKey_key" ON "Webhook"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "Webhook_idempotencyKey_idx" ON "Webhook"("idempotencyKey");

-- ========================================
-- BRAND BUDGETS
-- ========================================

-- Add budget fields to Brand table
ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "aiCostLimitCents" INTEGER DEFAULT 500000;
ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "aiCostUsedCents" INTEGER DEFAULT 0;
ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "aiCostResetAt" TIMESTAMP(3);

-- ========================================
-- RLS (Row Level Security)
-- ========================================
-- NOTE: RLS doit être activé progressivement avec feature flag ENABLE_RLS=true
-- Pour activer, exécuter les commandes suivantes manuellement après tests

-- Enable RLS on tenant-scoped tables
-- ALTER TABLE "Design" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Customization" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Webhook" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "ApiKey" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "AICost" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "EcommerceIntegration" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "UsageMetric" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (uncomment after enabling RLS)
-- CREATE POLICY "design_isolation" ON "Design" FOR ALL USING ("brandId" = current_setting('app.current_brand_id', true)::text);
-- CREATE POLICY "order_isolation" ON "Order" FOR ALL USING ("brandId" = current_setting('app.current_brand_id', true)::text);
-- CREATE POLICY "product_isolation" ON "Product" FOR ALL USING ("brandId" = current_setting('app.current_brand_id', true)::text);
-- CREATE POLICY "customization_isolation" ON "Customization" FOR ALL USING ("brandId" = current_setting('app.current_brand_id', true)::text);
-- CREATE POLICY "webhook_isolation" ON "Webhook" FOR ALL USING ("brandId" = current_setting('app.current_brand_id', true)::text);
-- CREATE POLICY "apikey_isolation" ON "ApiKey" FOR ALL USING ("brandId" = current_setting('app.current_brand_id', true)::text);
-- CREATE POLICY "aicost_isolation" ON "AICost" FOR ALL USING ("brandId" = current_setting('app.current_brand_id', true)::text);
-- CREATE POLICY "ecommerce_integration_isolation" ON "EcommerceIntegration" FOR ALL USING ("brandId" = current_setting('app.current_brand_id', true)::text);
-- CREATE POLICY "usage_metric_isolation" ON "UsageMetric" FOR ALL USING ("brandId" = current_setting('app.current_brand_id', true)::text);
































