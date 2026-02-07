-- NOTE: Duplicate of migration 20260118161635. Both are kept for migration history integrity.
-- Add stripeSubscriptionId column to Brand table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Brand' AND column_name = 'stripeSubscriptionId'
    ) THEN
        ALTER TABLE "Brand" ADD COLUMN "stripeSubscriptionId" TEXT;
        CREATE INDEX IF NOT EXISTS "Brand_stripeSubscriptionId_idx" ON "Brand"("stripeSubscriptionId");
    END IF;
END $$;
