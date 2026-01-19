-- Migration: Add Projects & Workspaces for Multi-tenancy
-- Date: 2025-01-17
-- Description: Adds Project and Workspace models to enable multi-project management per organization

-- ========================================
-- CREATE ENUMS
-- ========================================

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('VIRTUAL_TRY_ON', 'CONFIGURATOR_3D', 'VISUAL_CUSTOMIZER', 'AI_DESIGN_HUB', 'ECOMMERCE', 'MARKETING', 'BRANDING');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WorkspaceEnvironment" AS ENUM ('DEVELOPMENT', 'STAGING', 'PRODUCTION');

-- ========================================
-- CREATE TABLES
-- ========================================

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ProjectType" NOT NULL,
    "slug" TEXT NOT NULL,
    "settings" JSONB,
    "apiKey" TEXT NOT NULL,
    "webhookUrl" TEXT,
    "webhookSecret" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "environment" "WorkspaceEnvironment" NOT NULL,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- ========================================
-- CREATE INDEXES
-- ========================================

-- Indexes for Project
CREATE INDEX "Project_organizationId_idx" ON "Project"("organizationId");
CREATE INDEX "Project_type_idx" ON "Project"("type");
CREATE INDEX "Project_status_idx" ON "Project"("status");
CREATE INDEX "Project_organizationId_status_idx" ON "Project"("organizationId", "status");
CREATE UNIQUE INDEX "Project_apiKey_key" ON "Project"("apiKey");
CREATE UNIQUE INDEX "Project_organizationId_slug_key" ON "Project"("organizationId", "slug");

-- Indexes for Workspace
CREATE INDEX "Workspace_projectId_idx" ON "Workspace"("projectId");
CREATE INDEX "Workspace_environment_idx" ON "Workspace"("environment");
CREATE UNIQUE INDEX "Workspace_projectId_environment_key" ON "Workspace"("projectId", "environment");

-- ========================================
-- ALTER EXISTING TABLES
-- ========================================

-- AlterTable: Update ApiKey to support both Brand and Project
ALTER TABLE "ApiKey" 
    ADD COLUMN "projectId" TEXT,
    ALTER COLUMN "brandId" DROP NOT NULL;

-- Add indexes for ApiKey
CREATE INDEX "ApiKey_projectId_idx" ON "ApiKey"("projectId");
CREATE INDEX "ApiKey_projectId_isActive_idx" ON "ApiKey"("projectId", "isActive");

-- ========================================
-- ADD FOREIGN KEYS
-- ========================================

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
