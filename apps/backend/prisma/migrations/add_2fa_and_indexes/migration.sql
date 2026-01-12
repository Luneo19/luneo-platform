-- Add 2FA fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "is_2fa_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "two_fa_secret" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "temp_2fa_secret" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "backup_codes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"("email");
CREATE INDEX IF NOT EXISTS "idx_user_brand_id" ON "User"("brandId");
CREATE INDEX IF NOT EXISTS "idx_user_last_login" ON "User"("lastLoginAt");
CREATE INDEX IF NOT EXISTS "idx_user_created_at" ON "User"("createdAt");

-- Add indexes for Order table
CREATE INDEX IF NOT EXISTS "idx_order_brand_id" ON "Order"("brandId");
CREATE INDEX IF NOT EXISTS "idx_order_user_id" ON "Order"("userId");
CREATE INDEX IF NOT EXISTS "idx_order_status" ON "Order"("status");
CREATE INDEX IF NOT EXISTS "idx_order_created_at" ON "Order"("createdAt");

-- Add indexes for Product table
CREATE INDEX IF NOT EXISTS "idx_product_brand_id" ON "Product"("brandId");
CREATE INDEX IF NOT EXISTS "idx_product_is_active" ON "Product"("isActive");
CREATE INDEX IF NOT EXISTS "idx_product_is_public" ON "Product"("isPublic");
CREATE INDEX IF NOT EXISTS "idx_product_created_at" ON "Product"("createdAt");

-- Add indexes for Design table
CREATE INDEX IF NOT EXISTS "idx_design_user_id" ON "Design"("userId");
CREATE INDEX IF NOT EXISTS "idx_design_brand_id" ON "Design"("brandId");
CREATE INDEX IF NOT EXISTS "idx_design_status" ON "Design"("status");
CREATE INDEX IF NOT EXISTS "idx_design_created_at" ON "Design"("createdAt");

-- Add indexes for Customization table
CREATE INDEX IF NOT EXISTS "idx_customization_brand_id" ON "Customization"("brandId");
CREATE INDEX IF NOT EXISTS "idx_customization_user_id" ON "Customization"("userId");
CREATE INDEX IF NOT EXISTS "idx_customization_status" ON "Customization"("status");
CREATE INDEX IF NOT EXISTS "idx_customization_created_at" ON "Customization"("createdAt");

-- Add indexes for UsageMetric table
CREATE INDEX IF NOT EXISTS "idx_usage_metric_brand_id" ON "UsageMetric"("brandId");
CREATE INDEX IF NOT EXISTS "idx_usage_metric_type" ON "UsageMetric"("metricType");
CREATE INDEX IF NOT EXISTS "idx_usage_metric_timestamp" ON "UsageMetric"("timestamp");
CREATE INDEX IF NOT EXISTS "idx_usage_metric_brand_timestamp" ON "UsageMetric"("brandId", "timestamp");

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS "idx_order_brand_status_created" ON "Order"("brandId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_product_brand_active" ON "Product"("brandId", "isActive", "isPublic");
CREATE INDEX IF NOT EXISTS "idx_design_user_status" ON "Design"("userId", "status");
