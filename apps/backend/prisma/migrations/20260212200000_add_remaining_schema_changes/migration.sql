-- Consolidated migration: Brand grace/readonly fields, PrintOrder table, MarketplacePurchase commission columns
-- All changes are additive and use IF NOT EXISTS / DO blocks for idempotency where applicable.

-- 1) Brand: grace period and read-only mode (billing failure handling)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Brand' AND column_name = 'gracePeriodEndsAt') THEN
    ALTER TABLE "Brand" ADD COLUMN "gracePeriodEndsAt" TIMESTAMP(3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Brand' AND column_name = 'readOnlyMode') THEN
    ALTER TABLE "Brand" ADD COLUMN "readOnlyMode" BOOLEAN NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Brand' AND column_name = 'lastGraceReminderDay') THEN
    ALTER TABLE "Brand" ADD COLUMN "lastGraceReminderDay" INTEGER;
  END IF;
END $$;

-- 2) PrintOrder table (print-on-demand)
CREATE TABLE IF NOT EXISTS "PrintOrder" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "brandId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerOrderId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "trackingNumber" TEXT,
  "trackingUrl" TEXT,
  "items" JSONB NOT NULL,
  "shippingAddress" JSONB NOT NULL,
  "providerCost" INTEGER NOT NULL DEFAULT 0,
  "luneoMargin" INTEGER NOT NULL DEFAULT 0,
  "brandMargin" INTEGER NOT NULL DEFAULT 0,
  "totalPrice" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PrintOrder_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PrintOrder_orderId_idx') THEN
    CREATE INDEX "PrintOrder_orderId_idx" ON "PrintOrder"("orderId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PrintOrder_brandId_idx') THEN
    CREATE INDEX "PrintOrder_brandId_idx" ON "PrintOrder"("brandId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PrintOrder_providerOrderId_idx') THEN
    CREATE INDEX "PrintOrder_providerOrderId_idx" ON "PrintOrder"("providerOrderId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PrintOrder_status_idx') THEN
    CREATE INDEX "PrintOrder_status_idx" ON "PrintOrder"("status");
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'PrintOrder_orderId_fkey' AND table_name = 'PrintOrder') THEN
    ALTER TABLE "PrintOrder" ADD CONSTRAINT "PrintOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'PrintOrder_brandId_fkey' AND table_name = 'PrintOrder') THEN
    ALTER TABLE "PrintOrder" ADD CONSTRAINT "PrintOrder_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 3) MarketplacePurchase: commission columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'MarketplacePurchase' AND column_name = 'commissionPercent') THEN
    ALTER TABLE "MarketplacePurchase" ADD COLUMN "commissionPercent" INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'MarketplacePurchase' AND column_name = 'commissionCents') THEN
    ALTER TABLE "MarketplacePurchase" ADD COLUMN "commissionCents" INTEGER;
  END IF;
END $$;
