-- AlterTable: Add session metadata columns to RefreshToken
-- SECURITY FIX: Store IP address, user agent, and device info for session tracking
ALTER TABLE "RefreshToken" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "RefreshToken" ADD COLUMN "userAgent" TEXT;
ALTER TABLE "RefreshToken" ADD COLUMN "deviceInfo" TEXT;
