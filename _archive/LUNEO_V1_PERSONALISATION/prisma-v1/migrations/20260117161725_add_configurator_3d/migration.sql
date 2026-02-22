-- Migration: Add Configurator 3D Models
-- Date: 2025-01-17
-- Description: Adds Configurator3DConfiguration, Configurator3DOption, Configurator3DComponent, Configurator3DSession models

-- ========================================
-- CREATE ENUMS
-- ========================================

-- CreateEnum
CREATE TYPE "Configurator3DOptionType" AS ENUM ('COLOR', 'MATERIAL', 'TEXTURE', 'SIZE', 'COMPONENT', 'TEXT');

-- CreateEnum
CREATE TYPE "Configurator3DSessionStatus" AS ENUM ('ACTIVE', 'SAVED', 'COMPLETED', 'ABANDONED');

-- ========================================
-- CREATE TABLES
-- ========================================

-- CreateTable: Configurator3DConfiguration
CREATE TABLE "Configurator3DConfiguration" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "model3dId" TEXT,
    "sceneConfig" JSONB NOT NULL,
    "uiConfig" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configurator3DConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Configurator3DOption
CREATE TABLE "Configurator3DOption" (
    "id" TEXT NOT NULL,
    "configurationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "Configurator3DOptionType" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "defaultValue" JSONB,
    "values" JSONB NOT NULL,
    "constraints" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configurator3DOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Configurator3DComponent
CREATE TABLE "Configurator3DComponent" (
    "id" TEXT NOT NULL,
    "configurationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "meshName" TEXT,
    "materialId" TEXT,
    "position" JSONB,
    "rotation" JSONB,
    "scale" JSONB,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configurator3DComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Configurator3DSession
CREATE TABLE "Configurator3DSession" (
    "id" TEXT NOT NULL,
    "configurationId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "status" "Configurator3DSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "state" JSONB NOT NULL,
    "previewImageUrl" TEXT,
    "deviceInfo" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "savedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Configurator3DSession_pkey" PRIMARY KEY ("id")
);

-- ========================================
-- CREATE INDEXES
-- ========================================

-- Indexes for Configurator3DConfiguration
CREATE INDEX "Configurator3DConfiguration_projectId_idx" ON "Configurator3DConfiguration"("projectId");
CREATE INDEX "Configurator3DConfiguration_isActive_idx" ON "Configurator3DConfiguration"("isActive");
CREATE INDEX "Configurator3DConfiguration_projectId_isActive_idx" ON "Configurator3DConfiguration"("projectId", "isActive");

-- Indexes for Configurator3DOption
CREATE INDEX "Configurator3DOption_configurationId_idx" ON "Configurator3DOption"("configurationId");
CREATE INDEX "Configurator3DOption_type_idx" ON "Configurator3DOption"("type");
CREATE INDEX "Configurator3DOption_configurationId_order_idx" ON "Configurator3DOption"("configurationId", "order");

-- Indexes for Configurator3DComponent
CREATE INDEX "Configurator3DComponent_configurationId_idx" ON "Configurator3DComponent"("configurationId");
CREATE INDEX "Configurator3DComponent_isVisible_idx" ON "Configurator3DComponent"("isVisible");

-- Indexes for Configurator3DSession
CREATE UNIQUE INDEX "Configurator3DSession_sessionId_key" ON "Configurator3DSession"("sessionId");
CREATE INDEX "Configurator3DSession_configurationId_idx" ON "Configurator3DSession"("configurationId");
CREATE INDEX "Configurator3DSession_sessionId_idx" ON "Configurator3DSession"("sessionId");
CREATE INDEX "Configurator3DSession_visitorId_idx" ON "Configurator3DSession"("visitorId");
CREATE INDEX "Configurator3DSession_status_idx" ON "Configurator3DSession"("status");
CREATE INDEX "Configurator3DSession_startedAt_idx" ON "Configurator3DSession"("startedAt");

-- ========================================
-- ADD FOREIGN KEYS
-- ========================================

-- AddForeignKey
ALTER TABLE "Configurator3DConfiguration" ADD CONSTRAINT "Configurator3DConfiguration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configurator3DOption" ADD CONSTRAINT "Configurator3DOption_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "Configurator3DConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configurator3DComponent" ADD CONSTRAINT "Configurator3DComponent_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "Configurator3DConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configurator3DSession" ADD CONSTRAINT "Configurator3DSession_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "Configurator3DConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
