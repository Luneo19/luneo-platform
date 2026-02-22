-- Migration: Analytics TimescaleDB
-- Convert AnalyticsEvent to TimescaleDB hypertable for performance
-- Keep only essential analytics features

-- Enable TimescaleDB extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert AnalyticsEvent to hypertable
-- Note: This requires TimescaleDB to be installed on the database
-- If TimescaleDB is not available, this will fail gracefully

-- First, ensure the table exists (should already exist from previous migrations)
-- Then convert to hypertable if TimescaleDB is available

DO $$
BEGIN
  -- Check if TimescaleDB is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
    -- Convert to hypertable with timestamp partitioning
    PERFORM create_hypertable(
      'AnalyticsEvent',
      'timestamp',
      chunk_time_interval => INTERVAL '1 day',
      if_not_exists => TRUE
    );
    
    RAISE NOTICE 'AnalyticsEvent converted to TimescaleDB hypertable';
  ELSE
    RAISE NOTICE 'TimescaleDB not available, skipping hypertable conversion';
  END IF;
END $$;

-- Create indexes optimized for time-series queries
CREATE INDEX IF NOT EXISTS idx_analytics_event_brand_timestamp 
  ON "AnalyticsEvent" (brand_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type_timestamp 
  ON "AnalyticsEvent" (event_type, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_event_user_timestamp 
  ON "AnalyticsEvent" (user_id, timestamp DESC) 
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_event_session_timestamp 
  ON "AnalyticsEvent" (session_id, timestamp DESC) 
  WHERE session_id IS NOT NULL;

-- Add comment
COMMENT ON TABLE "AnalyticsEvent" IS 'Analytics events table optimized with TimescaleDB for time-series queries';
