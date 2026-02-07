-- NOTE: Duplicate of migration 20260104200755. Both are kept for migration history integrity.
-- Add name column to User table if it doesn't exist
-- This migration adds the optional name field that exists in the Prisma schema
-- but was missing from the initial migration

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'User' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "name" TEXT;
    RAISE NOTICE 'Column "name" added to User table';
  ELSE
    RAISE NOTICE 'Column "name" already exists in User table';
  END IF;
END $$;

