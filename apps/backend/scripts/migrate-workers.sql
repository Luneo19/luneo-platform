-- Migration SQL pour Workers IA avancés
-- Ajout des tables pour le système de workers et production

-- Table pour les résultats de rendu
CREATE TABLE IF NOT EXISTS "RenderResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "renderId" TEXT NOT NULL UNIQUE,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "url" TEXT,
    "thumbnailUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table pour le progrès de rendu
CREATE TABLE IF NOT EXISTS "RenderProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "renderId" TEXT NOT NULL UNIQUE,
    "stage" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les erreurs de rendu
CREATE TABLE IF NOT EXISTS "RenderError" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "renderId" TEXT NOT NULL,
    "error" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les résultats d'export
CREATE TABLE IF NOT EXISTS "ExportResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "renderId" TEXT NOT NULL UNIQUE,
    "format" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table pour le statut de production
CREATE TABLE IF NOT EXISTS "ProductionStatus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL UNIQUE,
    "currentStage" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les rapports de qualité
CREATE TABLE IF NOT EXISTS "QualityReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL UNIQUE,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "issues" TEXT[] NOT NULL DEFAULT '{}',
    "recommendations" TEXT[] NOT NULL DEFAULT '{}',
    "passed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table pour le progrès des rendus en batch
CREATE TABLE IF NOT EXISTS "BatchRenderProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL UNIQUE,
    "completed" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "percentage" INTEGER NOT NULL,
    "results" JSONB,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS "RenderResult_renderId_idx" ON "RenderResult"("renderId");
CREATE INDEX IF NOT EXISTS "RenderResult_type_idx" ON "RenderResult"("type");
CREATE INDEX IF NOT EXISTS "RenderResult_status_idx" ON "RenderResult"("status");
CREATE INDEX IF NOT EXISTS "RenderResult_createdAt_idx" ON "RenderResult"("createdAt");

CREATE INDEX IF NOT EXISTS "RenderProgress_renderId_idx" ON "RenderProgress"("renderId");
CREATE INDEX IF NOT EXISTS "RenderProgress_timestamp_idx" ON "RenderProgress"("timestamp");

CREATE INDEX IF NOT EXISTS "RenderError_renderId_idx" ON "RenderError"("renderId");
CREATE INDEX IF NOT EXISTS "RenderError_occurredAt_idx" ON "RenderError"("occurredAt");

CREATE INDEX IF NOT EXISTS "ExportResult_renderId_idx" ON "ExportResult"("renderId");
CREATE INDEX IF NOT EXISTS "ExportResult_format_idx" ON "ExportResult"("format");
CREATE INDEX IF NOT EXISTS "ExportResult_createdAt_idx" ON "ExportResult"("createdAt");

CREATE INDEX IF NOT EXISTS "ProductionStatus_orderId_idx" ON "ProductionStatus"("orderId");
CREATE INDEX IF NOT EXISTS "ProductionStatus_lastUpdated_idx" ON "ProductionStatus"("lastUpdated");

CREATE INDEX IF NOT EXISTS "QualityReport_orderId_idx" ON "QualityReport"("orderId");
CREATE INDEX IF NOT EXISTS "QualityReport_createdAt_idx" ON "QualityReport"("createdAt");

CREATE INDEX IF NOT EXISTS "BatchRenderProgress_batchId_idx" ON "BatchRenderProgress"("batchId");
CREATE INDEX IF NOT EXISTS "BatchRenderProgress_lastUpdated_idx" ON "BatchRenderProgress"("lastUpdated");

-- Commentaires pour documentation
COMMENT ON TABLE "RenderResult" IS 'Résultats des opérations de rendu (2D/3D/Preview)';
COMMENT ON TABLE "RenderProgress" IS 'Progrès en temps réel des opérations de rendu';
COMMENT ON TABLE "RenderError" IS 'Erreurs survenues lors des opérations de rendu';
COMMENT ON TABLE "ExportResult" IS 'Résultats des exports multi-format (GLTF/USDZ/PNG)';
COMMENT ON TABLE "ProductionStatus" IS 'Statut de production des commandes';
COMMENT ON TABLE "QualityReport" IS 'Rapports de contrôle qualité';
COMMENT ON TABLE "BatchRenderProgress" IS 'Progrès des rendus en batch';

-- Ajout des champs manquants à la table Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "productionBundleUrl" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "manufacturingInstructionsUrl" TEXT;

-- Index pour les nouveaux champs
CREATE INDEX IF NOT EXISTS "Order_productionBundleUrl_idx" ON "Order"("productionBundleUrl") WHERE "productionBundleUrl" IS NOT NULL;


