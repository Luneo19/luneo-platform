-- Migration SQL pour Product Engine
-- Ajout des champs Product Engine au modèle Product

-- Ajout des champs pour le Product Rules Engine
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "rulesJson" JSONB;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "baseCostCents" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "laborCostCents" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "overheadCostCents" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "materialOptions" JSONB;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "finishOptions" JSONB;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "productionTime" INTEGER;

-- Ajout d'index pour les nouveaux champs
CREATE INDEX IF NOT EXISTS "Product_rulesJson_idx" ON "Product" USING GIN ("rulesJson");
CREATE INDEX IF NOT EXISTS "Product_materialOptions_idx" ON "Product" USING GIN ("materialOptions");
CREATE INDEX IF NOT EXISTS "Product_finishOptions_idx" ON "Product" USING GIN ("finishOptions");

-- Commentaires pour documentation
COMMENT ON COLUMN "Product"."rulesJson" IS 'Configuration du Product Rules Engine (zones, contraintes, pricing)';
COMMENT ON COLUMN "Product"."baseCostCents" IS 'Coût de base de fabrication en centimes';
COMMENT ON COLUMN "Product"."laborCostCents" IS 'Coût de main d''œuvre en centimes';
COMMENT ON COLUMN "Product"."overheadCostCents" IS 'Coûts généraux en centimes';
COMMENT ON COLUMN "Product"."materialOptions" IS 'Options de matériaux disponibles avec pricing';
COMMENT ON COLUMN "Product"."finishOptions" IS 'Options de finitions disponibles avec pricing';
COMMENT ON COLUMN "Product"."productionTime" IS 'Temps de production estimé en heures';


