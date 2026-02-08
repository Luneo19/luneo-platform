-- Add soft-delete (deletedAt) columns to tables that are missing them.
-- Brand already has deletedAt from a previous migration.

-- AlterTable: User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable: Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable: Design
ALTER TABLE "Design" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable: Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable: Generation
ALTER TABLE "Generation" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable: Workspace
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable: Project
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- CreateIndex (soft-delete indexes for efficient queries on active records)
CREATE INDEX IF NOT EXISTS "User_deletedAt_idx" ON "User"("deletedAt");
CREATE INDEX IF NOT EXISTS "Product_deletedAt_idx" ON "Product"("deletedAt");
CREATE INDEX IF NOT EXISTS "Design_deletedAt_idx" ON "Design"("deletedAt");
CREATE INDEX IF NOT EXISTS "Order_deletedAt_idx" ON "Order"("deletedAt");
CREATE INDEX IF NOT EXISTS "Generation_deletedAt_idx" ON "Generation"("deletedAt");
CREATE INDEX IF NOT EXISTS "Workspace_deletedAt_idx" ON "Workspace"("deletedAt");
CREATE INDEX IF NOT EXISTS "Project_deletedAt_idx" ON "Project"("deletedAt");
