/*
  Warnings:

  - You are about to drop the column `events` on the `Webhook` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Webhook` table. All the data in the column will be lost.
  - You are about to drop the column `lastTriggeredAt` on the `Webhook` table. All the data in the column will be lost.
  - You are about to drop the column `secret` on the `Webhook` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Webhook` table. All the data in the column will be lost.
  - Added the required column `event` to the `Webhook` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payload` to the `Webhook` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Webhook_isActive_idx";

-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "permissions" TEXT[],
ADD COLUMN     "rateLimit" JSONB,
ADD COLUMN     "secret" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "baseCostCents" INTEGER,
ADD COLUMN     "finishOptions" JSONB,
ADD COLUMN     "laborCostCents" INTEGER,
ADD COLUMN     "materialOptions" JSONB,
ADD COLUMN     "overheadCostCents" INTEGER,
ADD COLUMN     "productionTime" INTEGER,
ADD COLUMN     "rulesJson" JSONB;

-- AlterTable
ALTER TABLE "Webhook" DROP COLUMN "events",
DROP COLUMN "isActive",
DROP COLUMN "lastTriggeredAt",
DROP COLUMN "secret",
DROP COLUMN "updatedAt",
ADD COLUMN     "error" TEXT,
ADD COLUMN     "event" TEXT NOT NULL,
ADD COLUMN     "payload" JSONB NOT NULL,
ADD COLUMN     "statusCode" INTEGER,
ADD COLUMN     "success" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "RenderResult" (
    "id" TEXT NOT NULL,
    "renderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "url" TEXT,
    "thumbnailUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RenderResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RenderProgress" (
    "id" TEXT NOT NULL,
    "renderId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RenderProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RenderError" (
    "id" TEXT NOT NULL,
    "renderId" TEXT NOT NULL,
    "error" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RenderError_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportResult" (
    "id" TEXT NOT NULL,
    "renderId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExportResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionStatus" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "currentStage" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityReport" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "issues" TEXT[],
    "recommendations" TEXT[],
    "passed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualityReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchRenderProgress" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "completed" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "percentage" INTEGER NOT NULL,
    "results" JSONB,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchRenderProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcommerceIntegration" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "config" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EcommerceIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMapping" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "luneoProductId" TEXT NOT NULL,
    "externalProductId" TEXT NOT NULL,
    "externalSku" TEXT NOT NULL,
    "syncStatus" TEXT NOT NULL DEFAULT 'synced',
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "ProductMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "itemsFailed" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "duration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RenderResult_renderId_key" ON "RenderResult"("renderId");

-- CreateIndex
CREATE INDEX "RenderResult_renderId_idx" ON "RenderResult"("renderId");

-- CreateIndex
CREATE INDEX "RenderResult_type_idx" ON "RenderResult"("type");

-- CreateIndex
CREATE INDEX "RenderResult_status_idx" ON "RenderResult"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RenderProgress_renderId_key" ON "RenderProgress"("renderId");

-- CreateIndex
CREATE INDEX "RenderProgress_renderId_idx" ON "RenderProgress"("renderId");

-- CreateIndex
CREATE INDEX "RenderError_renderId_idx" ON "RenderError"("renderId");

-- CreateIndex
CREATE UNIQUE INDEX "ExportResult_renderId_key" ON "ExportResult"("renderId");

-- CreateIndex
CREATE INDEX "ExportResult_renderId_idx" ON "ExportResult"("renderId");

-- CreateIndex
CREATE INDEX "ExportResult_format_idx" ON "ExportResult"("format");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionStatus_orderId_key" ON "ProductionStatus"("orderId");

-- CreateIndex
CREATE INDEX "ProductionStatus_orderId_idx" ON "ProductionStatus"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "QualityReport_orderId_key" ON "QualityReport"("orderId");

-- CreateIndex
CREATE INDEX "QualityReport_orderId_idx" ON "QualityReport"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "BatchRenderProgress_batchId_key" ON "BatchRenderProgress"("batchId");

-- CreateIndex
CREATE INDEX "BatchRenderProgress_batchId_idx" ON "BatchRenderProgress"("batchId");

-- CreateIndex
CREATE INDEX "EcommerceIntegration_brandId_idx" ON "EcommerceIntegration"("brandId");

-- CreateIndex
CREATE INDEX "EcommerceIntegration_platform_idx" ON "EcommerceIntegration"("platform");

-- CreateIndex
CREATE INDEX "EcommerceIntegration_shopDomain_idx" ON "EcommerceIntegration"("shopDomain");

-- CreateIndex
CREATE INDEX "EcommerceIntegration_status_idx" ON "EcommerceIntegration"("status");

-- CreateIndex
CREATE INDEX "ProductMapping_integrationId_idx" ON "ProductMapping"("integrationId");

-- CreateIndex
CREATE INDEX "ProductMapping_luneoProductId_idx" ON "ProductMapping"("luneoProductId");

-- CreateIndex
CREATE INDEX "ProductMapping_externalProductId_idx" ON "ProductMapping"("externalProductId");

-- CreateIndex
CREATE INDEX "ProductMapping_externalSku_idx" ON "ProductMapping"("externalSku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductMapping_integrationId_externalProductId_key" ON "ProductMapping"("integrationId", "externalProductId");

-- CreateIndex
CREATE INDEX "SyncLog_integrationId_idx" ON "SyncLog"("integrationId");

-- CreateIndex
CREATE INDEX "SyncLog_type_idx" ON "SyncLog"("type");

-- CreateIndex
CREATE INDEX "SyncLog_status_idx" ON "SyncLog"("status");

-- CreateIndex
CREATE INDEX "SyncLog_createdAt_idx" ON "SyncLog"("createdAt");

-- CreateIndex
CREATE INDEX "WebhookLog_webhookId_idx" ON "WebhookLog"("webhookId");

-- CreateIndex
CREATE INDEX "WebhookLog_topic_idx" ON "WebhookLog"("topic");

-- CreateIndex
CREATE INDEX "WebhookLog_shopDomain_idx" ON "WebhookLog"("shopDomain");

-- CreateIndex
CREATE INDEX "WebhookLog_status_idx" ON "WebhookLog"("status");

-- CreateIndex
CREATE INDEX "WebhookLog_createdAt_idx" ON "WebhookLog"("createdAt");

-- CreateIndex
CREATE INDEX "Webhook_event_idx" ON "Webhook"("event");

-- CreateIndex
CREATE INDEX "Webhook_success_idx" ON "Webhook"("success");

-- CreateIndex
CREATE INDEX "Webhook_createdAt_idx" ON "Webhook"("createdAt");

-- AddForeignKey
ALTER TABLE "EcommerceIntegration" ADD CONSTRAINT "EcommerceIntegration_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMapping" ADD CONSTRAINT "ProductMapping_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "EcommerceIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMapping" ADD CONSTRAINT "ProductMapping_luneoProductId_fkey" FOREIGN KEY ("luneoProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "EcommerceIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
