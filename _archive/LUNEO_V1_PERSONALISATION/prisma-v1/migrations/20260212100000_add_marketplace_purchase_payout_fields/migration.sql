-- CreateEnum
CREATE TYPE "MarketplacePayoutStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "MarketplacePurchase" ADD COLUMN     "payoutScheduledAt" TIMESTAMP(3),
ADD COLUMN     "payoutStatus" "MarketplacePayoutStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "paidOutAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "MarketplacePurchase_payoutScheduledAt_payoutStatus_idx" ON "MarketplacePurchase"("payoutScheduledAt", "payoutStatus");
