-- Migration: Système de crédits IA (VERSION CORRIGÉE)
-- Date: 2025-12-20
-- Description: Ajoute le système complet de crédits IA achetables
-- À exécuter sur: https://supabase.com/dashboard/project/obrijgptqztacolemsbk/sql/new

-- 1. Ajouter colonnes crédits sur User (table Prisma) - Version corrigée
DO $$ 
BEGIN
  -- Vérifier si la table User existe
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User') THEN
    -- Ajouter colonnes si elles n'existent pas
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'aiCredits') THEN
      ALTER TABLE "User" ADD COLUMN "aiCredits" INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'aiCreditsPurchased') THEN
      ALTER TABLE "User" ADD COLUMN "aiCreditsPurchased" INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'aiCreditsUsed') THEN
      ALTER TABLE "User" ADD COLUMN "aiCreditsUsed" INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'lastCreditPurchase') THEN
      ALTER TABLE "User" ADD COLUMN "lastCreditPurchase" TIMESTAMP;
    END IF;
  END IF;
END $$;

-- 1b. Ajouter colonnes crédits sur profiles (table Supabase) - Version corrigée
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    -- Ajouter colonnes si elles n'existent pas
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'ai_credits') THEN
      ALTER TABLE public.profiles ADD COLUMN ai_credits INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'ai_credits_purchased') THEN
      ALTER TABLE public.profiles ADD COLUMN ai_credits_purchased INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'ai_credits_used') THEN
      ALTER TABLE public.profiles ADD COLUMN ai_credits_used INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_credit_purchase') THEN
      ALTER TABLE public.profiles ADD COLUMN last_credit_purchase TIMESTAMP;
    END IF;
    
    -- Créer index si n'existe pas
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'profiles' AND indexname = 'idx_profiles_ai_credits') THEN
      CREATE INDEX idx_profiles_ai_credits ON public.profiles(ai_credits);
    END IF;
  END IF;
END $$;

-- 2. Créer table CreditPack (avec noms de colonnes snake_case pour PostgreSQL)
CREATE TABLE IF NOT EXISTS "CreditPack" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "credits" INTEGER NOT NULL,
  "price_cents" INTEGER NOT NULL,
  "stripe_price_id" TEXT,
  "is_active" BOOLEAN DEFAULT true,
  "is_featured" BOOLEAN DEFAULT false,
  "savings" INTEGER,
  "badge" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Créer table CreditTransaction (avec noms de colonnes snake_case)
-- Version corrigée: Vérifier que User existe avant de créer la FK
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'CreditTransaction') THEN
    CREATE TABLE "CreditTransaction" (
      "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      "user_id" TEXT NOT NULL,
      "pack_id" TEXT,
      "amount" INTEGER NOT NULL,
      "balance_before" INTEGER NOT NULL,
      "balance_after" INTEGER NOT NULL,
      "type" TEXT NOT NULL,
      "source" TEXT,
      "metadata" JSONB,
      "stripe_session_id" TEXT,
      "stripe_payment_id" TEXT,
      "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Ajouter FK vers User seulement si User existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User') THEN
      ALTER TABLE "CreditTransaction" 
      ADD CONSTRAINT "CreditTransaction_user_id_fkey" 
      FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;
    
    -- Ajouter FK vers CreditPack (toujours possible car on vient de la créer)
    ALTER TABLE "CreditTransaction" 
    ADD CONSTRAINT "CreditTransaction_pack_id_fkey" 
    FOREIGN KEY ("pack_id") REFERENCES "CreditPack"("id") ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Créer indexes pour performance (version corrigée avec vérifications)
DO $$ 
BEGIN
  -- Indexes pour CreditPack
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'CreditPack' AND indexname = 'CreditPack_is_active_idx') THEN
    CREATE INDEX "CreditPack_is_active_idx" ON "CreditPack"("is_active");
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'CreditPack' AND indexname = 'CreditPack_is_featured_idx') THEN
    CREATE INDEX "CreditPack_is_featured_idx" ON "CreditPack"("is_featured");
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'CreditPack' AND indexname = 'CreditPack_stripe_price_id_idx') THEN
    CREATE INDEX "CreditPack_stripe_price_id_idx" ON "CreditPack"("stripe_price_id");
  END IF;
  
  -- Indexes pour CreditTransaction
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'CreditTransaction' AND indexname = 'CreditTransaction_user_id_idx') THEN
    CREATE INDEX "CreditTransaction_user_id_idx" ON "CreditTransaction"("user_id");
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'CreditTransaction' AND indexname = 'CreditTransaction_type_idx') THEN
    CREATE INDEX "CreditTransaction_type_idx" ON "CreditTransaction"("type");
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'CreditTransaction' AND indexname = 'CreditTransaction_created_at_idx') THEN
    CREATE INDEX "CreditTransaction_created_at_idx" ON "CreditTransaction"("created_at");
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'CreditTransaction' AND indexname = 'CreditTransaction_stripe_session_id_idx') THEN
    CREATE INDEX "CreditTransaction_stripe_session_id_idx" ON "CreditTransaction"("stripe_session_id");
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'CreditTransaction' AND indexname = 'CreditTransaction_pack_id_idx') THEN
    CREATE INDEX "CreditTransaction_pack_id_idx" ON "CreditTransaction"("pack_id");
  END IF;
  
  -- Index pour User (si table existe)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User') THEN
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'User' AND indexname = 'User_aiCredits_idx') THEN
      CREATE INDEX "User_aiCredits_idx" ON "User"("aiCredits");
    END IF;
  END IF;
END $$;

-- 5. Seed packs initiaux (à mettre à jour avec vrais Stripe Price IDs)
INSERT INTO "CreditPack" ("id", "name", "credits", "price_cents", "stripe_price_id", "is_active", "is_featured", "savings", "badge")
VALUES 
  ('pack_100', 'Pack 100', 100, 1900, NULL, true, false, 0, NULL),
  ('pack_500', 'Pack 500', 500, 7900, NULL, true, true, 16, 'Best Value'),
  ('pack_1000', 'Pack 1000', 1000, 13900, NULL, true, false, 26, NULL)
ON CONFLICT ("id") DO NOTHING;

-- 6. Commentaire: Mettre à jour stripe_price_id après création Stripe Products
-- UPDATE "CreditPack" SET "stripe_price_id" = 'price_1ABC...' WHERE id = 'pack_100';
-- UPDATE "CreditPack" SET "stripe_price_id" = 'price_2DEF...' WHERE id = 'pack_500';
-- UPDATE "CreditPack" SET "stripe_price_id" = 'price_3GHI...' WHERE id = 'pack_1000';

-- Vérification finale
DO $$ 
BEGIN
  RAISE NOTICE '✅ Migration crédits IA appliquée avec succès!';
  RAISE NOTICE '📊 Vérification: SELECT COUNT(*) FROM "CreditPack"; (doit retourner 3)';
END $$;




-- Migration: Système de crédits IA (VERSION CORRIGÉE)
-- Date: 2025-12-20
-- Description: Ajoute le système complet de crédits IA achetables
-- À exécuter sur: https://supabase.com/dashboard/project/obrijgptqztacolemsbk/sql/new

-- 1. Ajouter colonnes crédits sur User (table Prisma) - Version corrigée
DO $$ 
BEGIN
  -- Vérifier si la table User existe
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User') THEN
    -- Ajouter colonnes si elles n'existent pas
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'aiCredits') THEN
      ALTER TABLE "User" ADD COLUMN "aiCredits" INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'aiCreditsPurchased') THEN
      ALTER TABLE "User" ADD COLUMN "aiCreditsPurchased" INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'aiCreditsUsed') THEN
      ALTER TABLE "User" ADD COLUMN "aiCreditsUsed" INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'lastCreditPurchase') THEN
      ALTER TABLE "User" ADD COLUMN "lastCreditPurchase" TIMESTAMP;
    END IF;
  END IF;
END $$;

-- 1b. Ajouter colonnes crédits sur profiles (table Supabase) - Version corrigée
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    -- Ajouter colonnes si elles n'existent pas
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'ai_credits') THEN
      ALTER TABLE public.profiles ADD COLUMN ai_credits INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'ai_credits_purchased') THEN
      ALTER TABLE public.profiles ADD COLUMN ai_credits_purchased INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'ai_credits_used') THEN
      ALTER TABLE public.profiles ADD COLUMN ai_credits_used INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_credit_purchase') THEN
      ALTER TABLE public.profiles ADD COLUMN last_credit_purchase TIMESTAMP;
    END IF;
    
    -- Créer index si n'existe pas
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'profiles' AND indexname = 'idx_profiles_ai_credits') THEN
      CREATE INDEX idx_profiles_ai_credits ON public.profiles(ai_credits);
    END IF;
  END IF;
END $$;

-- 2. Créer table CreditPack (avec noms de colonnes snake_case pour PostgreSQL)
CREATE TABLE IF NOT EXISTS "CreditPack" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "credits" INTEGER NOT NULL,
  "price_cents" INTEGER NOT NULL,
  "stripe_price_id" TEXT,
  "is_active" BOOLEAN DEFAULT true,
  "is_featured" BOOLEAN DEFAULT false,
  "savings" INTEGER,
  "badge" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Créer table CreditTransaction (avec noms de colonnes snake_case)
-- Version corrigée: Vérifier que User existe avant de créer la FK
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'CreditTransaction') THEN
    CREATE TABLE "CreditTransaction" (
      "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      "user_id" TEXT NOT NULL,
      "pack_id" TEXT,
      "amount" INTEGER NOT NULL,
      "balance_before" INTEGER NOT NULL,
      "balance_after" INTEGER NOT NULL,
      "type" TEXT NOT NULL,
      "source" TEXT,
      "metadata" JSONB,
      "stripe_session_id" TEXT,
      "stripe_payment_id" TEXT,
      "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Ajouter FK vers User seulement si User existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User') THEN
      ALTER TABLE "CreditTransaction" 
      ADD CONSTRAINT "CreditTransaction_user_id_fkey" 
      FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;
    
    -- Ajouter FK vers CreditPack (toujours possible car on vient de la créer)
    ALTER TABLE "CreditTransaction" 
    ADD CONSTRAINT "CreditTransaction_pack_id_fkey" 
    FOREIGN KEY ("pack_id") REFERENCES "CreditPack"("id") ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Créer indexes pour performance (version corrigée avec vérifications)
DO $$ 
BEGIN
  -- Indexes pour CreditPack
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'CreditPack' AND indexname = 'CreditPack_is_active_idx') THEN
    CREATE INDEX "CreditPack_is_active_idx" ON "CreditPack"("is_active");
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'CreditPack' AND indexname = 'CreditPack_is_featured_idx') THEN
    CREATE INDEX "CreditPack_is_featured_idx" ON "CreditPack"("is_featured");
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'CreditPack' AND indexname = 'CreditPack_stripe_price_id_idx') THEN
    CREATE INDEX "CreditPack_stripe_price_id_idx" ON "CreditPack"("stripe_price_id");
  END IF;
  
  -- Indexes pour CreditTransaction
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'CreditTransaction' AND indexname = 'CreditTransaction_user_id_idx') THEN
    CREATE INDEX "CreditTransaction_user_id_idx" ON "CreditTransaction"("user_id");
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'CreditTransaction' AND indexname = 'CreditTransaction_type_idx') THEN
    CREATE INDEX "CreditTransaction_type_idx" ON "CreditTransaction"("type");
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'CreditTransaction' AND indexname = 'CreditTransaction_created_at_idx') THEN
    CREATE INDEX "CreditTransaction_created_at_idx" ON "CreditTransaction"("created_at");
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'CreditTransaction' AND indexname = 'CreditTransaction_stripe_session_id_idx') THEN
    CREATE INDEX "CreditTransaction_stripe_session_id_idx" ON "CreditTransaction"("stripe_session_id");
  END IF;
  
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'CreditTransaction' AND indexname = 'CreditTransaction_pack_id_idx') THEN
    CREATE INDEX "CreditTransaction_pack_id_idx" ON "CreditTransaction"("pack_id");
  END IF;
  
  -- Index pour User (si table existe)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User') THEN
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'User' AND indexname = 'User_aiCredits_idx') THEN
      CREATE INDEX "User_aiCredits_idx" ON "User"("aiCredits");
    END IF;
  END IF;
END $$;

-- 5. Seed packs initiaux (à mettre à jour avec vrais Stripe Price IDs)
INSERT INTO "CreditPack" ("id", "name", "credits", "price_cents", "stripe_price_id", "is_active", "is_featured", "savings", "badge")
VALUES 
  ('pack_100', 'Pack 100', 100, 1900, NULL, true, false, 0, NULL),
  ('pack_500', 'Pack 500', 500, 7900, NULL, true, true, 16, 'Best Value'),
  ('pack_1000', 'Pack 1000', 1000, 13900, NULL, true, false, 26, NULL)
ON CONFLICT ("id") DO NOTHING;

-- 6. Commentaire: Mettre à jour stripe_price_id après création Stripe Products
-- UPDATE "CreditPack" SET "stripe_price_id" = 'price_1ABC...' WHERE id = 'pack_100';
-- UPDATE "CreditPack" SET "stripe_price_id" = 'price_2DEF...' WHERE id = 'pack_500';
-- UPDATE "CreditPack" SET "stripe_price_id" = 'price_3GHI...' WHERE id = 'pack_1000';

-- Vérification finale
DO $$ 
BEGIN
  RAISE NOTICE '✅ Migration crédits IA appliquée avec succès!';
  RAISE NOTICE '📊 Vérification: SELECT COUNT(*) FROM "CreditPack"; (doit retourner 3)';
END $$;

















