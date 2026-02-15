-- ============================================================
-- Migration: Add CSAT (Customer Satisfaction) fields to Ticket table
-- Date: 2026-02-15
-- Description: Adds missing CSAT rating, comment, and submission timestamp columns
-- ============================================================

-- Add CSAT rating column (1-5 rating, nullable)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Ticket' AND column_name = 'csatRating'
    ) THEN
        ALTER TABLE "Ticket" ADD COLUMN "csatRating" INTEGER;
    END IF;
END $$;

-- Add CSAT comment column (optional feedback, nullable)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Ticket' AND column_name = 'csatComment'
    ) THEN
        ALTER TABLE "Ticket" ADD COLUMN "csatComment" TEXT;
    END IF;
END $$;

-- Add CSAT submission timestamp column (when CSAT was submitted, nullable)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Ticket' AND column_name = 'csatSubmittedAt'
    ) THEN
        ALTER TABLE "Ticket" ADD COLUMN "csatSubmittedAt" TIMESTAMP(3);
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN "Ticket"."csatRating" IS 'Customer Satisfaction rating (1-5 scale)';
COMMENT ON COLUMN "Ticket"."csatComment" IS 'Optional feedback comment from customer';
COMMENT ON COLUMN "Ticket"."csatSubmittedAt" IS 'Timestamp when CSAT was submitted';
