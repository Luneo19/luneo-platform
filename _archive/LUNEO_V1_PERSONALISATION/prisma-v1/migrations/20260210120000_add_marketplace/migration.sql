-- Phase 8: Marketplace for templates and assets between brands
-- CreateEnum for MarketplaceItemType and PurchaseStatus
CREATE TYPE "MarketplaceItemType" AS ENUM ('TEMPLATE', 'DESIGN', 'MODEL_3D', 'TEXTURE', 'ANIMATION', 'PROMPT_PACK');

CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'COMPLETED', 'REFUNDED');

-- MarketplaceItem
CREATE TABLE "MarketplaceItem" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "MarketplaceItemType" NOT NULL,
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CHF',
    "previewImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fileUrl" TEXT,
    "fileType" TEXT,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "rating" DECIMAL(3,2),
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarketplaceItem_sellerId_idx" ON "MarketplaceItem"("sellerId");
CREATE INDEX "MarketplaceItem_type_idx" ON "MarketplaceItem"("type");
CREATE INDEX "MarketplaceItem_category_idx" ON "MarketplaceItem"("category");
CREATE INDEX "MarketplaceItem_isActive_isFeatured_idx" ON "MarketplaceItem"("isActive", "isFeatured");

ALTER TABLE "MarketplaceItem" ADD CONSTRAINT "MarketplaceItem_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- MarketplaceReview
CREATE TABLE "MarketplaceReview" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MarketplaceReview_itemId_buyerId_key" ON "MarketplaceReview"("itemId", "buyerId");
CREATE INDEX "MarketplaceReview_itemId_idx" ON "MarketplaceReview"("itemId");

ALTER TABLE "MarketplaceReview" ADD CONSTRAINT "MarketplaceReview_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MarketplaceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketplaceReview" ADD CONSTRAINT "MarketplaceReview_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- MarketplacePurchase
CREATE TABLE "MarketplacePurchase" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CHF',
    "status" "PurchaseStatus" NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplacePurchase_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarketplacePurchase_buyerId_idx" ON "MarketplacePurchase"("buyerId");
CREATE INDEX "MarketplacePurchase_itemId_idx" ON "MarketplacePurchase"("itemId");

ALTER TABLE "MarketplacePurchase" ADD CONSTRAINT "MarketplacePurchase_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MarketplaceItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketplacePurchase" ADD CONSTRAINT "MarketplacePurchase_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
