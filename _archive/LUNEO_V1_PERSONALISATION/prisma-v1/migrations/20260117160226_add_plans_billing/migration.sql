-- Migration: Add Plans & Billing Models
-- Date: 2025-01-17
-- Description: Adds Plan, Subscription, and PaymentMethod models for complete billing system with JSONB features/limits

-- ========================================
-- CREATE ENUMS
-- ========================================

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('CARD', 'SEPA', 'BANK_TRANSFER');

-- ========================================
-- CREATE TABLES
-- ========================================

-- CreateTable: Plan
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stripe_price_id" TEXT,
    "stripe_price_id_yearly" TEXT,
    "price_monthly" DECIMAL(10,2) NOT NULL,
    "price_yearly" DECIMAL(10,2),
    "features" JSONB NOT NULL,
    "limits" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Subscription
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "stripe_subscription_id" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PaymentMethod
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "stripe_payment_method_id" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "last_four" TEXT NOT NULL,
    "brand" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- ========================================
-- CREATE INDEXES
-- ========================================

-- Indexes for Plan
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");
CREATE INDEX "Plan_is_active_idx" ON "Plan"("is_active");
CREATE INDEX "Plan_name_idx" ON "Plan"("name");

-- Indexes for Subscription
CREATE UNIQUE INDEX "Subscription_stripe_subscription_id_key" ON "Subscription"("stripe_subscription_id");
CREATE INDEX "Subscription_organization_id_idx" ON "Subscription"("organization_id");
CREATE INDEX "Subscription_plan_id_idx" ON "Subscription"("plan_id");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX "Subscription_organization_id_status_idx" ON "Subscription"("organization_id", "status");
CREATE INDEX "Subscription_stripe_subscription_id_idx" ON "Subscription"("stripe_subscription_id");

-- Indexes for PaymentMethod
CREATE INDEX "PaymentMethod_organization_id_idx" ON "PaymentMethod"("organization_id");
CREATE INDEX "PaymentMethod_is_default_idx" ON "PaymentMethod"("is_default");
CREATE INDEX "PaymentMethod_organization_id_is_default_idx" ON "PaymentMethod"("organization_id", "is_default");

-- ========================================
-- ADD FOREIGN KEYS
-- ========================================

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ========================================
-- SEED DEFAULT PLANS
-- ========================================

-- Insert default plans with JSONB features/limits
INSERT INTO "Plan" ("id", "name", "price_monthly", "price_yearly", "features", "limits", "is_active", "created_at", "updated_at")
VALUES
  (
    'plan_starter',
    'Starter',
    29.00,
    290.00,
    '{"api_access": false, "advanced_analytics": false, "priority_support": false, "custom_export": false, "white_label": false}'::jsonb,
    '{"api_calls": 1000, "storage_gb": 5, "try_on_sessions": 500, "3d_renders": 100, "ai_generations": 50, "team_members": 1, "projects": 3}'::jsonb,
    true,
    NOW(),
    NOW()
  ),
  (
    'plan_professional',
    'Professional',
    99.00,
    990.00,
    '{"api_access": true, "advanced_analytics": false, "priority_support": true, "custom_export": false, "white_label": true}'::jsonb,
    '{"api_calls": 10000, "storage_gb": 50, "try_on_sessions": 5000, "3d_renders": 1000, "ai_generations": 500, "team_members": 5, "projects": 10}'::jsonb,
    true,
    NOW(),
    NOW()
  ),
  (
    'plan_enterprise',
    'Enterprise',
    299.00,
    2990.00,
    '{"api_access": true, "advanced_analytics": true, "priority_support": true, "custom_export": true, "white_label": true}'::jsonb,
    '{"api_calls": -1, "storage_gb": -1, "try_on_sessions": -1, "3d_renders": -1, "ai_generations": -1, "team_members": -1, "projects": -1}'::jsonb,
    true,
    NOW(),
    NOW()
  )
ON CONFLICT ("id") DO NOTHING;
