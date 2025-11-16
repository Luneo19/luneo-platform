-- CreateTable
CREATE TABLE "ShopifyInstall" (
    "id" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "webhookSecret" TEXT,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scopes" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "brandId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifyInstall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyInstall_shopDomain_key" ON "ShopifyInstall"("shopDomain");

-- CreateIndex
CREATE INDEX "ShopifyInstall_brandId_idx" ON "ShopifyInstall"("brandId");

-- CreateIndex
CREATE INDEX "ShopifyInstall_shopDomain_idx" ON "ShopifyInstall"("shopDomain");

-- CreateIndex
CREATE INDEX "ShopifyInstall_status_idx" ON "ShopifyInstall"("status");

-- AddForeignKey
ALTER TABLE "ShopifyInstall" ADD CONSTRAINT "ShopifyInstall_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
