-- Add BUSINESS value to SubscriptionPlan enum
-- This value sits between PROFESSIONAL and ENTERPRISE
ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'BUSINESS' AFTER 'PROFESSIONAL';
