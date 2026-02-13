-- Repair migration: fix orion_agents.type column and customer_health_scores enum types
-- These tables may have been created via prisma db push before the typed migration,
-- so IF NOT EXISTS skipped them. This migration adds missing columns and fixes types.
-- All operations are idempotent.

-- ============================================================
-- 1) Ensure enums exist
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrionAgentType') THEN
    CREATE TYPE "OrionAgentType" AS ENUM ('ACQUISITION', 'ONBOARDING', 'COMMUNICATION', 'RETENTION', 'REVENUE', 'ANALYTICS', 'GENERAL');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrionAgentStatus') THEN
    CREATE TYPE "OrionAgentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'MAINTENANCE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ChurnRisk') THEN
    CREATE TYPE "ChurnRisk" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GrowthPotential') THEN
    CREATE TYPE "GrowthPotential" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
  END IF;
END $$;

-- ============================================================
-- 2) Add missing "type" column to orion_agents
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orion_agents' AND column_name = 'type'
  ) THEN
    ALTER TABLE "orion_agents" ADD COLUMN "type" "OrionAgentType" NOT NULL DEFAULT 'GENERAL';
  END IF;
END $$;

-- ============================================================
-- 3) Fix churnRisk column type on customer_health_scores
--    If it is text instead of the ChurnRisk enum, convert it.
-- ============================================================

DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_name = 'customer_health_scores' AND column_name = 'churnRisk';

  -- If column exists but is not USER-DEFINED (enum), convert it
  IF col_type IS NOT NULL AND col_type <> 'USER-DEFINED' THEN
    -- Set any NULL or invalid values to 'LOW' before conversion
    UPDATE "customer_health_scores"
    SET "churnRisk" = 'LOW'
    WHERE "churnRisk" IS NULL
       OR "churnRisk" NOT IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

    ALTER TABLE "customer_health_scores"
      ALTER COLUMN "churnRisk" SET DEFAULT 'LOW',
      ALTER COLUMN "churnRisk" TYPE "ChurnRisk" USING "churnRisk"::"ChurnRisk",
      ALTER COLUMN "churnRisk" SET NOT NULL;
  END IF;
END $$;

-- ============================================================
-- 4) Fix growthPotential column type on customer_health_scores
-- ============================================================

DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_name = 'customer_health_scores' AND column_name = 'growthPotential';

  IF col_type IS NOT NULL AND col_type <> 'USER-DEFINED' THEN
    UPDATE "customer_health_scores"
    SET "growthPotential" = 'MEDIUM'
    WHERE "growthPotential" IS NULL
       OR "growthPotential" NOT IN ('LOW', 'MEDIUM', 'HIGH');

    ALTER TABLE "customer_health_scores"
      ALTER COLUMN "growthPotential" SET DEFAULT 'MEDIUM',
      ALTER COLUMN "growthPotential" TYPE "GrowthPotential" USING "growthPotential"::"GrowthPotential",
      ALTER COLUMN "growthPotential" SET NOT NULL;
  END IF;
END $$;

-- ============================================================
-- 5) Fix status column type on orion_agents (if text instead of enum)
-- ============================================================

DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_name = 'orion_agents' AND column_name = 'status';

  IF col_type IS NOT NULL AND col_type <> 'USER-DEFINED' THEN
    UPDATE "orion_agents"
    SET "status" = 'PAUSED'
    WHERE "status" IS NULL
       OR "status" NOT IN ('ACTIVE', 'PAUSED', 'MAINTENANCE');

    ALTER TABLE "orion_agents"
      ALTER COLUMN "status" SET DEFAULT 'PAUSED',
      ALTER COLUMN "status" TYPE "OrionAgentStatus" USING "status"::"OrionAgentStatus",
      ALTER COLUMN "status" SET NOT NULL;
  END IF;
END $$;
