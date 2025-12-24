-- Migration SQL pour E-commerce Integrations
-- Tables pour Shopify, WooCommerce, Magento

-- Table des intégrations e-commerce
CREATE TABLE IF NOT EXISTS "EcommerceIntegration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brandId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "config" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EcommerceIntegration_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE
);

-- Table de mapping des produits
CREATE TABLE IF NOT EXISTS "ProductMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "integrationId" TEXT NOT NULL,
    "luneoProductId" TEXT NOT NULL,
    "externalProductId" TEXT NOT NULL,
    "externalSku" TEXT NOT NULL,
    "syncStatus" TEXT NOT NULL DEFAULT 'synced',
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    CONSTRAINT "ProductMapping_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "EcommerceIntegration"("id") ON DELETE CASCADE,
    CONSTRAINT "ProductMapping_luneoProductId_fkey" FOREIGN KEY ("luneoProductId") REFERENCES "Product"("id") ON DELETE CASCADE,
    CONSTRAINT "ProductMapping_integrationId_externalProductId_key" UNIQUE ("integrationId", "externalProductId")
);

-- Table des logs de synchronisation
CREATE TABLE IF NOT EXISTS "SyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "integrationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "itemsFailed" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "duration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SyncLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "EcommerceIntegration"("id") ON DELETE CASCADE
);

-- Table des logs de webhooks
CREATE TABLE IF NOT EXISTS "WebhookLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "webhookId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS "EcommerceIntegration_brandId_idx" ON "EcommerceIntegration"("brandId");
CREATE INDEX IF NOT EXISTS "EcommerceIntegration_platform_idx" ON "EcommerceIntegration"("platform");
CREATE INDEX IF NOT EXISTS "EcommerceIntegration_shopDomain_idx" ON "EcommerceIntegration"("shopDomain");
CREATE INDEX IF NOT EXISTS "EcommerceIntegration_status_idx" ON "EcommerceIntegration"("status");

CREATE INDEX IF NOT EXISTS "ProductMapping_integrationId_idx" ON "ProductMapping"("integrationId");
CREATE INDEX IF NOT EXISTS "ProductMapping_luneoProductId_idx" ON "ProductMapping"("luneoProductId");
CREATE INDEX IF NOT EXISTS "ProductMapping_externalProductId_idx" ON "ProductMapping"("externalProductId");
CREATE INDEX IF NOT EXISTS "ProductMapping_externalSku_idx" ON "ProductMapping"("externalSku");

CREATE INDEX IF NOT EXISTS "SyncLog_integrationId_idx" ON "SyncLog"("integrationId");
CREATE INDEX IF NOT EXISTS "SyncLog_type_idx" ON "SyncLog"("type");
CREATE INDEX IF NOT EXISTS "SyncLog_status_idx" ON "SyncLog"("status");
CREATE INDEX IF NOT EXISTS "SyncLog_createdAt_idx" ON "SyncLog"("createdAt");

CREATE INDEX IF NOT EXISTS "WebhookLog_webhookId_idx" ON "WebhookLog"("webhookId");
CREATE INDEX IF NOT EXISTS "WebhookLog_topic_idx" ON "WebhookLog"("topic");
CREATE INDEX IF NOT EXISTS "WebhookLog_shopDomain_idx" ON "WebhookLog"("shopDomain");
CREATE INDEX IF NOT EXISTS "WebhookLog_status_idx" ON "WebhookLog"("status");
CREATE INDEX IF NOT EXISTS "WebhookLog_createdAt_idx" ON "WebhookLog"("createdAt");

-- Commentaires pour documentation
COMMENT ON TABLE "EcommerceIntegration" IS 'Intégrations e-commerce (Shopify, WooCommerce, Magento)';
COMMENT ON TABLE "ProductMapping" IS 'Mapping entre produits LUNEO et produits externes';
COMMENT ON TABLE "SyncLog" IS 'Logs de synchronisation des produits/commandes';
COMMENT ON TABLE "WebhookLog" IS 'Logs des webhooks reçus des plateformes e-commerce';

COMMENT ON COLUMN "EcommerceIntegration"."platform" IS 'Plateforme: shopify, woocommerce, magento';
COMMENT ON COLUMN "EcommerceIntegration"."shopDomain" IS 'Domaine de la boutique (ex: myshop.myshopify.com)';
COMMENT ON COLUMN "EcommerceIntegration"."accessToken" IS 'Token d''accès API (crypté)';
COMMENT ON COLUMN "EcommerceIntegration"."config" IS 'Configuration spécifique à la plateforme';

COMMENT ON COLUMN "ProductMapping"."syncStatus" IS 'Statut de sync: synced, pending, failed, conflict';
COMMENT ON COLUMN "ProductMapping"."externalProductId" IS 'ID du produit sur la plateforme externe';
COMMENT ON COLUMN "ProductMapping"."externalSku" IS 'SKU du produit sur la plateforme externe';

COMMENT ON COLUMN "SyncLog"."type" IS 'Type de sync: product, order, inventory, customer';
COMMENT ON COLUMN "SyncLog"."direction" IS 'Direction: import, export, bidirectional';
COMMENT ON COLUMN "SyncLog"."status" IS 'Statut: success, failed, partial';
COMMENT ON COLUMN "SyncLog"."duration" IS 'Durée de la synchronisation en millisecondes';


