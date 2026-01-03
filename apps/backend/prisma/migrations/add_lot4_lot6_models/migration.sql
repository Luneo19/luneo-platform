-- Migration: Add Lot 4 (Marketplace) and Lot 6 (Trust & Safety + Analytics) models
-- Date: 2025-12-18

-- ========================================
-- MARKETPLACE (Lot 4)
-- ========================================

-- Artisan
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
  "kycStatus" TEXT DEFAULT 'pending',
  "kycVerifiedAt" TIMESTAMP(3),
  "kycDocuments" JSONB,
  "stripeAccountId" TEXT,
  "stripeAccountStatus" TEXT,
  "onboardingCompleted" BOOLEAN DEFAULT false,
  "maxVolume" INTEGER DEFAULT 10,
  "currentLoad" INTEGER DEFAULT 0,
  "averageLeadTime" INTEGER DEFAULT 7,
  "minOrderValue" INTEGER DEFAULT 0,
  "supportedMaterials" TEXT[],
  "supportedTechniques" TEXT[],
  "supportedZones" TEXT[],
  "qualityScore" DOUBLE PRECISION DEFAULT 5.0,
  "totalOrders" INTEGER DEFAULT 0,
  "completedOrders" INTEGER DEFAULT 0,
  "onTimeDeliveryRate" DOUBLE PRECISION DEFAULT 1.0,
  "defectRate" DOUBLE PRECISION DEFAULT 0.0,
  "returnRate" DOUBLE PRECISION DEFAULT 0.0,
  "slaLevel" TEXT DEFAULT 'standard',
  "slaPenalties" JSONB DEFAULT '{}',
  "slaBonuses" JSONB DEFAULT '{}',
  "status" TEXT DEFAULT 'active',
  "quarantineReason" TEXT,
  "quarantineUntil" TIMESTAMP(3),
  "settings" JSONB DEFAULT '{}',
  "payoutSchedule" TEXT DEFAULT 'weekly',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Artisan_userId_key" ON "Artisan"("userId");
CREATE INDEX IF NOT EXISTS "Artisan_kycStatus_idx" ON "Artisan"("kycStatus");
CREATE INDEX IF NOT EXISTS "Artisan_status_idx" ON "Artisan"("status");
CREATE INDEX IF NOT EXISTS "Artisan_qualityScore_idx" ON "Artisan"("qualityScore" DESC);
CREATE INDEX IF NOT EXISTS "Artisan_stripeAccountId_idx" ON "Artisan"("stripeAccountId");

-- ArtisanCapability
CREATE TABLE IF NOT EXISTS "ArtisanCapability" (
  "id" TEXT NOT NULL,
  "artisanId" TEXT NOT NULL,
  "material" TEXT NOT NULL,
  "technique" TEXT NOT NULL,
  "maxSize" DOUBLE PRECISION,
  "minSize" DOUBLE PRECISION,
  "leadTime" INTEGER,
  "costMultiplier" DOUBLE PRECISION DEFAULT 1.0,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ArtisanCapability_artisanId_idx" ON "ArtisanCapability"("artisanId");
CREATE INDEX IF NOT EXISTS "ArtisanCapability_material_idx" ON "ArtisanCapability"("material");
CREATE INDEX IF NOT EXISTS "ArtisanCapability_technique_idx" ON "ArtisanCapability"("technique");

-- WorkOrder
CREATE TABLE IF NOT EXISTS "WorkOrder" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "artisanId" TEXT NOT NULL,
  "quoteId" TEXT,
  "routingScore" DOUBLE PRECISION,
  "routingReason" TEXT,
  "selectedAt" TIMESTAMP(3),
  "status" TEXT DEFAULT 'assigned',
  "acceptedAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "estimatedCompletion" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "slaDeadline" TIMESTAMP(3),
  "slaMet" BOOLEAN,
  "slaPenaltyCents" INTEGER DEFAULT 0,
  "slaBonusCents" INTEGER DEFAULT 0,
  "payoutAmountCents" INTEGER,
  "commissionCents" INTEGER,
  "payoutStatus" TEXT DEFAULT 'pending',
  "payoutId" TEXT,
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

-- Quote
CREATE TABLE IF NOT EXISTS "Quote" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "artisanId" TEXT NOT NULL,
  "priceCents" INTEGER NOT NULL,
  "leadTime" INTEGER NOT NULL,
  "breakdown" JSONB,
  "qualityScore" DOUBLE PRECISION,
  "costScore" DOUBLE PRECISION,
  "leadTimeScore" DOUBLE PRECISION,
  "distanceScore" DOUBLE PRECISION,
  "overallScore" DOUBLE PRECISION,
  "status" TEXT DEFAULT 'pending',
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

-- SLARecord
CREATE TABLE IF NOT EXISTS "SLARecord" (
  "id" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "artisanId" TEXT NOT NULL,
  "deadline" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "onTime" BOOLEAN,
  "delayHours" INTEGER,
  "penaltyCents" INTEGER DEFAULT 0,
  "bonusCents" INTEGER DEFAULT 0,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SLARecord_workOrderId_key" ON "SLARecord"("workOrderId");
CREATE INDEX IF NOT EXISTS "SLARecord_artisanId_idx" ON "SLARecord"("artisanId");
CREATE INDEX IF NOT EXISTS "SLARecord_onTime_idx" ON "SLARecord"("onTime");

-- Payout
CREATE TABLE IF NOT EXISTS "Payout" (
  "id" TEXT NOT NULL,
  "artisanId" TEXT NOT NULL,
  "stripeTransferId" TEXT,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT DEFAULT 'EUR',
  "feesCents" INTEGER DEFAULT 0,
  "netAmountCents" INTEGER NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "workOrderIds" TEXT[],
  "status" TEXT DEFAULT 'pending',
  "paidAt" TIMESTAMP(3),
  "failureReason" TEXT,
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
-- TRUST & SAFETY + ANALYTICS (Lot 6)
-- ========================================

-- ModerationRecord
CREATE TABLE IF NOT EXISTS "ModerationRecord" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "context" JSONB,
  "approved" BOOLEAN NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "categories" TEXT[],
  "reason" TEXT,
  "action" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ModerationRecord_type_idx" ON "ModerationRecord"("type");
CREATE INDEX IF NOT EXISTS "ModerationRecord_approved_idx" ON "ModerationRecord"("approved");
CREATE INDEX IF NOT EXISTS "ModerationRecord_createdAt_idx" ON "ModerationRecord"("createdAt");

-- IPClaim
CREATE TABLE IF NOT EXISTS "IPClaim" (
  "id" TEXT NOT NULL,
  "claimantName" TEXT NOT NULL,
  "claimantEmail" TEXT NOT NULL,
  "claimantType" TEXT NOT NULL,
  "designId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "evidence" TEXT[],
  "status" TEXT DEFAULT 'pending',
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "resolution" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IPClaim_designId_idx" ON "IPClaim"("designId");
CREATE INDEX IF NOT EXISTS "IPClaim_status_idx" ON "IPClaim"("status");
CREATE INDEX IF NOT EXISTS "IPClaim_createdAt_idx" ON "IPClaim"("createdAt");

-- Experiment
CREATE TABLE IF NOT EXISTS "Experiment" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "variants" JSONB NOT NULL,
  "status" TEXT DEFAULT 'draft',
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "targetAudience" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Experiment_status_idx" ON "Experiment"("status");
CREATE INDEX IF NOT EXISTS "Experiment_type_idx" ON "Experiment"("type");
CREATE INDEX IF NOT EXISTS "Experiment_startDate_idx" ON "Experiment"("startDate");

-- ExperimentAssignment
CREATE TABLE IF NOT EXISTS "ExperimentAssignment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "experimentId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ExperimentAssignment_userId_experimentId_key" ON "ExperimentAssignment"("userId", "experimentId");
CREATE INDEX IF NOT EXISTS "ExperimentAssignment_experimentId_idx" ON "ExperimentAssignment"("experimentId");
CREATE INDEX IF NOT EXISTS "ExperimentAssignment_variantId_idx" ON "ExperimentAssignment"("variantId");

-- Conversion
CREATE TABLE IF NOT EXISTS "Conversion" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "sessionId" TEXT NOT NULL,
  "experimentId" TEXT,
  "variantId" TEXT,
  "eventType" TEXT NOT NULL,
  "value" INTEGER,
  "attribution" JSONB NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Conversion_userId_idx" ON "Conversion"("userId");
CREATE INDEX IF NOT EXISTS "Conversion_sessionId_idx" ON "Conversion"("sessionId");
CREATE INDEX IF NOT EXISTS "Conversion_experimentId_idx" ON "Conversion"("experimentId");
CREATE INDEX IF NOT EXISTS "Conversion_eventType_idx" ON "Conversion"("eventType");
CREATE INDEX IF NOT EXISTS "Conversion_timestamp_idx" ON "Conversion"("timestamp");

-- Attribution
CREATE TABLE IF NOT EXISTS "Attribution" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "sessionId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "medium" TEXT,
  "campaign" TEXT,
  "term" TEXT,
  "content" TEXT,
  "referrer" TEXT,
  "landingPage" TEXT NOT NULL,
  "device" JSONB NOT NULL,
  "location" JSONB,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Attribution_userId_idx" ON "Attribution"("userId");
CREATE INDEX IF NOT EXISTS "Attribution_sessionId_idx" ON "Attribution"("sessionId");
CREATE INDEX IF NOT EXISTS "Attribution_source_idx" ON "Attribution"("source");
CREATE INDEX IF NOT EXISTS "Attribution_campaign_idx" ON "Attribution"("campaign");
CREATE INDEX IF NOT EXISTS "Attribution_timestamp_idx" ON "Attribution"("timestamp");

-- FraudCheck
CREATE TABLE IF NOT EXISTS "FraudCheck" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "email" TEXT,
  "ipAddress" TEXT,
  "deviceFingerprint" TEXT,
  "orderValue" INTEGER,
  "actionType" TEXT NOT NULL,
  "riskScore" INTEGER NOT NULL,
  "riskLevel" TEXT NOT NULL,
  "reasons" TEXT[],
  "action" TEXT NOT NULL,
  "checks" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FraudCheck_userId_idx" ON "FraudCheck"("userId");
CREATE INDEX IF NOT EXISTS "FraudCheck_email_idx" ON "FraudCheck"("email");
CREATE INDEX IF NOT EXISTS "FraudCheck_ipAddress_idx" ON "FraudCheck"("ipAddress");
CREATE INDEX IF NOT EXISTS "FraudCheck_riskLevel_idx" ON "FraudCheck"("riskLevel");
CREATE INDEX IF NOT EXISTS "FraudCheck_createdAt_idx" ON "FraudCheck"("createdAt");

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
ALTER TABLE "ExperimentAssignment" ADD CONSTRAINT "ExperimentAssignment_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversion" ADD CONSTRAINT "Conversion_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE SET NULL ON UPDATE CASCADE;




























