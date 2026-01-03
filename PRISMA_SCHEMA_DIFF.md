# 📊 DIFF SCHEMA PRISMA - NOUVEAUX MODÈLES

## AJOUTS AU SCHEMA PRISMA

### 1. Modèle DesignSpec

```prisma
// ========================================
// DESIGN SPEC (Versionné, Déterministe)
// ========================================

model DesignSpec {
  id          String   @id @default(cuid())
  specVersion String   @default("1.0.0") // Semantic versioning
  specHash    String   @unique // SHA256 du spec canonique
  spec        Json     // JSON Schema validé, format canonique
  productId   String
  
  // Zone inputs (normalisés)
  zoneInputs  Json     // { zoneId: { text, font, color, size, effect, orientation, ... } }
  
  // Metadata
  metadata    Json?    // Provenance (widget, shopify, api), userAgent, sessionId, etc.
  
  // Relations
  product     Product  @relation("ProductSpecs", fields: [productId], references: [id], onDelete: Cascade)
  
  snapshots   Snapshot[]
  designs     Design[] // Designs générés depuis ce spec
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([specHash])
  @@index([productId])
  @@index([specVersion])
  @@index([createdAt])
  @@index([productId, specHash])
}
```

### 2. Modèle Snapshot

```prisma
// ========================================
// SNAPSHOT (Immuable, Point-in-Time)
// ========================================

model Snapshot {
  id          String   @id @default(cuid())
  specId      String   // Lien vers DesignSpec
  specHash    String   // Dupliqué pour queries rapides (index)
  spec        Json     // Dupliqué pour immutabilité (snapshot du spec au moment T)
  
  // Previews & Exports
  previewUrl      String? // 2D preview (PNG/WebP)
  preview3dUrl    String? // 3D preview (GLTF viewer)
  thumbnailUrl    String? // Thumbnail 200x200
  
  // Production Assets
  productionBundleUrl String? // ZIP avec SVG/DXF/PDF
  arModelUrl          String? // USDZ pour AR
  gltfModelUrl        String? // GLTF pour 3D viewer
  
  // Asset Versions (pour traçabilité)
  assetVersions Json? // [{ url, format, size, hash, createdAt, version }]
  
  // Validation & Lock
  isValidated Boolean  @default(false)
  validatedBy String? // User ID
  validatedAt DateTime?
  isLocked    Boolean  @default(false) // Lock pour empêcher modifications
  lockedAt    DateTime?
  
  // Audit
  createdBy   String? // User ID ou 'widget' ou 'api'
  provenance  Json?   // { source: 'widget'|'shopify'|'api', sessionId, ipAddress, userAgent, widgetVersion }
  
  // Relations
  spec        DesignSpec @relation(fields: [specId], references: [id], onDelete: Restrict)
  orderItems  OrderItem[] // Orders qui utilisent ce snapshot
  workOrders  WorkOrder[] // WorkOrders liés
  customizations Customization[] // Customizations liées
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt // Ne devrait jamais changer (immuable)
  
  @@unique([specHash, validatedAt]) // Un snapshot par specHash validé (si validé)
  @@index([specId])
  @@index([specHash])
  @@index([isValidated])
  @@index([isLocked])
  @@index([createdAt])
  @@index([validatedAt])
  @@index([specHash, isValidated])
}
```

### 3. Modèle OrderItem

```prisma
// ========================================
// ORDER ITEM (Multi-items support)
// ========================================

model OrderItem {
  id          String   @id @default(cuid())
  orderId     String
  productId   String
  designId    String?  // Nullable si pas de design
  snapshotId  String?  // Lien vers Snapshot (immuable)
  quantity    Int      @default(1)
  priceCents  Int      // Prix unitaire au moment de la commande (snapshot)
  totalCents  Int      // priceCents * quantity
  metadata    Json?    // Customization options, line item properties Shopify, etc.
  
  // Relations
  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation("OrderItemProduct", fields: [productId], references: [id], onDelete: Restrict)
  design  Design? @relation("OrderItemDesign", fields: [designId], references: [id], onDelete: SetNull)
  snapshot Snapshot? @relation(fields: [snapshotId], references: [id], onDelete: SetNull)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([orderId])
  @@index([productId])
  @@index([designId])
  @@index([snapshotId])
  @@index([orderId, productId])
}
```

### 4. Modifications Modèles Existants

#### Order

```prisma
model Order {
  // ... champs existants inchangés ...
  
  // Relations
  userId String?
  user   User?   @relation(fields: [userId], references: [id], onDelete: SetNull)

  brandId String
  brand   Brand  @relation(fields: [brandId], references: [id], onDelete: Cascade)

  // NOUVEAU: Multi-items support
  items OrderItem[] // NOUVEAU
  
  // DEPRECATED: Garder pour backward compatibility (rendre nullable)
  designId String?  // DEPRECATED: Utiliser OrderItem.designId
  design   Design?  @relation("OrderDesign", fields: [designId], references: [id], onDelete: Cascade)
  productId String? // DEPRECATED: Utiliser OrderItem.productId
  product   Product? @relation("OrderProduct", fields: [productId], references: [id], onDelete: Cascade)

  customizations Customization[]
  workOrder      WorkOrder?
  quotes         Quote[]

  @@index([userId])
  @@index([brandId])
  @@index([designId]) // Garder pour backward compat
  @@index([productId]) // Garder pour backward compat
  @@index([status])
  @@index([orderNumber])
  @@index([createdAt])
  @@index([brandId, status]) // NOUVEAU: Composite pour performance
  @@index([brandId, createdAt]) // NOUVEAU: Composite pour pagination
}
```

#### Design

```prisma
model Design {
  // ... champs existants inchangés ...
  
  // Relations
  userId String?
  user   User?   @relation(fields: [userId], references: [id], onDelete: SetNull)

  brandId String
  brand   Brand  @relation(fields: [brandId], references: [id], onDelete: Cascade)

  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  // NOUVEAU: Lien vers DesignSpec
  specId   String?
  spec     DesignSpec? @relation(fields: [specId], references: [id], onDelete: SetNull)

  orders         Order[] @relation("OrderDesign") // Relation nommée pour éviter conflit
  orderItems     OrderItem[] @relation("OrderItemDesign") // NOUVEAU
  assets         Asset[]
  customizations Customization[]

  @@index([userId])
  @@index([brandId])
  @@index([productId])
  @@index([status])
  @@index([promptHash])
  @@index([createdAt])
  @@index([specId]) // NOUVEAU
  @@index([brandId, status]) // NOUVEAU: Composite
}
```

#### Customization

```prisma
model Customization {
  // ... champs existants inchangés ...
  
  // Relations
  zoneId String
  zone   Zone   @relation(fields: [zoneId], references: [id], onDelete: Cascade)

  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  userId String?
  user   User?   @relation(fields: [userId], references: [id], onDelete: SetNull)

  brandId String?
  brand   Brand?  @relation(fields: [brandId], references: [id], onDelete: SetNull)

  designId String? // Link to Design if part of a design
  design   Design? @relation(fields: [designId], references: [id], onDelete: SetNull)

  orderId String? // Link to Order if purchased
  order   Order?  @relation(fields: [orderId], references: [id], onDelete: SetNull)
  
  // NOUVEAU: Lien vers Snapshot
  snapshotId String?
  snapshot   Snapshot? @relation(fields: [snapshotId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([productId])
  @@index([zoneId])
  @@index([brandId])
  @@index([status])
  @@index([promptHash])
  @@index([jobId])
  @@index([createdAt])
  @@index([designId])
  @@index([orderId])
  @@index([snapshotId]) // NOUVEAU
}
```

#### RenderResult

```prisma
model RenderResult {
  id           String   @id @default(cuid())
  renderId     String   @unique
  type         String // '2d', '3d', 'preview', 'ar', 'manufacturing'
  status       String // 'pending', 'processing', 'success', 'failed'
  url          String?
  thumbnailUrl String?
  metadata     Json?
  
  // NOUVEAU: Relations Prisma (au lieu de renderId string loose)
  snapshotId   String?
  snapshot     Snapshot? @relation(fields: [snapshotId], references: [id], onDelete: SetNull)
  designId     String?
  design       Design?   @relation(fields: [designId], references: [id], onDelete: SetNull)
  customizationId String?
  customization Customization? @relation(fields: [customizationId], references: [id], onDelete: SetNull)
  
  createdAt    DateTime @default(now())

  @@index([renderId])
  @@index([type])
  @@index([status])
  @@index([snapshotId]) // NOUVEAU
  @@index([designId])   // NOUVEAU
  @@index([customizationId]) // NOUVEAU
  @@index([type, status]) // NOUVEAU: Composite
}
```

#### Product

```prisma
model Product {
  // ... champs existants inchangés ...
  
  // Relations
  brandId String
  brand   Brand  @relation(fields: [brandId], references: [id], onDelete: Cascade)

  designs         Design[]
  orders          Order[] @relation("OrderProduct") // Relation nommée
  orderItems      OrderItem[] @relation("OrderItemProduct") // NOUVEAU
  productMappings ProductMapping[]
  zones           Zone[]
  customizations  Customization[]
  
  // NOUVEAU: Lien vers DesignSpec
  specs           DesignSpec[] @relation("ProductSpecs") // NOUVEAU

  @@index([brandId])
  @@index([isActive])
  @@index([isPublic])
  @@index([brandId, isActive]) // NOUVEAU: Composite
}
```

#### WorkOrder

```prisma
model WorkOrder {
  // ... champs existants inchangés ...
  
  // Relations
  order     Order      @relation(fields: [orderId], references: [id], onDelete: Cascade)
  artisan   Artisan    @relation(fields: [artisanId], references: [id], onDelete: Restrict)
  quote     Quote?     @relation("WorkOrderQuote", fields: [quoteId], references: [id], onDelete: SetNull)
  slaRecord SLARecord?
  
  // NOUVEAU: Lien vers Snapshot (pour production bundle)
  snapshotId String?
  snapshot   Snapshot? @relation(fields: [snapshotId], references: [id], onDelete: SetNull)

  @@index([artisanId])
  @@index([status])
  @@index([slaDeadline])
  @@index([payoutStatus])
  @@index([snapshotId]) // NOUVEAU
}
```

---

## MIGRATIONS PRISMA

### Migration 1: DesignSpec & Snapshot

```sql
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
    "spec" JSONB NOT NULL,
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

-- AddForeignKey
ALTER TABLE "DesignSpec" ADD CONSTRAINT "DesignSpec_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snapshot" ADD CONSTRAINT "Snapshot_specId_fkey" FOREIGN KEY ("specId") REFERENCES "DesignSpec"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

### Migration 2: OrderItem

```sql
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
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "Snapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate existing orders to OrderItem
INSERT INTO "OrderItem" ("id", "orderId", "productId", "designId", "quantity", "priceCents", "totalCents", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text as "id",
    o."id" as "orderId",
    o."productId",
    o."designId",
    1 as "quantity",
    o."subtotalCents" as "priceCents",
    o."subtotalCents" as "totalCents",
    o."createdAt",
    o."updatedAt"
FROM "Order" o
WHERE o."productId" IS NOT NULL;

-- Make designId and productId nullable in Order (backward compatible)
ALTER TABLE "Order" ALTER COLUMN "designId" DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "productId" DROP NOT NULL;
```

### Migration 3: Relations Snapshot

```sql
-- AddForeignKey for Design.specId
ALTER TABLE "Design" ADD COLUMN "specId" TEXT;

-- CreateIndex
CREATE INDEX "Design_specId_idx" ON "Design"("specId");

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_specId_fkey" FOREIGN KEY ("specId") REFERENCES "DesignSpec"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey for Customization.snapshotId
ALTER TABLE "Customization" ADD COLUMN "snapshotId" TEXT;

-- CreateIndex
CREATE INDEX "Customization_snapshotId_idx" ON "Customization"("snapshotId");

-- AddForeignKey
ALTER TABLE "Customization" ADD CONSTRAINT "Customization_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "Snapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey for RenderResult relations
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

-- AddForeignKey for WorkOrder.snapshotId
ALTER TABLE "WorkOrder" ADD COLUMN "snapshotId" TEXT;

-- CreateIndex
CREATE INDEX "WorkOrder_snapshotId_idx" ON "WorkOrder"("snapshotId");

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "Snapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

### Migration 4: Index Composites

```sql
-- Composite indexes for performance
CREATE INDEX "Order_brandId_status_idx" ON "Order"("brandId", "status");
CREATE INDEX "Order_brandId_createdAt_idx" ON "Order"("brandId", "createdAt");
CREATE INDEX "Design_brandId_status_idx" ON "Design"("brandId", "status");
CREATE INDEX "Product_brandId_isActive_idx" ON "Product"("brandId", "isActive");
```

---

## PLAN DE DÉPLOIEMENT MIGRATIONS

### 1. Staging
```bash
# Appliquer migrations
cd apps/backend
npx prisma migrate deploy

# Vérifier données migrées
npx prisma studio
```

### 2. Production
```bash
# Backup DB
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Maintenance window
# Appliquer migrations
npx prisma migrate deploy

# Vérifier
# Rollback si nécessaire (voir scripts rollback/)
```

### 3. Rollback Scripts

**Fichier** : `apps/backend/prisma/migrations/rollback/rollback_order_items.sql`

```sql
-- Rollback OrderItem migration
-- ATTENTION: Perte de données si OrderItem créés après migration

-- Supprimer OrderItems
DELETE FROM "OrderItem";

-- Restaurer NOT NULL sur Order
ALTER TABLE "Order" ALTER COLUMN "designId" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "productId" SET NOT NULL;

-- Supprimer table
DROP TABLE "OrderItem";
```

---

**FIN DU DIFF PRISMA**






