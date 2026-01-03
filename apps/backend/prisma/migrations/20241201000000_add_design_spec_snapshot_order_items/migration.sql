-- CreateTable
CREATE TABLE "DesignSpec" (
    "id" TEXT NOT NULL,
    "specVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "specHash" TEXT NOT NULL,
    "spec" JSONB NOT NULL,
    "productId" TEXT NOT NULL,
    "zoneInputs" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Snapshot" (
    "id" TEXT NOT NULL,
    "specId" TEXT NOT NULL,
    "specHash" TEXT NOT NULL,
    "specData" JSONB NOT NULL,
    "previewUrl" TEXT,
    "preview3dUrl" TEXT,
    "thumbnailUrl" TEXT,
    "productionBundleUrl" TEXT,
    "arModelUrl" TEXT,
    "gltfModelUrl" TEXT,
    "assetVersions" JSONB,
    "isValidated" BOOLEAN NOT NULL DEFAULT false,
    "validatedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "provenance" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "designId" TEXT,
    "snapshotId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DesignSpec_specHash_key" ON "DesignSpec"("specHash");

-- CreateIndex
CREATE INDEX "DesignSpec_specHash_idx" ON "DesignSpec"("specHash");

-- CreateIndex
CREATE INDEX "DesignSpec_productId_idx" ON "DesignSpec"("productId");

-- CreateIndex
CREATE INDEX "DesignSpec_specVersion_idx" ON "DesignSpec"("specVersion");

-- CreateIndex
CREATE INDEX "DesignSpec_createdAt_idx" ON "DesignSpec"("createdAt");

-- CreateIndex
CREATE INDEX "DesignSpec_productId_specHash_idx" ON "DesignSpec"("productId", "specHash");

-- CreateIndex
CREATE UNIQUE INDEX "Snapshot_specHash_validatedAt_key" ON "Snapshot"("specHash", "validatedAt");

-- CreateIndex
CREATE INDEX "Snapshot_specId_idx" ON "Snapshot"("specId");

-- CreateIndex
CREATE INDEX "Snapshot_specHash_idx" ON "Snapshot"("specHash");

-- CreateIndex
CREATE INDEX "Snapshot_isValidated_idx" ON "Snapshot"("isValidated");

-- CreateIndex
CREATE INDEX "Snapshot_isLocked_idx" ON "Snapshot"("isLocked");

-- CreateIndex
CREATE INDEX "Snapshot_createdAt_idx" ON "Snapshot"("createdAt");

-- CreateIndex
CREATE INDEX "Snapshot_validatedAt_idx" ON "Snapshot"("validatedAt");

-- CreateIndex
CREATE INDEX "Snapshot_specHash_isValidated_idx" ON "Snapshot"("specHash", "isValidated");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "OrderItem_designId_idx" ON "OrderItem"("designId");

-- CreateIndex
CREATE INDEX "OrderItem_snapshotId_idx" ON "OrderItem"("snapshotId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_productId_idx" ON "OrderItem"("orderId", "productId");

-- AddForeignKey
ALTER TABLE "DesignSpec" ADD CONSTRAINT "DesignSpec_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snapshot" ADD CONSTRAINT "Snapshot_specId_fkey" FOREIGN KEY ("specId") REFERENCES "DesignSpec"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "Snapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Add specId to Design
ALTER TABLE "Design" ADD COLUMN "specId" TEXT;

-- CreateIndex
CREATE INDEX "Design_specId_idx" ON "Design"("specId");

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_specId_fkey" FOREIGN KEY ("specId") REFERENCES "DesignSpec"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Add snapshotId to Customization
ALTER TABLE "Customization" ADD COLUMN "snapshotId" TEXT;

-- CreateIndex
CREATE INDEX "Customization_snapshotId_idx" ON "Customization"("snapshotId");

-- AddForeignKey
ALTER TABLE "Customization" ADD CONSTRAINT "Customization_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "Snapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Add snapshotId, designId, customizationId to RenderResult
ALTER TABLE "RenderResult" ADD COLUMN "snapshotId" TEXT;
ALTER TABLE "RenderResult" ADD COLUMN "designId" TEXT;
ALTER TABLE "RenderResult" ADD COLUMN "customizationId" TEXT;

-- CreateIndex
CREATE INDEX "RenderResult_snapshotId_idx" ON "RenderResult"("snapshotId");
CREATE INDEX "RenderResult_designId_idx" ON "RenderResult"("designId");
CREATE INDEX "RenderResult_customizationId_idx" ON "RenderResult"("customizationId");
CREATE INDEX "RenderResult_type_status_idx" ON "RenderResult"("type", "status");

-- AddForeignKey
ALTER TABLE "RenderResult" ADD CONSTRAINT "RenderResult_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "Snapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RenderResult" ADD CONSTRAINT "RenderResult_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RenderResult" ADD CONSTRAINT "RenderResult_customizationId_fkey" FOREIGN KEY ("customizationId") REFERENCES "Customization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Add snapshotId to WorkOrder
ALTER TABLE "WorkOrder" ADD COLUMN "snapshotId" TEXT;

-- CreateIndex
CREATE INDEX "WorkOrder_snapshotId_idx" ON "WorkOrder"("snapshotId");

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "Snapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Make Order.designId and Order.productId nullable (backward compatible)
ALTER TABLE "Order" ALTER COLUMN "designId" DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "productId" DROP NOT NULL;

-- CreateIndex: Composite indexes for performance
CREATE INDEX "Order_brandId_status_idx" ON "Order"("brandId", "status");
CREATE INDEX "Order_brandId_createdAt_idx" ON "Order"("brandId", "createdAt");
CREATE INDEX "Design_brandId_status_idx" ON "Design"("brandId", "status");
CREATE INDEX "Product_brandId_isActive_idx" ON "Product"("brandId", "isActive");

-- Migrate existing orders to OrderItem (backward compatible)
-- Note: This will create OrderItems for existing orders
INSERT INTO "OrderItem" ("id", "orderId", "productId", "designId", "quantity", "priceCents", "totalCents", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text as "id",
    o."id" as "orderId",
    COALESCE(o."productId", '') as "productId",
    o."designId",
    1 as "quantity",
    COALESCE(o."subtotalCents", 0) as "priceCents",
    COALESCE(o."subtotalCents", 0) as "totalCents",
    o."createdAt",
    o."updatedAt"
FROM "Order" o
WHERE o."productId" IS NOT NULL AND o."productId" != '';






