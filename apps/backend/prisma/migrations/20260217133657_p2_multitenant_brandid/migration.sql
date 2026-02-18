-- P2-6: Add brandId to Experiment, CustomerSegment, EmailCampaign, EmailAutomation for multi-tenancy
ALTER TABLE "Experiment" ADD COLUMN IF NOT EXISTS "brandId" TEXT;
ALTER TABLE "CustomerSegment" ADD COLUMN IF NOT EXISTS "brandId" TEXT;
ALTER TABLE "EmailCampaign" ADD COLUMN IF NOT EXISTS "brandId" TEXT;
ALTER TABLE "EmailAutomation" ADD COLUMN IF NOT EXISTS "brandId" TEXT;

-- Foreign keys (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Experiment_brandId_fkey') THEN
    ALTER TABLE "Experiment" ADD CONSTRAINT "Experiment_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CustomerSegment_brandId_fkey') THEN
    ALTER TABLE "CustomerSegment" ADD CONSTRAINT "CustomerSegment_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EmailCampaign_brandId_fkey') THEN
    ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EmailAutomation_brandId_fkey') THEN
    ALTER TABLE "EmailAutomation" ADD CONSTRAINT "EmailAutomation_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "Experiment_brandId_idx" ON "Experiment"("brandId");
CREATE INDEX IF NOT EXISTS "CustomerSegment_brandId_idx" ON "CustomerSegment"("brandId");
CREATE INDEX IF NOT EXISTS "EmailCampaign_brandId_idx" ON "EmailCampaign"("brandId");
CREATE INDEX IF NOT EXISTS "EmailAutomation_brandId_idx" ON "EmailAutomation"("brandId");
