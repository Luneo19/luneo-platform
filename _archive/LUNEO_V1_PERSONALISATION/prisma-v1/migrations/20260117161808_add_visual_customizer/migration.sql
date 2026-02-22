-- Migration: Add Visual Customizer Models
-- Date: 2025-01-17
-- Description: Adds VisualCustomizer, VisualCustomizerLayer, VisualCustomizerPreset models

-- ========================================
-- CREATE ENUMS
-- ========================================

-- CreateEnum
CREATE TYPE "VisualCustomizerLayerType" AS ENUM ('IMAGE', 'TEXT', 'SHAPE', 'PATTERN', 'BACKGROUND');

-- ========================================
-- CREATE TABLES
-- ========================================

-- CreateTable: VisualCustomizer
CREATE TABLE "VisualCustomizer" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "canvasConfig" JSONB NOT NULL,
    "uiConfig" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisualCustomizer_pkey" PRIMARY KEY ("id")
);

-- CreateTable: VisualCustomizerLayer
CREATE TABLE "VisualCustomizerLayer" (
    "id" TEXT NOT NULL,
    "customizerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "VisualCustomizerLayerType" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisualCustomizerLayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable: VisualCustomizerPreset
CREATE TABLE "VisualCustomizerPreset" (
    "id" TEXT NOT NULL,
    "customizerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "previewImageUrl" TEXT,
    "layersConfig" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisualCustomizerPreset_pkey" PRIMARY KEY ("id")
);

-- ========================================
-- CREATE INDEXES
-- ========================================

-- Indexes for VisualCustomizer
CREATE INDEX "VisualCustomizer_projectId_idx" ON "VisualCustomizer"("projectId");
CREATE INDEX "VisualCustomizer_isActive_idx" ON "VisualCustomizer"("isActive");
CREATE INDEX "VisualCustomizer_projectId_isActive_idx" ON "VisualCustomizer"("projectId", "isActive");

-- Indexes for VisualCustomizerLayer
CREATE INDEX "VisualCustomizerLayer_customizerId_idx" ON "VisualCustomizerLayer"("customizerId");
CREATE INDEX "VisualCustomizerLayer_type_idx" ON "VisualCustomizerLayer"("type");
CREATE INDEX "VisualCustomizerLayer_customizerId_order_idx" ON "VisualCustomizerLayer"("customizerId", "order");

-- Indexes for VisualCustomizerPreset
CREATE INDEX "VisualCustomizerPreset_customizerId_idx" ON "VisualCustomizerPreset"("customizerId");
CREATE INDEX "VisualCustomizerPreset_isDefault_idx" ON "VisualCustomizerPreset"("isDefault");

-- ========================================
-- ADD FOREIGN KEYS
-- ========================================

-- AddForeignKey
ALTER TABLE "VisualCustomizer" ADD CONSTRAINT "VisualCustomizer_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisualCustomizerLayer" ADD CONSTRAINT "VisualCustomizerLayer_customizerId_fkey" FOREIGN KEY ("customizerId") REFERENCES "VisualCustomizer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisualCustomizerPreset" ADD CONSTRAINT "VisualCustomizerPreset_customizerId_fkey" FOREIGN KEY ("customizerId") REFERENCES "VisualCustomizer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
