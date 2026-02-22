-- AlterTable
ALTER TABLE "CreditTransaction" ADD COLUMN "expires_at" TIMESTAMP(3);
ALTER TABLE "CreditTransaction" ADD COLUMN "expired_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "CreditTransaction_expires_at_idx" ON "CreditTransaction"("expires_at");
CREATE INDEX "CreditTransaction_expired_at_idx" ON "CreditTransaction"("expired_at");
