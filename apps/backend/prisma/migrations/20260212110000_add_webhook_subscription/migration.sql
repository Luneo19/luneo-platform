-- CreateTable
CREATE TABLE "WebhookSubscription" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebhookSubscription_brandId_event_idx" ON "WebhookSubscription"("brandId", "event");

-- CreateIndex
CREATE INDEX "WebhookSubscription_isActive_idx" ON "WebhookSubscription"("isActive");

-- AddForeignKey
ALTER TABLE "WebhookSubscription" ADD CONSTRAINT "WebhookSubscription_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
