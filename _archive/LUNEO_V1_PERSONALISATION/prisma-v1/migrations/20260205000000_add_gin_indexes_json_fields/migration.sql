-- AddGinIndexesJsonFields
-- 
-- This migration adds GIN indexes on frequently queried JSON fields for improved performance.
-- GIN indexes are optimal for JSONB containment queries (@>, ?, ?|, ?&).
--
-- Reference: https://www.postgresql.org/docs/current/datatype-json.html#JSON-INDEXING

-- ============================================================================
-- BRAND TABLE - Settings and limits are frequently checked
-- ============================================================================

-- Index on Brand.limits for quota/limit checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Brand_limits_gin_idx" 
ON "Brand" USING GIN ("limits" jsonb_path_ops);

-- Index on Brand.settings for configuration lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Brand_settings_gin_idx" 
ON "Brand" USING GIN ("settings" jsonb_path_ops);

-- ============================================================================
-- DESIGN TABLE - Options and metadata are queried frequently
-- ============================================================================

-- Index on Design.options for generation option queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Design_options_gin_idx" 
ON "Design" USING GIN ("options" jsonb_path_ops);

-- Index on Design.metadata for AI metadata queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Design_metadata_gin_idx" 
ON "Design" USING GIN ("metadata" jsonb_path_ops);

-- Index on Design.designData for widget editor data queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Design_designData_gin_idx" 
ON "Design" USING GIN ("designData" jsonb_path_ops);

-- ============================================================================
-- GENERATION TABLE - Customizations are the core data for generations
-- ============================================================================

-- Index on Generation.customizations for customization queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Generation_customizations_gin_idx" 
ON "Generation" USING GIN ("customizations" jsonb_path_ops);

-- ============================================================================
-- ORDER TABLE - Metadata and shipping address are queried
-- ============================================================================

-- Index on Order.metadata for order metadata queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Order_metadata_gin_idx" 
ON "Order" USING GIN ("metadata" jsonb_path_ops);

-- Index on Order.shippingAddress for address-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Order_shippingAddress_gin_idx" 
ON "Order" USING GIN ("shippingAddress" jsonb_path_ops);

-- ============================================================================
-- PRODUCT TABLE - Customization options are frequently queried
-- ============================================================================

-- Index on Product.customizationOptions for product customization queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_customizationOptions_gin_idx" 
ON "Product" USING GIN ("customizationOptions" jsonb_path_ops);

-- Index on Product.rulesJson for product rules engine queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Product_rulesJson_gin_idx" 
ON "Product" USING GIN ("rulesJson" jsonb_path_ops);

-- ============================================================================
-- TEMPLATE TABLE - Variables are used for template matching
-- ============================================================================

-- Index on Template.variables for template variable queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Template_variables_gin_idx" 
ON "Template" USING GIN ("variables" jsonb_path_ops);

-- Index on Template.constraints for constraint-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Template_constraints_gin_idx" 
ON "Template" USING GIN ("constraints" jsonb_path_ops);

-- ============================================================================
-- ANALYTICS TABLES - Event data is frequently queried
-- ============================================================================

-- Index on AnalyticsEvent.properties for event property queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "AnalyticsEvent_properties_gin_idx" 
ON "AnalyticsEvent" USING GIN ("properties" jsonb_path_ops);

-- ============================================================================
-- WEBHOOK LOG TABLE - Payload is queried for debugging
-- ============================================================================

-- Index on WebhookLog.payload for payload content queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "WebhookLog_payload_gin_idx" 
ON "WebhookLog" USING GIN ("payload" jsonb_path_ops);

-- ============================================================================
-- AI GENERATION TABLE - Parameters are frequently queried
-- ============================================================================

-- Index on AIGeneration.parameters for AI parameter queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "AIGeneration_parameters_gin_idx" 
ON "AIGeneration" USING GIN ("parameters" jsonb_path_ops);

-- ============================================================================
-- SPEC TABLE - Spec and zoneInputs are core for design specifications
-- ============================================================================

-- Index on DesignSpec.spec for specification queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "DesignSpec_spec_gin_idx" 
ON "DesignSpec" USING GIN ("spec" jsonb_path_ops);

-- Index on DesignSpec.zoneInputs for zone input queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "DesignSpec_zoneInputs_gin_idx" 
ON "DesignSpec" USING GIN ("zoneInputs" jsonb_path_ops);
