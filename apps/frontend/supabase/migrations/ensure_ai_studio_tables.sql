-- Migration: AI Studio - Tables et Index
-- Date: 2025-01-27
-- Description: S'assure que toutes les tables nécessaires pour AI Studio existent

-- 1. Vérifier colonnes crédits sur profiles
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

-- 2. Vérifier table designs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'designs'
  ) THEN
    CREATE TABLE public.designs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      prompt TEXT NOT NULL,
      revised_prompt TEXT,
      preview_url TEXT,
      original_url TEXT,
      status TEXT DEFAULT 'pending',
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  ELSE
    -- Ajouter colonnes manquantes si la table existe déjà
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'designs' 
      AND column_name = 'revised_prompt'
    ) THEN
      ALTER TABLE public.designs ADD COLUMN revised_prompt TEXT;
    END IF;
    
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'designs' 
      AND column_name = 'preview_url'
    ) THEN
      ALTER TABLE public.designs ADD COLUMN preview_url TEXT;
    END IF;
    
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'designs' 
      AND column_name = 'original_url'
    ) THEN
      ALTER TABLE public.designs ADD COLUMN original_url TEXT;
    END IF;
  END IF;
END $$;

-- 3. Index pour designs
CREATE INDEX IF NOT EXISTS idx_designs_user_id ON public.designs(user_id);
CREATE INDEX IF NOT EXISTS idx_designs_created_at ON public.designs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_designs_status ON public.designs(status);

-- 4. RLS Policies pour designs
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Users can view own designs" ON public.designs;
DROP POLICY IF EXISTS "Users can insert own designs" ON public.designs;
DROP POLICY IF EXISTS "Users can update own designs" ON public.designs;

-- Créer les policies
CREATE POLICY "Users can view own designs"
  ON public.designs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own designs"
  ON public.designs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own designs"
  ON public.designs FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Fonction pour déduire crédits atomiquement
CREATE OR REPLACE FUNCTION deduct_credits(user_id UUID, amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Récupérer balance actuelle
  SELECT ai_credits INTO current_balance
  FROM public.profiles
  WHERE id = user_id;
  
  IF current_balance IS NULL THEN
    current_balance := 0;
  END IF;
  
  -- Vérifier si suffisant
  IF current_balance < amount THEN
    RAISE EXCEPTION 'Insufficient credits: % available, % required', current_balance, amount;
  END IF;
  
  -- Déduire atomiquement
  new_balance := current_balance - amount;
  
  UPDATE public.profiles
  SET 
    ai_credits = new_balance,
    ai_credits_used = COALESCE(ai_credits_used, 0) + amount,
    updated_at = NOW()
  WHERE id = user_id;
  
  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;














