-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING');

-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CustomizationType" AS ENUM ('TEXT', 'IMAGE', 'COLOR', 'PATTERN', 'FONT', 'SIZE', 'POSITION');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WebhookEvent" AS ENUM ('GENERATION_STARTED', 'GENERATION_COMPLETED', 'GENERATION_FAILED', 'AR_VIEW');

-- DropIndex
DROP INDEX "Webhook_createdAt_idx";

-- DropIndex
DROP INDEX "Webhook_event_idx";

-- DropIndex
DROP INDEX "Webhook_idempotencyKey_idx";

-- DropIndex
DROP INDEX "Webhook_idempotencyKey_key";

-- DropIndex
DROP INDEX "Webhook_success_idx";

-- DropIndex
DROP INDEX "WebhookLog_shopDomain_idx";

-- DropIndex
DROP INDEX "WebhookLog_status_idx";

-- DropIndex
DROP INDEX "WebhookLog_topic_idx";

-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "arEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "maxMonthlyGenerations" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "maxProducts" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "monthlyGenerations" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
ADD COLUMN     "trialEndsAt" TIMESTAMP(3),
ADD COLUMN     "whiteLabel" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "aiProvider" TEXT NOT NULL DEFAULT 'openai',
ADD COLUMN     "arEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "arOffset" JSONB,
ADD COLUMN     "arScale" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "arTrackingType" TEXT NOT NULL DEFAULT 'surface',
ADD COLUMN     "baseImage" TEXT,
ADD COLUMN     "baseImageUrl" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "generationQuality" TEXT NOT NULL DEFAULT 'standard',
ADD COLUMN     "negativePrompt" TEXT,
ADD COLUMN     "outputFormat" TEXT NOT NULL DEFAULT 'png',
ADD COLUMN     "outputHeight" INTEGER NOT NULL DEFAULT 1024,
ADD COLUMN     "outputWidth" INTEGER NOT NULL DEFAULT 1024,
ADD COLUMN     "promptTemplate" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "thumbnailUrl" TEXT;

-- Generate slugs for existing products
UPDATE "Product" 
SET "slug" = LOWER(REGEXP_REPLACE(COALESCE("name", 'product-' || "id"), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE "slug" IS NULL;

-- Make slug NOT NULL after generating values
ALTER TABLE "Product" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "Webhook" DROP COLUMN "error",
DROP COLUMN "event",
DROP COLUMN "idempotencyKey",
DROP COLUMN "payload",
DROP COLUMN "statusCode",
DROP COLUMN "success",
DROP COLUMN "timestamp",
ADD COLUMN     "events" "WebhookEvent"[],
ADD COLUMN     "failureCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastCalledAt" TIMESTAMP(3),
ADD COLUMN     "lastStatusCode" INTEGER,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "secret" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- Set default values for existing webhooks
UPDATE "Webhook" 
SET "name" = COALESCE("name", 'Webhook ' || "id"),
    "secret" = COALESCE("secret", gen_random_uuid()::text),
    "updatedAt" = COALESCE("updatedAt", NOW())
WHERE "name" IS NULL OR "secret" IS NULL OR "updatedAt" IS NULL;

-- Make fields NOT NULL after setting values
ALTER TABLE "Webhook" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "Webhook" ALTER COLUMN "secret" SET NOT NULL;
ALTER TABLE "Webhook" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "WebhookLog" DROP COLUMN "processedAt",
DROP COLUMN "shopDomain",
DROP COLUMN "status",
DROP COLUMN "topic",
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "error" TEXT,
ADD COLUMN     "event" TEXT NOT NULL,
ADD COLUMN     "response" TEXT,
ADD COLUMN     "statusCode" INTEGER;

-- CreateTable
CREATE TABLE "ClientSettings" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#000000',
    "secondaryColor" TEXT NOT NULL DEFAULT '#ffffff',
    "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
    "borderRadius" INTEGER NOT NULL DEFAULT 8,
    "defaultAiProvider" TEXT NOT NULL DEFAULT 'openai',
    "customApiKey" TEXT,
    "defaultQuality" TEXT NOT NULL DEFAULT 'standard',
    "defaultStyle" TEXT NOT NULL DEFAULT 'realistic',
    "arTrackingType" TEXT NOT NULL DEFAULT 'face',
    "arQuality" TEXT NOT NULL DEFAULT 'medium',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "webhookEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomizationZone" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CustomizationType" NOT NULL,
    "positionX" DOUBLE PRECISION NOT NULL,
    "positionY" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxLength" INTEGER,
    "allowedChars" TEXT,
    "allowedFonts" TEXT[],
    "allowedColors" TEXT[],
    "minSize" INTEGER,
    "maxSize" INTEGER,
    "defaultValue" TEXT,
    "defaultFont" TEXT,
    "defaultColor" TEXT,
    "defaultSize" INTEGER,
    "renderStyle" TEXT NOT NULL DEFAULT 'engraved',
    "order" INTEGER NOT NULL DEFAULT 0,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomizationZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "promptTemplate" TEXT NOT NULL,
    "negativePrompt" TEXT,
    "variables" JSONB NOT NULL,
    "aiProvider" TEXT NOT NULL DEFAULT 'openai',
    "model" TEXT NOT NULL DEFAULT 'dall-e-3',
    "quality" TEXT NOT NULL DEFAULT 'standard',
    "style" TEXT NOT NULL DEFAULT 'natural',
    "exampleOutputs" TEXT[],
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Generation" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "sessionId" TEXT,
    "customizations" JSONB NOT NULL,
    "userPrompt" TEXT,
    "finalPrompt" TEXT NOT NULL,
    "negativePrompt" TEXT,
    "aiProvider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "quality" TEXT NOT NULL,
    "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING',
    "outputUrl" TEXT,
    "thumbnailUrl" TEXT,
    "arModelUrl" TEXT,
    "aiResponse" JSONB,
    "processingTime" INTEGER,
    "tokensUsed" INTEGER,
    "cost" DECIMAL(10,6),
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "viewedInAr" BOOLEAN NOT NULL DEFAULT false,
    "arViewCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "sharedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Generation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "stripeInvoiceId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "status" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageRecord" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientSettings_brandId_key" ON "ClientSettings"("brandId");

-- CreateIndex
CREATE INDEX "ClientSettings_brandId_idx" ON "ClientSettings"("brandId");

-- CreateIndex
CREATE INDEX "CustomizationZone_productId_idx" ON "CustomizationZone"("productId");

-- CreateIndex
CREATE INDEX "CustomizationZone_productId_order_idx" ON "CustomizationZone"("productId", "order");

-- CreateIndex
CREATE INDEX "Template_brandId_idx" ON "Template"("brandId");

-- CreateIndex
CREATE INDEX "Template_productId_idx" ON "Template"("productId");

-- CreateIndex
CREATE INDEX "Template_brandId_isActive_idx" ON "Template"("brandId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Generation_publicId_key" ON "Generation"("publicId");

-- CreateIndex
CREATE INDEX "Generation_brandId_idx" ON "Generation"("brandId");

-- CreateIndex
CREATE INDEX "Generation_productId_idx" ON "Generation"("productId");

-- CreateIndex
CREATE INDEX "Generation_publicId_idx" ON "Generation"("publicId");

-- CreateIndex
CREATE INDEX "Generation_status_idx" ON "Generation"("status");

-- CreateIndex
CREATE INDEX "Generation_createdAt_idx" ON "Generation"("createdAt");

-- CreateIndex
CREATE INDEX "Generation_sessionId_idx" ON "Generation"("sessionId");

-- CreateIndex
CREATE INDEX "Generation_brandId_status_idx" ON "Generation"("brandId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_stripeInvoiceId_key" ON "Invoice"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "Invoice_brandId_idx" ON "Invoice"("brandId");

-- CreateIndex
CREATE INDEX "Invoice_stripeInvoiceId_idx" ON "Invoice"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_createdAt_idx" ON "Invoice"("createdAt");

-- CreateIndex
CREATE INDEX "UsageRecord_brandId_idx" ON "UsageRecord"("brandId");

-- CreateIndex
CREATE INDEX "UsageRecord_recordedAt_idx" ON "UsageRecord"("recordedAt");

-- CreateIndex
CREATE INDEX "UsageRecord_type_idx" ON "UsageRecord"("type");

-- CreateIndex
CREATE INDEX "UsageRecord_brandId_type_recordedAt_idx" ON "UsageRecord"("brandId", "type", "recordedAt");

-- CreateIndex
CREATE INDEX "Brand_subscriptionPlan_idx" ON "Brand"("subscriptionPlan");

-- CreateIndex
CREATE INDEX "Brand_subscriptionStatus_idx" ON "Brand"("subscriptionStatus");

-- CreateIndex
CREATE INDEX "Brand_deletedAt_idx" ON "Brand"("deletedAt");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Product_brandId_slug_key" ON "Product"("brandId", "slug");

-- CreateIndex
CREATE INDEX "Webhook_isActive_idx" ON "Webhook"("isActive");

-- CreateIndex
CREATE INDEX "Webhook_events_idx" ON "Webhook"("events");

-- CreateIndex
CREATE INDEX "WebhookLog_event_idx" ON "WebhookLog"("event");

-- AddForeignKey
ALTER TABLE "ClientSettings" ADD CONSTRAINT "ClientSettings_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomizationZone" ADD CONSTRAINT "CustomizationZone_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookLog" ADD CONSTRAINT "WebhookLog_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "Webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Generation" ADD CONSTRAINT "Generation_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Generation" ADD CONSTRAINT "Generation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

