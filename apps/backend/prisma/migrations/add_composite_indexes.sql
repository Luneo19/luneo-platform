-- ========================================
-- COMPOSITE INDEXES FOR PERFORMANCE
-- ========================================
-- These indexes optimize frequently used query patterns
-- Created: 2025-01-XX
-- Purpose: Improve query performance for common WHERE + ORDER BY combinations

-- ========================================
-- PRODUCT INDEXES
-- ========================================

-- Optimize: WHERE brandId + isActive + isPublic ORDER BY createdAt
-- Used in: ProductsService.findAll()
CREATE INDEX IF NOT EXISTS "idx_product_brand_active_public_created" 
ON "Product" ("brandId", "isActive", "isPublic", "createdAt" DESC);

-- Optimize: WHERE brandId + isActive ORDER BY createdAt
CREATE INDEX IF NOT EXISTS "idx_product_brand_active_created" 
ON "Product" ("brandId", "isActive", "createdAt" DESC);

-- Optimize: WHERE brandId + isPublic ORDER BY createdAt
CREATE INDEX IF NOT EXISTS "idx_product_brand_public_created" 
ON "Product" ("brandId", "isPublic", "createdAt" DESC);

-- ========================================
-- DESIGN INDEXES
-- ========================================

-- Optimize: WHERE brandId + status ORDER BY createdAt
-- Used in: DesignsService queries, dashboard metrics
CREATE INDEX IF NOT EXISTS "idx_design_brand_status_created" 
ON "Design" ("brandId", "status", "createdAt" DESC);

-- Optimize: WHERE userId + status ORDER BY createdAt
-- Used in: User designs listing
CREATE INDEX IF NOT EXISTS "idx_design_user_status_created" 
ON "Design" ("userId", "status", "createdAt" DESC);

-- Optimize: WHERE productId + status ORDER BY createdAt
-- Used in: Product designs listing
CREATE INDEX IF NOT EXISTS "idx_design_product_status_created" 
ON "Design" ("productId", "status", "createdAt" DESC);

-- Optimize: WHERE brandId + createdAt (for time-based queries)
CREATE INDEX IF NOT EXISTS "idx_design_brand_created" 
ON "Design" ("brandId", "createdAt" DESC);

-- ========================================
-- ORDER INDEXES
-- ========================================

-- Optimize: WHERE brandId + status ORDER BY createdAt
-- Used in: OrdersService, PublicApiService.getOrders()
CREATE INDEX IF NOT EXISTS "idx_order_brand_status_created" 
ON "Order" ("brandId", "status", "createdAt" DESC);

-- Optimize: WHERE brandId + paymentStatus ORDER BY createdAt
CREATE INDEX IF NOT EXISTS "idx_order_brand_payment_created" 
ON "Order" ("brandId", "paymentStatus", "createdAt" DESC);

-- Optimize: WHERE userId + status ORDER BY createdAt
-- Used in: User orders listing
CREATE INDEX IF NOT EXISTS "idx_order_user_status_created" 
ON "Order" ("userId", "status", "createdAt" DESC);

-- Optimize: WHERE status + paymentStatus (combined filters)
CREATE INDEX IF NOT EXISTS "idx_order_status_payment" 
ON "Order" ("status", "paymentStatus");

-- Optimize: WHERE brandId + createdAt (for time-based queries)
CREATE INDEX IF NOT EXISTS "idx_order_brand_created" 
ON "Order" ("brandId", "createdAt" DESC);

-- ========================================
-- USER INDEXES
-- ========================================

-- Optimize: WHERE brandId + role (user listing by brand and role)
CREATE INDEX IF NOT EXISTS "idx_user_brand_role" 
ON "User" ("brandId", "role");

-- Optimize: WHERE email + isActive (user lookup)
CREATE INDEX IF NOT EXISTS "idx_user_email_active" 
ON "User" ("email", "isActive");

-- ========================================
-- USAGE METRICS INDEXES
-- ========================================

-- Optimize: WHERE brandId + metric + timestamp
-- Used in: UsageTrackingService, analytics queries
CREATE INDEX IF NOT EXISTS "idx_usage_brand_metric_timestamp" 
ON "UsageMetric" ("brandId", "metric", "timestamp" DESC);

-- ========================================
-- AUDIT LOG INDEXES
-- ========================================

-- Optimize: WHERE userId + timestamp (user activity)
CREATE INDEX IF NOT EXISTS "idx_audit_user_timestamp" 
ON "AuditLog" ("userId", "timestamp" DESC);

-- Optimize: WHERE brandId + eventType + timestamp
CREATE INDEX IF NOT EXISTS "idx_audit_brand_event_timestamp" 
ON "AuditLog" ("brandId", "eventType", "timestamp" DESC);

-- Optimize: WHERE resourceType + resourceId + timestamp
CREATE INDEX IF NOT EXISTS "idx_audit_resource_timestamp" 
ON "AuditLog" ("resourceType", "resourceId", "timestamp" DESC);

-- ========================================
-- WEBHOOK INDEXES
-- ========================================

-- Optimize: WHERE brandId + event + createdAt
CREATE INDEX IF NOT EXISTS "idx_webhook_brand_event_created" 
ON "Webhook" ("brandId", "event", "createdAt" DESC);

-- Optimize: WHERE brandId + success + createdAt
CREATE INDEX IF NOT EXISTS "idx_webhook_brand_success_created" 
ON "Webhook" ("brandId", "success", "createdAt" DESC);

-- ========================================
-- ECOMMERCE INTEGRATION INDEXES
-- ========================================

-- Optimize: WHERE brandId + platform + status
CREATE INDEX IF NOT EXISTS "idx_ecommerce_brand_platform_status" 
ON "EcommerceIntegration" ("brandId", "platform", "status");

-- ========================================
-- AI COST INDEXES
-- ========================================

-- Optimize: WHERE brandId + provider + createdAt
-- Used in: Cost tracking and analytics
CREATE INDEX IF NOT EXISTS "idx_aicost_brand_provider_created" 
ON "AICost" ("brandId", "provider", "createdAt" DESC);

-- ========================================
-- NOTES
-- ========================================
-- These indexes are designed to support:
-- 1. Multi-column WHERE clauses (brandId + status, etc.)
-- 2. ORDER BY createdAt DESC (most recent first)
-- 3. Pagination queries (skip/take)
-- 
-- Index maintenance:
-- - PostgreSQL automatically maintains these indexes
-- - Monitor index usage with: SELECT * FROM pg_stat_user_indexes;
-- - Remove unused indexes if needed to reduce write overhead

