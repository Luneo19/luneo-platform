-- Migration: Add Asset Hub Models
-- Date: 2025-01-17
-- Description: Adds AssetFile, AssetFolder, Model3D, and Texture models for asset management

-- ========================================
-- CREATE ENUMS
-- ========================================

-- CreateEnum
CREATE TYPE "AssetFileType" AS ENUM ('IMAGE', 'MODEL_3D', 'TEXTURE', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "Model3DFormat" AS ENUM ('GLB', 'GLTF', 'FBX', 'OBJ', 'USDZ');

-- CreateEnum
CREATE TYPE "Model3DProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "TextureType" AS ENUM ('DIFFUSE', 'NORMAL', 'ROUGHNESS', 'METALLIC', 'AO');

-- ========================================
-- CREATE TABLES
-- ========================================

-- CreateTable: AssetFile
CREATE TABLE "AssetFile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "cdnUrl" TEXT,
    "type" "AssetFileType" NOT NULL,
    "metadata" JSONB,
    "thumbnails" JSONB,
    "tags" TEXT[],
    "folderId" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AssetFolder
CREATE TABLE "AssetFolder" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "path" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Model3D
CREATE TABLE "Model3D" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "format" "Model3DFormat" NOT NULL,
    "vertexCount" INTEGER,
    "faceCount" INTEGER,
    "materialCount" INTEGER,
    "textureCount" INTEGER,
    "boundingBox" JSONB,
    "optimizedVersions" JSONB,
    "processingStatus" "Model3DProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Model3D_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Texture
CREATE TABLE "Texture" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "type" "TextureType" NOT NULL,
    "resolution" TEXT,
    "isTileable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Texture_pkey" PRIMARY KEY ("id")
);

-- ========================================
-- CREATE INDEXES
-- ========================================

-- Indexes for AssetFile
CREATE INDEX "AssetFile_organizationId_idx" ON "AssetFile"("organizationId");
CREATE INDEX "AssetFile_projectId_idx" ON "AssetFile"("projectId");
CREATE INDEX "AssetFile_type_idx" ON "AssetFile"("type");
CREATE INDEX "AssetFile_folderId_idx" ON "AssetFile"("folderId");
CREATE INDEX "AssetFile_uploadedById_idx" ON "AssetFile"("uploadedById");
CREATE INDEX "AssetFile_organizationId_type_idx" ON "AssetFile"("organizationId", "type");

-- Indexes for AssetFolder
CREATE INDEX "AssetFolder_organizationId_idx" ON "AssetFolder"("organizationId");
CREATE INDEX "AssetFolder_parentId_idx" ON "AssetFolder"("parentId");
CREATE INDEX "AssetFolder_organizationId_parentId_idx" ON "AssetFolder"("organizationId", "parentId");

-- Indexes for Model3D
CREATE UNIQUE INDEX "Model3D_fileId_key" ON "Model3D"("fileId");
CREATE INDEX "Model3D_format_idx" ON "Model3D"("format");
CREATE INDEX "Model3D_processingStatus_idx" ON "Model3D"("processingStatus");

-- Indexes for Texture
CREATE UNIQUE INDEX "Texture_fileId_key" ON "Texture"("fileId");
CREATE INDEX "Texture_type_idx" ON "Texture"("type");

-- ========================================
-- ADD FOREIGN KEYS
-- ========================================

-- AddForeignKey
ALTER TABLE "AssetFile" ADD CONSTRAINT "AssetFile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetFile" ADD CONSTRAINT "AssetFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetFile" ADD CONSTRAINT "AssetFile_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "AssetFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetFile" ADD CONSTRAINT "AssetFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetFolder" ADD CONSTRAINT "AssetFolder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetFolder" ADD CONSTRAINT "AssetFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AssetFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Model3D" ADD CONSTRAINT "Model3D_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "AssetFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Texture" ADD CONSTRAINT "Texture_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "AssetFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
