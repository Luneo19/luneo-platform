-- Migration: Add Marketplace models (Artisan, WorkOrder, SLA, Payout)
-- Date: 2025-12-18

-- ========================================
-- ARTISAN MODEL
-- ========================================
CREATE TABLE IF NOT EXISTS "Artisan" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "businessName" TEXT NOT NULL,
  "legalName" TEXT,
  "taxId" TEXT,
  "address" JSONB,
  "phone" TEXT,
  "email" TEXT,
  "website" TEXT,
  
  -- KYC/KYB
  "kycStatus" TEXT DEFAULT 'pending' CHECK ("kycStatus" IN ('pending', 'verified', 'rejected', 'suspended')),
  "kycVerifiedAt" TIMESTAMP(3),
  "kycDocuments" JSONB,
  
  -- Stripe Connect
  "stripeAccountId" TEXT,
  "stripeAccountStatus" TEXT,
  "onboardingCompleted" BOOLEAN DEFAULT false,
  
  -- Capacités
  "maxVolume" INTEGER DEFAULT 10, -- Commandes simultanées max
  "currentLoad" INTEGER DEFAULT 0, -- Commandes en cours
  "averageLeadTime" INTEGER DEFAULT 7, -- Jours moyens
  "minOrderValue" INTEGER DEFAULT 0, -- Valeur minimale commande (cents)
  
  -- Matériaux supportés
  "supportedMaterials" TEXT[],
  "supportedTechniques" TEXT[],
  "supportedZones" TEXT[],
  
  -- Qualité & Performance
  "qualityScore" DOUBLE PRECISION DEFAULT 5.0,
  "totalOrders" INTEGER DEFAULT 0,
  "completedOrders" INTEGER DEFAULT 0,
  "onTimeDeliveryRate" DOUBLE PRECISION DEFAULT 1.0,
  "defectRate" DOUBLE PRECISION DEFAULT 0.0,
  "returnRate" DOUBLE PRECISION DEFAULT 0.0,
  
  -- SLA
  "slaLevel" TEXT DEFAULT 'standard' CHECK ("slaLevel" IN ('basic', 'standard', 'premium', 'enterprise')),
  "slaPenalties" JSONB DEFAULT '{}',
  "slaBonuses" JSONB DEFAULT '{}',
  
  -- Status
  "status" TEXT DEFAULT 'active' CHECK ("status" IN ('active', 'inactive', 'suspended', 'quarantined')),
  "quarantineReason" TEXT,
  "quarantineUntil" TIMESTAMP(3),
  
  -- Settings
  "settings" JSONB DEFAULT '{}',
  "payoutSchedule" TEXT DEFAULT 'weekly' CHECK ("payoutSchedule" IN ('daily', 'weekly', 'biweekly', 'monthly')),
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Artisan_userId_key" ON "Artisan"("userId");
CREATE INDEX IF NOT EXISTS "Artisan_kycStatus_idx" ON "Artisan"("kycStatus");
CREATE INDEX IF NOT EXISTS "Artisan_status_idx" ON "Artisan"("status");
CREATE INDEX IF NOT EXISTS "Artisan_qualityScore_idx" ON "Artisan"("qualityScore" DESC);
CREATE INDEX IF NOT EXISTS "Artisan_stripeAccountId_idx" ON "Artisan"("stripeAccountId");

-- ========================================
-- ARTISAN CAPABILITY
-- ========================================
CREATE TABLE IF NOT EXISTS "ArtisanCapability" (
  "id" TEXT NOT NULL,
  "artisanId" TEXT NOT NULL,
  "material" TEXT NOT NULL,
  "technique" TEXT NOT NULL,
  "maxSize" DOUBLE PRECISION,
  "minSize" DOUBLE PRECISION,
  "leadTime" INTEGER, -- Jours
  "costMultiplier" DOUBLE PRECISION DEFAULT 1.0,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ArtisanCapability_artisanId_idx" ON "ArtisanCapability"("artisanId");
CREATE INDEX IF NOT EXISTS "ArtisanCapability_material_idx" ON "ArtisanCapability"("material");
CREATE INDEX IF NOT EXISTS "ArtisanCapability_technique_idx" ON "ArtisanCapability"("technique");

-- ========================================
-- WORK ORDER
-- ========================================
CREATE TABLE IF NOT EXISTS "WorkOrder" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "artisanId" TEXT NOT NULL,
  "quoteId" TEXT,
  
  -- Routing
  "routingScore" DOUBLE PRECISION,
  "routingReason" TEXT,
  "selectedAt" TIMESTAMP(3),
  
  -- Production
  "status" TEXT DEFAULT 'assigned' CHECK ("status" IN ('assigned', 'accepted', 'in_progress', 'qc_pending', 'qc_passed', 'qc_failed', 'shipped', 'completed', 'cancelled')),
  "acceptedAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "estimatedCompletion" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  
  -- SLA
  "slaDeadline" TIMESTAMP(3),
  "slaMet" BOOLEAN,
  "slaPenaltyCents" INTEGER DEFAULT 0,
  "slaBonusCents" INTEGER DEFAULT 0,
  
  -- Financial
  "payoutAmountCents" INTEGER,
  "commissionCents" INTEGER,
  "payoutStatus" TEXT DEFAULT 'pending' CHECK ("payoutStatus" IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
  "payoutId" TEXT,
  
  -- QC
  "qcScore" DOUBLE PRECISION,
  "qcPassed" BOOLEAN,
  "qcIssues" TEXT[],
  "qcReportId" TEXT,
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WorkOrder_orderId_key" ON "WorkOrder"("orderId");
CREATE INDEX IF NOT EXISTS "WorkOrder_artisanId_idx" ON "WorkOrder"("artisanId");
CREATE INDEX IF NOT EXISTS "WorkOrder_status_idx" ON "WorkOrder"("status");
CREATE INDEX IF NOT EXISTS "WorkOrder_slaDeadline_idx" ON "WorkOrder"("slaDeadline");
CREATE INDEX IF NOT EXISTS "WorkOrder_payoutStatus_idx" ON "WorkOrder"("payoutStatus");

-- ========================================
-- QUOTE (Multi-offres artisan)
-- ========================================
CREATE TABLE IF NOT EXISTS "Quote" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "artisanId" TEXT NOT NULL,
  
  -- Pricing
  "priceCents" INTEGER NOT NULL,
  "leadTime" INTEGER NOT NULL, -- Jours
  "breakdown" JSONB,
  
  -- Scoring
  "qualityScore" DOUBLE PRECISION,
  "costScore" DOUBLE PRECISION,
  "leadTimeScore" DOUBLE PRECISION,
  "distanceScore" DOUBLE PRECISION,
  "overallScore" DOUBLE PRECISION,
  
  -- Status
  "status" TEXT DEFAULT 'pending' CHECK ("status" IN ('pending', 'selected', 'rejected', 'expired')),
  "selectedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Quote_orderId_idx" ON "Quote"("orderId");
CREATE INDEX IF NOT EXISTS "Quote_artisanId_idx" ON "Quote"("artisanId");
CREATE INDEX IF NOT EXISTS "Quote_status_idx" ON "Quote"("status");
CREATE INDEX IF NOT EXISTS "Quote_overallScore_idx" ON "Quote"("overallScore" DESC);

-- ========================================
-- SLA RECORD
-- ========================================
CREATE TABLE IF NOT EXISTS "SLARecord" (
  "id" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "artisanId" TEXT NOT NULL,
  
  -- SLA Metrics
  "deadline" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "onTime" BOOLEAN,
  "delayHours" INTEGER,
  
  -- Penalties & Bonuses
  "penaltyCents" INTEGER DEFAULT 0,
  "bonusCents" INTEGER DEFAULT 0,
  "reason" TEXT,
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SLARecord_workOrderId_idx" ON "SLARecord"("workOrderId");
CREATE INDEX IF NOT EXISTS "SLARecord_artisanId_idx" ON "SLARecord"("artisanId");
CREATE INDEX IF NOT EXISTS "SLARecord_onTime_idx" ON "SLARecord"("onTime");

-- ========================================
-- PAYOUT
-- ========================================
CREATE TABLE IF NOT EXISTS "Payout" (
  "id" TEXT NOT NULL,
  "artisanId" TEXT NOT NULL,
  "stripeTransferId" TEXT,
  
  -- Amount
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT DEFAULT 'EUR',
  "feesCents" INTEGER DEFAULT 0,
  "netAmountCents" INTEGER NOT NULL,
  
  -- Period
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "workOrderIds" TEXT[],
  
  -- Status
  "status" TEXT DEFAULT 'pending' CHECK ("status" IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
  "paidAt" TIMESTAMP(3),
  "failureReason" TEXT,
  
  -- Reserve (fraude/retours)
  "reserveCents" INTEGER DEFAULT 0,
  "reserveReleaseAt" TIMESTAMP(3),
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Payout_artisanId_idx" ON "Payout"("artisanId");
CREATE INDEX IF NOT EXISTS "Payout_status_idx" ON "Payout"("status");
CREATE INDEX IF NOT EXISTS "Payout_periodStart_idx" ON "Payout"("periodStart");
CREATE INDEX IF NOT EXISTS "Payout_stripeTransferId_idx" ON "Payout"("stripeTransferId");

-- ========================================
-- FOREIGN KEYS
-- ========================================
ALTER TABLE "Artisan" ADD CONSTRAINT "Artisan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArtisanCapability" ADD CONSTRAINT "ArtisanCapability_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "Artisan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "Artisan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "Artisan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SLARecord" ADD CONSTRAINT "SLARecord_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SLARecord" ADD CONSTRAINT "SLARecord_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "Artisan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "Artisan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;






























