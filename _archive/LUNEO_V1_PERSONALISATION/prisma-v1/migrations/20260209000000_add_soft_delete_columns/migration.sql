-- Add soft-delete (deletedAt) columns and other missing columns.
-- Brand already has deletedAt from a previous migration.
-- Workspace and Project tables may not exist yet (created by later migrations).

-- AlterTable: User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notificationPreferences" JSONB;

-- AlterTable: Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable: Design
ALTER TABLE "Design" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable: Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable: Generation
ALTER TABLE "Generation" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- CreateIndex (soft-delete indexes for efficient queries on active records)
CREATE INDEX IF NOT EXISTS "User_deletedAt_idx" ON "User"("deletedAt");
CREATE INDEX IF NOT EXISTS "Product_deletedAt_idx" ON "Product"("deletedAt");
CREATE INDEX IF NOT EXISTS "Design_deletedAt_idx" ON "Design"("deletedAt");
CREATE INDEX IF NOT EXISTS "Order_deletedAt_idx" ON "Order"("deletedAt");
CREATE INDEX IF NOT EXISTS "Generation_deletedAt_idx" ON "Generation"("deletedAt");
