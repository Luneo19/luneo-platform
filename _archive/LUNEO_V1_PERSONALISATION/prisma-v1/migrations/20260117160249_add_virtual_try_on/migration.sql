-- Migration: Add Virtual Try-On Models
-- Date: 2025-01-17
-- Description: Adds TryOnConfiguration, TryOnSession, TryOnProductMapping, and TryOnScreenshot models

-- ========================================
-- CREATE ENUMS
-- ========================================

-- CreateEnum
CREATE TYPE "TryOnProductType" AS ENUM ('GLASSES', 'JEWELRY', 'WATCH', 'HAT', 'CLOTHING', 'SHOES');

-- ========================================
-- CREATE TABLES
-- ========================================

-- CreateTable: TryOnConfiguration
CREATE TABLE "TryOnConfiguration" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productType" "TryOnProductType" NOT NULL,
    "settings" JSONB NOT NULL,
    "uiConfig" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TryOnConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TryOnSession
CREATE TABLE "TryOnSession" (
    "id" TEXT NOT NULL,
    "configurationId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "deviceInfo" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "productsTried" JSONB[],
    "screenshotsTaken" INTEGER NOT NULL DEFAULT 0,
    "shared" BOOLEAN NOT NULL DEFAULT false,
    "converted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TryOnSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TryOnProductMapping
CREATE TABLE "TryOnProductMapping" (
    "id" TEXT NOT NULL,
    "configurationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "modelId" TEXT,
    "anchorPoints" JSONB,
    "scaleFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "adjustments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TryOnProductMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TryOnScreenshot
CREATE TABLE "TryOnScreenshot" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "sharedUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TryOnScreenshot_pkey" PRIMARY KEY ("id")
);

-- ========================================
-- CREATE INDEXES
-- ========================================

-- Indexes for TryOnConfiguration
CREATE INDEX "TryOnConfiguration_projectId_idx" ON "TryOnConfiguration"("projectId");
CREATE INDEX "TryOnConfiguration_isActive_idx" ON "TryOnConfiguration"("isActive");
CREATE INDEX "TryOnConfiguration_projectId_isActive_idx" ON "TryOnConfiguration"("projectId", "isActive");

-- Indexes for TryOnSession
CREATE UNIQUE INDEX "TryOnSession_sessionId_key" ON "TryOnSession"("sessionId");
CREATE INDEX "TryOnSession_configurationId_idx" ON "TryOnSession"("configurationId");
CREATE INDEX "TryOnSession_sessionId_idx" ON "TryOnSession"("sessionId");
CREATE INDEX "TryOnSession_visitorId_idx" ON "TryOnSession"("visitorId");
CREATE INDEX "TryOnSession_startedAt_idx" ON "TryOnSession"("startedAt");

-- Indexes for TryOnProductMapping
CREATE UNIQUE INDEX "TryOnProductMapping_configurationId_productId_key" ON "TryOnProductMapping"("configurationId", "productId");
CREATE INDEX "TryOnProductMapping_productId_idx" ON "TryOnProductMapping"("productId");
CREATE INDEX "TryOnProductMapping_configurationId_idx" ON "TryOnProductMapping"("configurationId");

-- Indexes for TryOnScreenshot
CREATE INDEX "TryOnScreenshot_sessionId_idx" ON "TryOnScreenshot"("sessionId");
CREATE INDEX "TryOnScreenshot_productId_idx" ON "TryOnScreenshot"("productId");

-- ========================================
-- ADD FOREIGN KEYS
-- ========================================

-- AddForeignKey
ALTER TABLE "TryOnConfiguration" ADD CONSTRAINT "TryOnConfiguration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryOnSession" ADD CONSTRAINT "TryOnSession_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "TryOnConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryOnProductMapping" ADD CONSTRAINT "TryOnProductMapping_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "TryOnConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryOnProductMapping" ADD CONSTRAINT "TryOnProductMapping_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryOnScreenshot" ADD CONSTRAINT "TryOnScreenshot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TryOnSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryOnScreenshot" ADD CONSTRAINT "TryOnScreenshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
